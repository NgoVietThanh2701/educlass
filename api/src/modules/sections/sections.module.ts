import { Module } from '@nestjs/common';
import { CourseAccessModule } from '@common/course-access.module';
import { AttachmentService } from '@common/services/attachment.service';
import { PrismaModule } from '@prisma/prisma.module';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';

@Module({
  imports: [PrismaModule, CourseAccessModule],
  controllers: [SectionsController],
  providers: [SectionsService, AttachmentService],
  exports: [SectionsService],
})
export class SectionsModule {}
