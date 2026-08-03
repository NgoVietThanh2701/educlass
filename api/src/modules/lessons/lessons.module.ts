import { Module } from '@nestjs/common';
import { AttachmentService } from '@common/services/attachment.service';
import { PrismaModule } from '@prisma/prisma.module';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [LessonsService, AttachmentService],
  exports: [LessonsService],
})
export class LessonsModule {}
