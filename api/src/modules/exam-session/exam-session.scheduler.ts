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
    this.logger.debug('Checking for sessions to open or close exam...');

    // Dùng transaction để tránh race condition
    const now = new Date();

    const opened = await this.prisma.examSession.updateMany({
      where: {
        status: ExamSessionStatus.SCHEDULED,
        startAt: { lte: now },
      },
      data: {
        status: ExamSessionStatus.OPEN,
      },
    });
    if (opened.count) this.logger.log(`Opened ${opened.count} sessions`);

    const closed = await this.prisma.examSession.updateMany({
      where: {
        status: ExamSessionStatus.OPEN,
        endAt: { lte: now },
      },
      data: { status: ExamSessionStatus.CLOSED },
    });
    if (closed.count) this.logger.log(`Closed ${closed.count} sessions`);

    // 3. Có thể xử lý các ExamAttempt IN_PROGRESS thuộc session vừa đóng -> tự động nộp bài (sẽ làm ở Attempt module)
  }
}
