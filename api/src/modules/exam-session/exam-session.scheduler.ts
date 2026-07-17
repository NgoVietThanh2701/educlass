// src/modules/exam-session/exam-session.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExamSessionStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ExamSessionScheduler {
  private readonly logger = new Logger(ExamSessionScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  // Chạy mỗi phút để kiểm tra
  @Cron(CronExpression.EVERY_MINUTE)
  async handleSessionStatusTransitions() {
    this.logger.debug('Checking for sessions to open or close...');

    // Dùng transaction để tránh race condition
    await this.prisma.$transaction(async (tx) => {
      // 1. Mở các session SCHEDULED đã đến giờ (startAt <= now)
      const openResult = await tx.examSession.updateMany({
        where: {
          status: ExamSessionStatus.SCHEDULED,
          startAt: { lte: new Date() },
        },
        data: { status: ExamSessionStatus.OPEN },
      });
      if (openResult.count > 0) {
        this.logger.log(`Opened ${openResult.count} sessions`);
      }

      // 2. Đóng các session OPEN đã quá hạn (startAt + exam.duration + sessionDelayMinutes <= now)
      // Cần join với Exam để lấy duration
      const expiredSessions = await tx.examSession.findMany({
        where: {
          status: ExamSessionStatus.OPEN,
        },
        select: {
          id: true,
          startAt: true,
          sessionDelayMinutes: true,
          exam: { select: { duration: true } },
        },
      });

      const idsToClose: string[] = [];
      const now = new Date();

      for (const session of expiredSessions) {
        const endTime = new Date(
          session.startAt.getTime() + (session.exam.duration + session.sessionDelayMinutes) * 60000,
        );
        if (endTime <= now) {
          idsToClose.push(session.id);
        }
      }

      if (idsToClose.length > 0) {
        await tx.examSession.updateMany({
          where: { id: { in: idsToClose } },
          data: { status: ExamSessionStatus.CLOSED },
        });
        this.logger.log(`Closed ${idsToClose.length} sessions`);
      }

      // 3. Có thể xử lý các ExamAttempt IN_PROGRESS thuộc session vừa đóng -> tự động nộp bài (sẽ làm ở Attempt module)
    });
  }
}
