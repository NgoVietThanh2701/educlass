import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AddOptionDto } from './dto/add-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { AssessmentStatus, Prisma, QuestionType } from '@prisma/client';
import { assessmentSelect, toAssessmentResponse } from './mapper/assessment.mapper';
import { AppException } from '@common/exceptions/app.exception';
import {
  assessmentDetailSelect,
  toAssessmentDetailResponse,
} from './mapper/assessment-detail.mapper';
import { questionSelect, toQuestionResponse } from './mapper/question.mapper';
import { optionSelect, toOptionResponse } from './mapper/option.mapper';
import { ErrorCode } from '@common/exceptions/error-codes.exception';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== ASSESSMENT CRUD =====================
  async create(teacherId: string, dto: CreateAssessmentDto) {
    const lastAssessment = await this.prisma.assessment.findFirst({
      where: { sectionId: dto.sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const assessment = await this.prisma.assessment.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        shuffleOptions: dto.shuffleOptions ?? false,
        sectionId: dto.sectionId,
        order: (lastAssessment?.order ?? 0) + 1,
      },
      select: assessmentSelect,
    });
    return toAssessmentResponse(assessment);
  }

  async reorderQuestions(assessmentId: string, orderedIds: string[]) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, status: true, archivedAt: true },
    });
    if (!assessment) throw AppException.notFound('Assessment not found');
    if (assessment.archivedAt !== null || assessment.status !== AssessmentStatus.DRAFT) {
      throw AppException.badRequest('Assessment status not DRAFT');
    }

    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      select: { id: true },
    });
    const existingIds = new Set(questions.map((question) => question.id));
    if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
      throw AppException.badRequest(
        'Ordered question list does not match the assessment questions',
      );
    }

    // `[assessmentId, order]` is a UNIQUE constraint, so we first move every
    // question to a unique temporary negative order, then to its final 1..n order.
    await this.prisma.$transaction([
      ...orderedIds.map((id, index) =>
        this.prisma.assessmentQuestion.update({
          where: { id },
          data: { order: -(index + 1) },
          select: { id: true },
        }),
      ),
      ...orderedIds.map((id, index) =>
        this.prisma.assessmentQuestion.update({
          where: { id },
          data: { order: index + 1 },
          select: { id: true },
        }),
      ),
    ]);

    return { orderedIds };
  }

  async findAll(sectionId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { sectionId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      select: assessmentSelect,
    });
    return assessments.map(toAssessmentResponse);
  }

  async findOne(assessmentId: string, sectionId: string) {
    await this.ensureAssessmentExists(assessmentId, sectionId);
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: assessmentDetailSelect,
    });

    if (!assessment) throw AppException.notFound('Assessment not found');

    return toAssessmentDetailResponse(assessment);
  }

  async update(assessmentId: string, sectionId: string, dto: UpdateAssessmentDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
      const updated = await tx.assessment.update({
        where: { id: assessmentId },
        data: dto,
        select: assessmentSelect,
      });
      return toAssessmentResponse(updated);
    });
  }

  async changeStatus(assessmentId: string, sectionId: string, newStatus: AssessmentStatus) {
    return this.prisma.$transaction(async (tx) => {
      const assessment = await this.ensureAssessmentExists(assessmentId, sectionId, tx);
      const currentStatus = assessment.status;

      const allowedTransitions: Record<AssessmentStatus, AssessmentStatus[]> = {
        [AssessmentStatus.DRAFT]: [AssessmentStatus.PUBLISHED, AssessmentStatus.ARCHIVED],
        [AssessmentStatus.PUBLISHED]: [AssessmentStatus.DRAFT, AssessmentStatus.ARCHIVED],
        [AssessmentStatus.ARCHIVED]: [AssessmentStatus.DRAFT],
      };

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw AppException.badRequest(
          `Dont transfer assessment state from ${currentStatus} to ${newStatus}`,
        );
      }

      // Nếu chuyển từ PUBLISHED sang DRAFT hoặc ARCHIVED -> kiểm tra session
      if (newStatus === AssessmentStatus.PUBLISHED) {
        await this.validateAssessmentBeforePublish(assessmentId, tx);
      }

      const updated = await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          status: newStatus,
          archivedAt: newStatus === AssessmentStatus.ARCHIVED ? new Date() : null,
        },
        select: assessmentSelect,
      });
      return toAssessmentResponse(updated);
    });
  }

  // ===================== QUESTION CRUD =====================
  async addQuestion(assessmentId: string, sectionId: string, dto: AddQuestionDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
        this.validateOptionsArray(dto.options, dto.type ?? QuestionType.SINGLE);

        const lastQuestion = await tx.assessmentQuestion.findFirst({
          where: { assessmentId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        const nextOrder = (lastQuestion?.order ?? 0) + 1;

        const question = await tx.assessmentQuestion.create({
          data: {
            assessmentId,
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
    assessmentId: string,
    questionId: string,
    sectionId: string,
    dto: UpdateQuestionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
      const question = await this.ensureQuestionBelongsToAssessment(questionId, assessmentId, tx);

      // Nếu đổi type, kiểm tra options hiện tại
      if (dto.type && dto.type !== question.type) {
        const options = await tx.assessmentOption.findMany({
          where: { questionId },
          select: { isCorrect: true },
        });
        this.validateOptionsArray(options, dto.type);
      }

      const updated = await tx.assessmentQuestion.update({
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

  async deleteQuestion(assessmentId: string, questionId: string, sectionId: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
      await this.ensureQuestionBelongsToAssessment(questionId, assessmentId, tx);

      await tx.assessmentQuestion.delete({ where: { id: questionId } });

      // Sắp xếp lại order các câu hỏi còn lại
      const questions = await tx.assessmentQuestion.findMany({
        where: { assessmentId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      await Promise.all(
        questions.map((q, idx) =>
          tx.assessmentQuestion.update({ where: { id: q.id }, data: { order: idx + 1 } }),
        ),
      );
    });
  }

  // ===================== OPTION CRUD =====================
  async addOption(assessmentId: string, questionId: string, sectionId: string, dto: AddOptionDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
        await this.ensureQuestionBelongsToAssessment(questionId, assessmentId, tx);

        const last = await tx.assessmentOption.findFirst({
          where: { questionId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        const created = await tx.assessmentOption.create({
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
    assessmentId: string,
    questionId: string,
    optionId: string,
    sectionId: string,
    dto: UpdateOptionDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
        await this.ensureQuestionBelongsToAssessment(questionId, assessmentId, tx);
        await this.ensureOptionBelongsToQuestion(optionId, questionId, tx);

        const updated = await tx.assessmentOption.update({
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

  async deleteOption(
    assessmentId: string,
    questionId: string,
    optionId: string,
    sectionId: string,
  ) {
    await this.prisma.$transaction(
      async (tx) => {
        await this.ensureAssessmentEditable(assessmentId, sectionId, tx);
        await this.ensureQuestionBelongsToAssessment(questionId, assessmentId, tx);
        await this.ensureOptionBelongsToQuestion(optionId, questionId, tx);

        const count = await tx.assessmentOption.count({ where: { questionId } });
        if (count <= 2) {
          throw AppException.badRequest('Câu hỏi phải có ít nhất 2 lựa chọn');
        }

        await tx.assessmentOption.delete({ where: { id: optionId } });
        await this.reorderOptions(questionId, tx);
        await this.validateQuestionOptionsInDb(questionId, tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // ===================== PRIVATE HELPERS =====================

  // Kiểm tra assessment tồn tại trong section
  private async ensureAssessmentExists(
    assessmentId: string,
    sectionId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const assessment = await tx.assessment.findFirst({
      where: { id: assessmentId, sectionId },
      select: { id: true, status: true, archivedAt: true },
    });
    if (!assessment) throw AppException.notFound('Assessment not found');
    return assessment;
  }

  private async ensureAssessmentEditable(
    assessmentId: string,
    sectionId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const assessment = await this.ensureAssessmentExists(assessmentId, sectionId, tx);
    if (assessment.archivedAt !== null || assessment.status !== AssessmentStatus.DRAFT) {
      throw AppException.badRequest(
        'Assessment status not DRAFT',
        ErrorCode.BAD_REQUEST_EXAM_STATUS,
      );
    }
    return assessment;
  }

  private async ensureQuestionBelongsToAssessment(
    questionId: string,
    assessmentId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const question = await tx.assessmentQuestion.findFirst({
      where: { id: questionId, assessmentId },
      select: questionSelect,
    });
    if (!question) throw AppException.notFound('Question not exists assessment');
    return question;
  }

  // Kiểm tra option thuộc question
  private async ensureOptionBelongsToQuestion(
    optionId: string,
    questionId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const option = await tx.assessmentOption.findFirst({
      where: { id: optionId, questionId },
      select: { id: true },
    });
    if (!option) throw AppException.notFound('Option not found');
  }

  // Validate mảng options
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
    const options = await tx.assessmentOption.findMany({
      where: { questionId },
      select: { isCorrect: true },
    });
    const question = await tx.assessmentQuestion.findUnique({
      where: { id: questionId },
      select: { type: true },
    });
    if (!question) throw AppException.notFound('Question not found');
    this.validateOptionsArray(options, question.type);
  }

  private async validateAssessmentBeforePublish(
    assessmentId: string,
    tx: Prisma.TransactionClient,
  ) {
    const questions = await tx.assessmentQuestion.findMany({
      where: { assessmentId },
      select: {
        id: true,
        type: true,
        score: true,
        options: { select: { isCorrect: true } },
      },
    });

    if (questions.length === 0) {
      throw AppException.badRequest('Assessment must have at least 1 question');
    }
    for (const q of questions) {
      if (q.score.lte(0)) throw AppException.badRequest('Score question must than > 0');
      this.validateOptionsArray(q.options, q.type);
    }
  }

  private async reorderOptions(questionId: string, tx: Prisma.TransactionClient) {
    const options = await tx.assessmentOption.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    await Promise.all(
      options.map((opt, idx) =>
        tx.assessmentOption.update({ where: { id: opt.id }, data: { order: idx + 1 } }),
      ),
    );
  }
}
