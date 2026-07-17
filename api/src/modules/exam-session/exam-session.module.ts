import { Module } from '@nestjs/common';
import { ExamSessionController } from './exam-session.controller';
import { ExamSessionService } from './exam-session.service';
import { PrismaModule } from '@prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [ExamSessionController],
  providers: [ExamSessionService],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}
