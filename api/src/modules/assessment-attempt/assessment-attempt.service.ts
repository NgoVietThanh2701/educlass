import { Injectable, Logger } from '@nestjs/common';
import {
  attemptSelect,
  attemptSelectResponse,
  AssessmentQuestionForScoring,
  AttemptMapperInput,
  QuestionResultInput,
  toAttemptResponse,
} from './attempt.mapper';
import { PrismaService } from '@prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { AttemptListResponseDto, AttemptResponseDto } from './dto/attempt-response.dto';
import { AttemptStatus, AssessmentStatus, Prisma, QuestionType, RoleUser } from '@prisma/client';
import { AppException } from '@common/exceptions/app.exception';
import { SyncAnswersDto } from './dto/sync-answers.dto';
import { QueryAttemptDto } from './dto/query-attempt.dto';

@Injectable()
export class AssessmentAttemptService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AssessmentAttemptService.name);

  async startAttempt(studentId: string, dto: CreateAttemptDto): Promise<AttemptResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.findUnique({
        where: { id: dto.assessmentId },
        select: { id: true, duration: true, status: true, maxAttempts: true },
      });

      if (!assessment) throw AppException.notFound('Assessment not found');
      if (assessment.status !== AssessmentStatus.PUBLISHED) {
        throw AppException.badRequest('Assessment is not available for attempts');
      }

      const existingCount = await tx.assessmentAttempt.count({
        where: { assessmentId: assessment.id, studentId },
      });
      if (assessment.maxAttempts !== null && existingCount >= assessment.maxAttempts) {
        throw AppException.conflict('Maximum attempts reached');
      }

      const now = new Date();
      const attemptNumber = existingCount + 1;
      const deadlineAt = this.calcDeadline(now, Number(assessment.duration));

      const attempt: AttemptMapperInput = await tx.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentId,
          attemptNumber,
          startedAt: now,
          status: AttemptStatus.IN_PROGRESS,
        },
        select: attemptSelectResponse,
      });

      return toAttemptResponse(attempt, deadlineAt);
    });
  }

  findAllByTeacher(teacherId: string, query: QueryAttemptDto): Promise<AttemptListResponseDto> {
    const where: Prisma.AssessmentAttemptWhereInput = {
      assessment: {
        section: {
          course: { teacherId },
        },
      },
    };

    if (query.assessmentId) where.assessmentId = query.assessmentId;
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
    const where: Prisma.AssessmentAttemptWhereInput = {
      studentId,
    };

    if (query.assessmentId) where.assessmentId = query.assessmentId;
    if (query.status) where.status = query.status;

    return this.queryAttempts(where, query);
  }

  async findOne(attemptId: string, userId: string, role: string): Promise<AttemptResponseDto> {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: attemptSelect,
    });
    if (!attempt) throw AppException.notFound('Attempt not found');

    if (role === RoleUser.TEACHER && attempt.assessment.section.course.teacherId !== userId) {
      throw AppException.forbidden('Not authorized');
    } else if (role === RoleUser.STUDENT && attempt.studentId !== userId) {
      throw AppException.forbidden('Not authorized');
    }

    const deadlineAt = this.calcDeadline(attempt.startedAt, Number(attempt.assessment.duration));
    return toAttemptResponse(attempt, deadlineAt);
  }

  async syncAnswers(attemptId: string, studentId: string, dto: SyncAnswersDto) {
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
      const deadlineAt = this.calcDeadline(attempt.startedAt, Number(attempt.assessment.duration));
      if (new Date() > deadlineAt) {
        throw AppException.badRequest('Attempt time is over');
      }

      const questions = (attempt.assessment.questions ?? []) as AssessmentQuestionForScoring[];
      const questionMap = new Map(questions.map((q) => [q.id, q] as const));
      for (const ans of dto.answers) {
        const question = questionMap.get(ans.questionId);
        if (!question) {
          throw AppException.badRequest(
            `Question ${ans.questionId} does not belong to this assessment`,
          );
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

      const newAnswers = dto.answers.flatMap((a) =>
        a.optionIds.map((oid) => ({
          attemptId,
          optionId: oid,
        })),
      );

      await this.replaceAnswers(attemptId, newAnswers, tx);
    });
  }

  async submitAttempt(attemptId: string, studentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const attempt = await this.getActiveAttempt(attemptId, studentId, tx);
      const now = new Date();
      const deadlineAt = this.calcDeadline(attempt.startedAt, Number(attempt.assessment.duration));

      // Attempt is past the deadline — the server scores it as TIMEOUT and
      // returns the full scored attempt (so the student still sees their result
      // instead of a 400 that hides the outcome).
      if (now > deadlineAt) {
        const scored = await this.autoTimeoutAttemptInTx(attemptId, tx);
        if (!scored) {
          throw AppException.conflict('Attempt already submitted or timed out');
        }
        const updated = await tx.assessmentAttempt.findUnique({
          where: { id: attemptId },
          select: attemptSelectResponse,
        });
        if (!updated) throw AppException.notFound('Attempt not found');
        return toAttemptResponse(updated, deadlineAt, scored.questionResults);
      }

      const { score, questionResults } = this.calculateScoreFromAnswers(
        attempt.answers,
        attempt.assessment.questions ?? [],
      );
      const assessment = await tx.assessment.findUnique({
        where: { id: attempt.assessmentId },
        select: { passingScore: true },
      });
      const passed = score >= Number(assessment?.passingScore ?? 50);

      const result = await tx.assessmentAttempt.updateMany({
        where: { id: attemptId, status: AttemptStatus.IN_PROGRESS },
        data: { finishedAt: now, score, status: AttemptStatus.SUBMITTED, passed },
      });
      if (result.count === 0) {
        throw AppException.conflict('Attempt already submitted or timed out');
      }

      const updated = await tx.assessmentAttempt.findUnique({
        where: { id: attemptId },
        select: attemptSelectResponse,
      });
      if (!updated) throw AppException.notFound('Attempt not found');

      return toAttemptResponse(updated, deadlineAt, questionResults);
    });
  }

  async timeoutExpiredAttempts() {
    const now = new Date();
    const allActive = (await this.prisma.assessmentAttempt.findMany({
      where: { status: AttemptStatus.IN_PROGRESS },
      select: { id: true, startedAt: true, assessment: { select: { duration: true } } },
    })) as Array<{ id: string; startedAt: Date; assessment: { duration: number } }>;

    const expired = allActive.filter(
      (a) => now.getTime() - a.startedAt.getTime() >= Number(a.assessment.duration) * 60000,
    );

    const results = await Promise.allSettled(expired.map((a) => this.autoTimeoutAttempt(a.id)));
    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        this.logger.error(`Timeout attempt ${expired[idx].id} failed`, res.reason);
      }
    });
  }

  private async queryAttempts(where: Prisma.AssessmentAttemptWhereInput, query: QueryAttemptDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';

    const [total, attempts] = await Promise.all([
      this.prisma.assessmentAttempt.count({ where }),
      this.prisma.assessmentAttempt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
        select: attemptSelect,
      }),
    ]);

    return {
      data: attempts.map((a) =>
        toAttemptResponse(a, this.calcDeadline(a.startedAt, Number(a.assessment.duration))),
      ),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private calculateScoreFromAnswers(
    answers: Array<{ optionId: string; option?: { questionId: string } }>,
    questions: AssessmentQuestionForScoring[],
  ): { score: number; questionResults: QuestionResultInput[] } {
    const answerMap = new Map<string, Set<string>>();
    for (const a of answers) {
      const questionId = a.option?.questionId;
      if (!questionId) continue;
      if (!answerMap.has(questionId)) answerMap.set(questionId, new Set());
      answerMap.get(questionId)!.add(a.optionId);
    }
    return this.scoreQuestions(answerMap, questions);
  }

  private scoreQuestions(
    answerMap: Map<string, Set<string>>,
    questions: AssessmentQuestionForScoring[],
  ): { score: number; questionResults: QuestionResultInput[] } {
    let total = 0;
    const questionResults: QuestionResultInput[] = [];
    for (const q of questions) {
      const selected = answerMap.get(q.id) ?? new Set<string>();
      const correct = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
      const isCorrect =
        selected.size > 0 &&
        selected.size === correct.size &&
        [...correct].every((id) => selected.has(id));
      if (isCorrect) total += q.score.toNumber();
      questionResults.push({
        questionId: q.id,
        correct: isCorrect,
        correctOptionIds: [...correct],
      });
    }
    return { score: total, questionResults };
  }

  private async autoTimeoutAttempt(attemptId: string) {
    try {
      await this.prisma.$transaction(async (tx) => this.autoTimeoutAttemptInTx(attemptId, tx));
    } catch (error) {
      this.logger.error(`Timeout attempt ${attemptId} failed`, error);
    }
  }

  private async autoTimeoutAttemptInTx(
    attemptId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ score: number; questionResults: QuestionResultInput[] } | null> {
    const attempt = await tx.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: attemptSelect,
    });
    if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) return null;

    const { score, questionResults } = this.calculateScoreFromAnswers(
      attempt.answers,
      attempt.assessment.questions ?? [],
    );
    const assessment = await tx.assessment.findUnique({
      where: { id: attempt.assessmentId },
      select: { passingScore: true },
    });
    const passed = score >= Number(assessment?.passingScore ?? 50);

    await tx.assessmentAttempt.updateMany({
      where: { id: attemptId, status: AttemptStatus.IN_PROGRESS },
      data: { finishedAt: new Date(), score, status: AttemptStatus.TIMEOUT, passed },
    });
    return { score, questionResults };
  }

  private async replaceAnswers(
    attemptId: string,
    newAnswers: { attemptId: string; optionId: string }[],
    tx: Prisma.TransactionClient,
  ) {
    await tx.studentAnswer.deleteMany({
      where: { attemptId },
    });
    if (newAnswers.length > 0) {
      await tx.studentAnswer.createMany({ data: newAnswers, skipDuplicates: true });
    }
  }

  private async getActiveAttempt(
    attemptId: string,
    studentId: string,
    tx: Prisma.TransactionClient,
  ) {
    const attempt = await tx.assessmentAttempt.findUnique({
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

  private calcDeadline(startedAt: Date, durationMinutes: number): Date {
    return new Date(startedAt.getTime() + durationMinutes * 60000);
  }
}
