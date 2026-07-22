import { Module } from '@nestjs/common';
import { ExamSessionController } from './exam-session.controller';
import { ExamSessionService } from './exam-session.service';
import { PrismaModule } from '@prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamSessionScheduler } from './exam-session.scheduler';
import { ExamAttemptModule } from '@modules/exam-attempt/exam-attempt.module';

@Module({
  imports: [PrismaModule, ExamAttemptModule, ScheduleModule],
  controllers: [ExamSessionController],
  providers: [ExamSessionService, ExamSessionScheduler],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}
