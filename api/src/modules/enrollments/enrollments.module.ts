import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { ChatModule } from '@modules/chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
