import { Injectable } from '@nestjs/common';
import { ExamSessionStatus, ExamStatus, Prisma } from '@prisma/client';
import { examSessionSelect, toExamSessionResponse } from './exam-session.mapper';
import { PrismaService } from '@prisma/prisma.service';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { AppException } from '@common/exceptions/app.exception';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { ExamSessionResponseDto } from './dto/exam-session-response.dto';

@Injectable()
export class ExamSessionService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== CREATE =====================
  async create(teacherId: string, dto: CreateExamSessionDto): Promise<ExamSessionResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      // Kiểm tra exam tồn tại, thuộc teacher, đang PUBLISHED
      await this.ensureExamPublished(dto.examId, teacherId, tx);
      // Kiểm tra class tồn tại, thuộc teacher, chưa archive
      await this.ensureClassOwnership(dto.classId, teacherId, tx);

      // Kiểm tra thời gian bắt đầu phải trong tương lai (tuỳ chọn)
      if (dto.startAt <= new Date()) {
        throw AppException.badRequest('Start time must > current time');
      }

      // Tạo session
      const session = await tx.examSession.create({
        data: {
          examId: dto.examId,
          classId: dto.classId,
          name: dto.name,
          startAt: dto.startAt,
          sessionDelayMinutes: dto.sessionDelayMinutes ?? 0,
          status: ExamSessionStatus.SCHEDULED,
        },
        select: examSessionSelect,
      });

      return toExamSessionResponse(session);
    });
  }

  // ===================== FIND ALL (TEACHER) =====================
  async findAllByTeacher(teacherId: string): Promise<ExamSessionResponseDto[]> {
    const sessions = await this.prisma.examSession.findMany({
      where: {
        class: { teacherId, archivedAt: null },
        exam: { teacherId, archivedAt: null },
      },
      orderBy: { startAt: 'desc' },
      select: examSessionSelect,
    });
    return sessions.map(toExamSessionResponse);
  }

  // ===================== FIND ALL (STUDENT) =====================
  async findAllByStudent(studentId: string): Promise<ExamSessionResponseDto[]> {
    const sessions = await this.prisma.examSession.findMany({
      where: {
        class: {
          classStudents: { some: { studentId } },
          archivedAt: null,
        },
        exam: { archivedAt: null },
      },
      orderBy: { startAt: 'desc' },
      select: examSessionSelect,
    });
    return sessions.map(toExamSessionResponse);
  }

  // ===================== FIND ONE =====================
  async findOne(sessionId: string, userId: string, role: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      select: examSessionSelect,
    });
    if (!session) throw AppException.notFound('Session not found');

    // Kiểm tra quyền: teacher sở hữu class hoặc student trong class
    if (role === 'TEACHER') {
      if (session.class.teacherId !== userId) {
        throw AppException.forbidden('User not premission');
      }
    } else if (role === 'STUDENT') {
      const isMember = await this.prisma.classStudent.findUnique({
        where: {
          classId_studentId: {
            classId: session.classId,
            studentId: userId,
          },
        },
      });
      if (!isMember) throw AppException.forbidden('User not premission');
    }

    return toExamSessionResponse(session);
  }

  // ===================== UPDATE =====================
  async update(
    sessionId: string,
    teacherId: string,
    dto: UpdateExamSessionDto,
  ): Promise<ExamSessionResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.ensureSessionExists(sessionId, tx);
      this.ensureTeacherOwnership(session.class.teacherId, teacherId);

      // Chỉ cho phép sửa khi chưa CLOSED
      if (session.status === ExamSessionStatus.CLOSED) {
        throw AppException.badRequest('Dont update session with status is close');
      }

      // Nếu cập nhật startAt, kiểm tra thời gian tương lai
      if (dto.startAt && dto.startAt <= new Date()) {
        throw AppException.badRequest('StartAt must > current time');
      }

      const updated = await tx.examSession.update({
        where: { id: sessionId },
        data: {
          name: dto.name,
          startAt: dto.startAt ? new Date(dto.startAt) : undefined,
          sessionDelayMinutes: dto.sessionDelayMinutes,
        },
        select: examSessionSelect,
      });

      return toExamSessionResponse(updated);
    });
  }

  // ===================== CHANGE STATUS (manual) =====================
  async changeStatus(sessionId: string, teacherId: string, newStatus: ExamSessionStatus) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.ensureSessionExists(sessionId, tx);
      this.ensureTeacherOwnership(session.class.teacherId, teacherId);

      const currentStatus = session.status;

      // Định nghĩa luồng chuyển hợp lệ
      const allowedTransitions: Record<ExamSessionStatus, ExamSessionStatus[]> = {
        [ExamSessionStatus.SCHEDULED]: [ExamSessionStatus.OPEN, ExamSessionStatus.CLOSED],
        [ExamSessionStatus.OPEN]: [ExamSessionStatus.CLOSED],
        [ExamSessionStatus.CLOSED]: [], // không thể chuyển từ CLOSED
      };

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw AppException.badRequest(
          `Cant not transfer state from ${currentStatus} to ${newStatus}`,
        );
      }

      // Logic tự động: khi mở session (OPEN) có thể kiểm tra thời gian? (tuỳ chọn)
      if (newStatus === ExamSessionStatus.OPEN) {
        // Kiểm tra xem đã đến giờ mở chưa? Có thể cho mở sớm hoặc bắt buộc đúng giờ
        // Hiện tại không bắt buộc, teacher có thể mở thủ công
      }

      // Nếu đóng session (CLOSED), có thể cập nhật thêm thông tin? không cần

      const updated = await tx.examSession.update({
        where: { id: sessionId },
        data: { status: newStatus },
        select: examSessionSelect,
      });

      // Nếu session chuyển sang CLOSED, có thể xử lý tự động nộp bài cho các attempt đang IN_PROGRESS? (để module Attempt lo)
      return toExamSessionResponse(updated);
    });
  }

  // ===================== DELETE =====================
  async delete(sessionId: string, teacherId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await this.ensureSessionExists(sessionId, tx);
      this.ensureTeacherOwnership(session.class.teacherId, teacherId);

      // Chỉ cho phép xoá khi SCHEDULED (chưa bắt đầu)
      if (session.status !== ExamSessionStatus.SCHEDULED) {
        throw AppException.badRequest('Only delete session with status is SCHEDULED');
      }

      await tx.examSession.delete({ where: { id: sessionId } });
    });
  }

  // ===================== PRIVATE HELPERS =====================
  private async ensureExamPublished(
    examId: string,
    teacherId: string,
    tx: Prisma.TransactionClient,
  ) {
    const exam = await tx.exam.findFirst({
      where: { id: examId, teacherId, archivedAt: null },
      select: { status: true },
    });
    if (!exam) throw AppException.notFound('Exam not found');
    if (exam.status !== ExamStatus.PUBLISHED) {
      throw AppException.badRequest('Exam status is DRAFT');
    }
  }

  private async ensureClassOwnership(
    classId: string,
    teacherId: string,
    tx: Prisma.TransactionClient,
  ) {
    const cls = await tx.class.findFirst({
      where: { id: classId, teacherId, archivedAt: null },
      select: { id: true },
    });
    if (!cls) throw AppException.notFound('Class not found or you are not the owner');
  }

  private async ensureSessionExists(sessionId: string, tx: Prisma.TransactionClient) {
    const session = await tx.examSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        class: { select: { teacherId: true } },
      },
    });
    if (!session) throw AppException.notFound('Session not found');
    return session;
  }

  private ensureTeacherOwnership(teacherIdSession: string, teacherId: string) {
    if (teacherIdSession !== teacherId) {
      throw AppException.forbidden('You not permission');
    }
  }
}
