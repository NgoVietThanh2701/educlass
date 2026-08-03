import { Module } from '@nestjs/common';
import { AssessmentAttemptService } from './assessment-attempt.service';
import { AssessmentAttemptController } from './assessment-attempt.controller';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  exports: [AssessmentAttemptService],
  providers: [AssessmentAttemptService],
  controllers: [AssessmentAttemptController],
})
export class AssessmentAttemptModule {}
