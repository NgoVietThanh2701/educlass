import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // điều chỉnh đường dẫn
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AddOptionDto } from './dto/add-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { QuestionType, ExamStatus, Prisma } from '@prisma/client';
import { examSelect, toExamResponse } from './mapper/exam.mapper';
import { AppException } from '@common/exceptions/app.exception';
import { examDetailSelect, toExamDetailResponse } from './mapper/exam-detail.mapper';
import { questionSelect, toQuestionResponse } from './mapper/question.mapper';
import { optionSelect, toOptionResponse } from './mapper/option.mapper';
import { ErrorCode } from '@common/exceptions/error-codes.exception';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== EXAM CRUD =====================
  async create(teacherId: string, dto: CreateExamDto) {
    const exam = await this.prisma.exam.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        shuffleOptions: dto.shuffleOptions ?? false,
        teacherId,
      },
      select: examSelect,
    });
    return toExamResponse(exam);
  }

  async findAll(teacherId: string) {
    const exams = await this.prisma.exam.findMany({
      where: { teacherId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      select: examSelect,
    });
    return exams.map(toExamResponse);
  }

  async findOne(examId: string, teacherId: string) {
    // Dùng ensureExamBelongsToTeacher để kiểm tra quyền, lấy detail
    await this.ensureExamExists(examId, teacherId);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: examDetailSelect,
    });

    if (!exam) throw AppException.notFound('Exam not found');

    return toExamDetailResponse(exam);
  }

  async update(examId: string, teacherId: string, dto: UpdateExamDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureExamEditable(examId, teacherId, tx);
      // Không cần check lại status DRAFT vì ensureExamEditable đã làm
      const updated = await tx.exam.update({
        where: { id: examId },
        data: dto,
        select: examSelect,
      });
      return toExamResponse(updated);
    });
  }

  // Thay đổi trạng thái đề
  async changeStatus(examId: string, teacherId: string, newStatus: ExamStatus) {
    return this.prisma.$transaction(async (tx) => {
      const exam = await this.ensureExamExists(examId, teacherId, tx);
      const currentStatus = exam.status;

      // Xác định các luồng chuyển hợp lệ
      const allowedTransitions: Record<ExamStatus, ExamStatus[]> = {
        [ExamStatus.DRAFT]: [ExamStatus.PUBLISHED, ExamStatus.ARCHIVED],
        [ExamStatus.PUBLISHED]: [ExamStatus.DRAFT, ExamStatus.ARCHIVED],
        [ExamStatus.ARCHIVED]: [ExamStatus.DRAFT],
      };

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw AppException.badRequest(
          `Dont transfer exam state from ${currentStatus} to ${newStatus}`,
        );
      }

      // Nếu chuyển từ PUBLISHED sang DRAFT hoặc ARCHIVED -> kiểm tra session
      if (currentStatus === ExamStatus.PUBLISHED && newStatus !== ExamStatus.PUBLISHED) {
        await this.ensureNoActiveSessions(examId, tx);
      }

      // B3: Nếu chuyển sang PUBLISHED, kiểm tra điều kiện đề thi
      if (newStatus === ExamStatus.PUBLISHED) {
        await this.validateExamBeforePublish(examId, tx);
      }

      const updated = await tx.exam.update({
        where: { id: examId },
        data: {
          status: newStatus,
          archivedAt: currentStatus === ExamStatus.ARCHIVED ? null : new Date(),
        },
        select: examSelect,
      });
      return toExamResponse(updated);
    });
  }

  // ===================== QUESTION CRUD =====================
  async addQuestion(examId: string, teacherId: string, dto: AddQuestionDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureExamEditable(examId, teacherId, tx);
        this.validateOptionsArray(dto.options, dto.type ?? QuestionType.SINGLE);

        const lastQuestion = await tx.examQuestion.findFirst({
          where: { examId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        const nextOrder = (lastQuestion?.order ?? 0) + 1;

        const question = await tx.examQuestion.create({
          data: {
            examId,
            content: dto.content,
            explanation: dto.explanation,
            score: dto.score ?? 1,
            order: nextOrder,
            type: dto.type ?? QuestionType.SINGLE,
            options: {
              create: dto.options.map((option, index) => ({
                content: option.content,
                isCorrect: option.isCorrect ?? false,
                order: index + 1,
              })),
            },
          },
          select: questionSelect,
        });

        return toQuestionResponse(question);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateQuestion(
    examId: string,
    questionId: string,
    teacherId: string,
    dto: UpdateQuestionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureExamEditable(examId, teacherId, tx);
      const question = await this.ensureQuestionBelongsToExam(questionId, examId, tx);

      // Nếu đổi type, kiểm tra options hiện tại
      if (dto.type && dto.type !== question.type) {
        const options = await tx.questionOption.findMany({
          where: { questionId },
          select: { isCorrect: true },
        });
        this.validateOptionsArray(options, dto.type);
      }

      const updated = await tx.examQuestion.update({
        where: { id: questionId },
        data: {
          content: dto.content,
          explanation: dto.explanation,
          score: dto.score,
          type: dto.type,
        },
        select: questionSelect,
      });
      return toQuestionResponse(updated);
    });
  }

  async deleteQuestion(examId: string, questionId: string, teacherId: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.ensureExamEditable(examId, teacherId, tx);
      await this.ensureQuestionBelongsToExam(questionId, examId, tx);

      await tx.examQuestion.delete({ where: { id: questionId } });

      // Sắp xếp lại order các câu hỏi còn lại
      const questions = await tx.examQuestion.findMany({
        where: { examId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      await Promise.all(
        questions.map((q, idx) =>
          tx.examQuestion.update({ where: { id: q.id }, data: { order: idx + 1 } }),
        ),
      );
    });
  }

  // ===================== OPTION CRUD =====================
  async addOption(examId: string, questionId: string, teacherId: string, dto: AddOptionDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureExamEditable(examId, teacherId, tx);
        await this.ensureQuestionBelongsToExam(questionId, examId, tx);

        const last = await tx.questionOption.findFirst({
          where: { questionId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        const created = await tx.questionOption.create({
          data: {
            questionId,
            content: dto.content,
            isCorrect: dto.isCorrect ?? false,
            order: (last?.order ?? 0) + 1,
          },
          select: optionSelect,
        });

        await this.validateQuestionOptionsInDb(questionId, tx);
        return toOptionResponse(created);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateOption(
    examId: string,
    questionId: string,
    optionId: string,
    teacherId: string,
    dto: UpdateOptionDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureExamEditable(examId, teacherId, tx);
        await this.ensureQuestionBelongsToExam(questionId, examId, tx);
        await this.ensureOptionBelongsToQuestion(optionId, questionId, tx);

        const updated = await tx.questionOption.update({
          where: { id: optionId },
          data: dto,
          select: optionSelect,
        });

        await this.validateQuestionOptionsInDb(questionId, tx);
        return toOptionResponse(updated);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async deleteOption(examId: string, questionId: string, optionId: string, teacherId: string) {
    await this.prisma.$transaction(
      async (tx) => {
        await this.ensureExamEditable(examId, teacherId, tx);
        await this.ensureQuestionBelongsToExam(questionId, examId, tx);
        await this.ensureOptionBelongsToQuestion(optionId, questionId, tx);

        const count = await tx.questionOption.count({ where: { questionId } });
        if (count <= 2) {
          throw AppException.badRequest('Câu hỏi phải có ít nhất 2 lựa chọn');
        }

        await tx.questionOption.delete({ where: { id: optionId } });
        await this.reorderOptions(questionId, tx);
        await this.validateQuestionOptionsInDb(questionId, tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // ===================== PRIVATE HELPERS =====================

  // Kiểm tra exam tồn tại, thuộc teacher
  private async ensureExamExists(
    examId: string,
    teacherId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const exam = await tx.exam.findFirst({
      where: { id: examId, teacherId },
      select: { id: true, status: true, archivedAt: true },
    });
    if (!exam) throw AppException.notFound('Exam not found');
    return exam;
  }

  // Đảm bảo exam thuộc teacher và đang ở trạng thái DRAFT
  private async ensureExamEditable(
    examId: string,
    teacherId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const exam = await this.ensureExamExists(examId, teacherId, tx);
    if (exam.archivedAt !== null || exam.status !== ExamStatus.DRAFT) {
      throw AppException.badRequest('Exam status not DRAFT', ErrorCode.BAD_REQUEST_EXAM_STATUS);
    }
    return exam;
  }

  // Kiểm tra câu hỏi thuộc exam
  private async ensureQuestionBelongsToExam(
    questionId: string,
    examId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const question = await tx.examQuestion.findFirst({
      where: { id: questionId, examId },
      select: questionSelect, // dùng select nhẹ hơn, chỉ cần id và type
    });
    if (!question) throw AppException.notFound('Question not exists exam');
    return question;
  }

  // Kiểm tra option thuộc question
  private async ensureOptionBelongsToQuestion(
    optionId: string,
    questionId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const option = await tx.questionOption.findFirst({
      where: { id: optionId, questionId },
      select: { id: true },
    });
    if (!option) throw AppException.notFound('Option not found');
  }

  // Validate mảng options (dùng cho cả khi tạo mới và kiểm tra sau khi sửa)
  private validateOptionsArray(options: { isCorrect?: boolean }[], type: QuestionType) {
    if (options.length < 2) {
      throw AppException.badRequest('Câu hỏi phải có ít nhất 2 lựa chọn');
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (type === QuestionType.SINGLE && correctCount !== 1) {
      throw AppException.badRequest('Câu hỏi SINGLE phải có đúng 1 đáp án đúng');
    }
    if (type === QuestionType.MULTIPLE && correctCount < 1) {
      throw AppException.badRequest('Câu hỏi MULTIPLE phải có ít nhất 1 đáp án đúng');
    }
  }

  // Lấy options từ DB và validate
  private async validateQuestionOptionsInDb(questionId: string, tx: Prisma.TransactionClient) {
    const options = await tx.questionOption.findMany({
      where: { questionId },
      select: { isCorrect: true },
    });
    const question = await tx.examQuestion.findUnique({
      where: { id: questionId },
      select: { type: true },
    });
    if (!question) throw AppException.notFound('Question not found');
    this.validateOptionsArray(options, question.type);
  }

  private async validateExamBeforePublish(examId: string, tx: Prisma.TransactionClient) {
    const questions = await tx.examQuestion.findMany({
      where: { examId },
      select: {
        id: true,
        type: true,
        score: true,
        options: { select: { isCorrect: true } },
      },
    });

    if (questions.length === 0) {
      throw AppException.badRequest('Exam must at least 1 question');
    }
    for (const q of questions) {
      if (q.score.lte(0)) throw AppException.badRequest('Score question must than > 0');
      this.validateOptionsArray(q.options, q.type);
    }
  }

  private async reorderOptions(questionId: string, tx: Prisma.TransactionClient) {
    const options = await tx.questionOption.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    await Promise.all(
      options.map((opt, idx) =>
        tx.questionOption.update({ where: { id: opt.id }, data: { order: idx + 1 } }),
      ),
    );
  }

  private async ensureNoActiveSessions(examId: string, tx: Prisma.TransactionClient) {
    const activeSessionCount = await tx.examSession.count({
      where: {
        examId,
        status: { not: 'CLOSED' }, // SCHEDULED hoặc OPEN
      },
    });

    if (activeSessionCount > 0) {
      throw AppException.badRequest('Exam have session exam');
    }
  }
}
