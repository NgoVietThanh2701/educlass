import { Module } from '@nestjs/common';
import { ExamSessionController } from './exam-session.controller';
import { ExamSessionService } from './exam-session.service';
import { PrismaModule } from '@prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamSessionScheduler } from './exam-session.scheduler';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [ExamSessionController],
  providers: [ExamSessionService, ExamSessionScheduler],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}
