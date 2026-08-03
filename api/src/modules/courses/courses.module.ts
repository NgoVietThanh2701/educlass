import { Module } from '@nestjs/common';
import { AttachmentService } from '@common/services/attachment.service';
import { PrismaModule } from '@prisma/prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService, AttachmentService],
  exports: [CoursesService],
})
export class CoursesModule {}
