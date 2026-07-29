import { Injectable, Logger } from '@nestjs/common';
import {
  attemptSelect,
  attemptSelectResponse,
  ExamQuestionForScoring,
  toAttemptResponse,
} from './attempt.mapper';
import { PrismaService } from '@prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { AttemptListResponseDto, AttemptResponseDto } from './dto/attempt-response.dto';
import { AttemptStatus, ExamSessionStatus, Prisma, QuestionType, RoleUser } from '@prisma/client';
import { AppException } from '@common/exceptions/app.exception';
import { PrismaErrorCode } from '@common/constants/prisma-error.constant';
import { SyncAnswersDto } from './dto/sync-answers.dto';
import { QueryAttemptDto } from './dto/query-attempt.dto';

@Injectable()
export class ExamAttemptService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(ExamAttemptService.name);

  // ===================== START ATTEMPT =====================
  async startAttempt(studentId: string, dto: CreateAttemptDto): Promise<AttemptResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.ensureSessionOpenForStudent(dto.sessionId, studentId, tx);

      const now = new Date();
      const examDurationMs = session.exam.duration * 60000;
      const deadlineByDuration = new Date(now.getTime() + examDurationMs);
      const deadlineAt = new Date(Math.min(deadlineByDuration.getTime(), session.endAt.getTime()));

      try {
        const attempt = await tx.examAttempt.create({
          data: {
            sessionId: dto.sessionId,
            studentId,
            startedAt: now,
            deadlineAt,
            status: AttemptStatus.IN_PROGRESS,
          },
          select: attemptSelectResponse,
        });
        return toAttemptResponse(attempt);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION
        ) {
          throw AppException.conflict('You have already started an attempt for this session');
        }
        throw error;
      }
    });
  }

  // === Get all attempts for teacher
  findAllByTeacher(teacherId: string, query: QueryAttemptDto): Promise<AttemptListResponseDto> {
    const where: Prisma.ExamAttemptWhereInput = {};

    // Chỉ xem attempt thuộc lớp của teacher này
    where.session = { class: { teacherId } };

    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.classId) where.session = { ...where.session, classId: query.classId };
    if (query.status) where.status = query.status;

    if (query.search) {
      where.student = {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { userName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.queryAttempts(where, query);
  }

  findMyAttempts(studentId: string, query: QueryAttemptDto): Promise<AttemptListResponseDto> {
    const where: Prisma.ExamAttemptWhereInput = {
      studentId,
    };

    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.classId) where.session = { classId: query.classId };
    if (query.status) where.status = query.status;

    return this.queryAttempts(where, query);
  }

  // ===================== GET ATTEMPT DETAILS =====================
  async findOne(attemptId: string, userId: string, role: string): Promise<AttemptResponseDto> {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: Prisma.validator<Prisma.ExamAttemptSelect>()({
        ...attemptSelectResponse,
        session: {
          select: {
            id: true,
            startAt: true,
            endAt: true,
            class: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      }),
    });
    if (!attempt) throw AppException.notFound('Attempt not found');

    if (role === RoleUser.TEACHER && attempt.session.class.teacherId !== userId) {
      throw AppException.forbidden('You are not authorized to view this attempt');
    } else if (role === RoleUser.STUDENT && attempt.studentId !== userId) {
      throw AppException.forbidden('You can only view your own attempts');
    }

    return toAttemptResponse(attempt);
  }

  // ===================== SYNC ANSWERS (AUTO-SAVE) =====================
  async syncAnswers(attemptId: string, studentId: string, dto: SyncAnswersDto) {
    // Validate trùng lặp
    const questionIdsInRequest = dto.answers.map((a) => a.questionId);
    if (new Set(questionIdsInRequest).size !== questionIdsInRequest.length) {
      throw AppException.badRequest('Duplicate questionId in request');
    }
    for (const ans of dto.answers) {
      if (new Set(ans.optionIds).size !== ans.optionIds.length) {
        throw AppException.badRequest(`Duplicate optionIds for question ${ans.questionId}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const attempt = await this.getActiveAttempt(attemptId, studentId, tx);
      if (new Date() > attempt.deadlineAt) {
        throw AppException.badRequest('Attempt time is over');
      }

      // 3. Validate từng câu trả lời
      const questionMap = new Map(attempt.session.exam.questions.map((q) => [q.id, q]));
      for (const ans of dto.answers) {
        const question = questionMap.get(ans.questionId);
        if (!question) {
          throw AppException.badRequest(`Question ${ans.questionId} does not belong to this exam`);
        }
        if (question.type === QuestionType.SINGLE && ans.optionIds.length > 1) {
          throw AppException.badRequest(`Question ${ans.questionId} only allows one answer`);
        }
        const validOptionIds = new Set(question.options.map((o) => o.id));
        for (const oid of ans.optionIds) {
          if (!validOptionIds.has(oid)) {
            throw AppException.badRequest(
              `Option ${oid} is not valid for question ${ans.questionId}`,
            );
          }
        }
      }

      // 4. Thay thế đáp án
      const newAnswers = dto.answers.flatMap((a) =>
        a.optionIds.map((oid) => ({
          attemptId,
          questionId: a.questionId,
          optionId: oid,
        })),
      );

      await this.replaceAnswers(attemptId, questionIdsInRequest, newAnswers, tx);
    });
  }

  // ===================== SUBMIT (KHÔNG CẦN ANSWERS TỪ FRONTEND) =====================
  async submitAttempt(attemptId: string, studentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const attempt = await this.getActiveAttempt(attemptId, studentId, tx);

      const now = new Date();
      if (now > attempt.deadlineAt) {
        await this.autoTimeoutAttemptInTx(attemptId, tx);
        throw AppException.badRequest('Attempt time is over, auto-submitted');
      }

      const score = this.calculateScoreFromAnswers(attempt.answers, attempt.session.exam.questions);

      // Chỉ submit nếu vẫn IN_PROGRESS (tránh race condition)
      const result = await tx.examAttempt.updateMany({
        where: { id: attemptId, status: AttemptStatus.IN_PROGRESS },
        data: { finishedAt: now, score, status: AttemptStatus.SUBMITTED },
      });
      if (result.count === 0) {
        throw AppException.conflict('Attempt has already been submitted or timed out');
      }

      const updated = await tx.examAttempt.findUnique({
        where: { id: attemptId },
        select: attemptSelectResponse,
      });
      return toAttemptResponse(updated!);
    });
  }

  // ===================== TIMEOUT HÀNG LOẠT =====================
  async timeoutExpiredAttempts() {
    const now = new Date();
    const expiredAttempts = await this.prisma.examAttempt.findMany({
      where: { status: AttemptStatus.IN_PROGRESS, deadlineAt: { lte: now } },
      select: { id: true },
    });
    const results = await Promise.allSettled(
      expiredAttempts.map(({ id }) => this.autoTimeoutAttempt(id)),
    );
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(`Failed to timeout attempt ${expiredAttempts[index].id}`, result.reason);
      }
    });
  }

  // ===================== PRIVATE HELPERS =====================

  private async queryAttempts(where: Prisma.ExamAttemptWhereInput, query: QueryAttemptDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';

    const [total, attempts] = await Promise.all([
      this.prisma.examAttempt.count({ where }),
      this.prisma.examAttempt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
        select: attemptSelect,
      }),
    ]);

    return {
      data: attempts.map(toAttemptResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async ensureSessionOpenForStudent(
    sessionId: string,
    studentId: string,
    tx: Prisma.TransactionClient,
  ) {
    const session = await tx.examSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        endAt: true,
        startAt: true,
        class: { select: { classStudents: { where: { studentId }, select: { studentId: true } } } },
        exam: { select: { duration: true } },
      },
    });
    if (!session) throw AppException.notFound('Session not found');
    if (session.status !== ExamSessionStatus.OPEN) {
      throw AppException.badRequest('Session is not open for attempts');
    }
    if (session.class.classStudents.length === 0) {
      throw AppException.forbidden('You are not enrolled in the class of this session');
    }
    return session;
  }

  private calculateScoreFromAnswers(
    answers: { questionId: string; optionId: string }[],
    questions: ExamQuestionForScoring[],
  ): number {
    const answerMap = new Map<string, Set<string>>();
    for (const a of answers) {
      if (!answerMap.has(a.questionId)) answerMap.set(a.questionId, new Set());
      answerMap.get(a.questionId)!.add(a.optionId);
    }
    return this.scoreQuestions(answerMap, questions);
  }

  private scoreQuestions(
    answerMap: Map<string, Set<string>>,
    questions: ExamQuestionForScoring[],
  ): number {
    let total = 0;
    for (const q of questions) {
      const selected = answerMap.get(q.id) ?? new Set<string>();
      const correct = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
      if (selected.size === correct.size && [...correct].every((id) => selected.has(id))) {
        total += q.score.toNumber();
      }
    }
    return total;
  }

  private async autoTimeoutAttempt(attemptId: string) {
    try {
      await this.prisma.$transaction(async (tx) => this.autoTimeoutAttemptInTx(attemptId, tx));
    } catch (error) {
      this.logger.error(`Timeout attempt ${attemptId} failed`, error);
    }
  }

  private async autoTimeoutAttemptInTx(attemptId: string, tx: Prisma.TransactionClient) {
    const attempt = await tx.examAttempt.findUnique({
      where: { id: attemptId },
      select: attemptSelect,
    });
    if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) return;

    const score = this.calculateScoreFromAnswers(attempt.answers, attempt.session.exam.questions);

    await tx.examAttempt.updateMany({
      where: { id: attemptId, status: AttemptStatus.IN_PROGRESS },
      data: { finishedAt: new Date(), score, status: AttemptStatus.TIMEOUT },
    });
  }

  private async replaceAnswers(
    attemptId: string,
    questionIds: string[],
    newAnswers: Prisma.StudentAnswerCreateManyInput[],
    tx: Prisma.TransactionClient,
  ) {
    // Xoá tất cả đáp án cũ của các câu hỏi được sync
    await tx.studentAnswer.deleteMany({
      where: { attemptId, questionId: { in: questionIds } },
    });
    // Tạo mới nếu có dữ liệu
    if (newAnswers.length > 0) {
      await tx.studentAnswer.createMany({ data: newAnswers });
    }
  }

  private async getActiveAttempt(
    attemptId: string,
    studentId: string,
    tx: Prisma.TransactionClient,
  ) {
    const attempt = await tx.examAttempt.findUnique({
      where: { id: attemptId },
      select: attemptSelect,
    });

    if (!attempt) throw AppException.notFound('Attempt not found');
    if (attempt.studentId !== studentId) throw AppException.forbidden('Not your attempt');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw AppException.badRequest('Attempt is not in progress');
    }
    return attempt;
  }
}
