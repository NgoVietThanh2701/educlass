import { Module } from '@nestjs/common';
import { ExamAttemptService } from './exam-attempt.service';
import { ExamAttemptController } from './exam-attempt.controller';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  exports: [ExamAttemptService],
  providers: [ExamAttemptService],
  controllers: [ExamAttemptController],
})
export class ExamAttemptModule {}
