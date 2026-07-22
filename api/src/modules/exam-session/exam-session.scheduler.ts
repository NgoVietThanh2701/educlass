// src/modules/exam-session/exam-session.scheduler.ts
import { ExamAttemptService } from '@modules/exam-attempt/exam-attempt.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExamSessionStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ExamSessionScheduler {
  private readonly logger = new Logger(ExamSessionScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly examAttemptService: ExamAttemptService,
  ) {}

  // Chạy mỗi phút để kiểm tra
  @Cron(CronExpression.EVERY_MINUTE)
  async handleSessionStatusTransitions() {
    const now = new Date();

    this.logger.log('Check scheduler for exam session...');

    try {
      const opened = await this.prisma.examSession.updateMany({
        where: { status: ExamSessionStatus.SCHEDULED, startAt: { lte: now } },
        data: { status: ExamSessionStatus.OPEN },
      });
      if (opened.count) this.logger.log(`Opened ${opened.count} sessions`);

      const closed = await this.prisma.examSession.updateMany({
        where: { status: ExamSessionStatus.OPEN, endAt: { lte: now } },
        data: { status: ExamSessionStatus.CLOSED },
      });
      if (closed.count) this.logger.log(`Closed ${closed.count} sessions`);
    } catch (error) {
      this.logger.error(
        'Failed to update session statuses',
        error instanceof Error ? error.stack : String(error),
      );
    }

    try {
      await this.examAttemptService.timeoutExpiredAttempts();
    } catch (error) {
      this.logger.error(
        'Failed to timeout expired attempts',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
