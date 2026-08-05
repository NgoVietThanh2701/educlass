import { Module } from '@nestjs/common';
import { CourseAccessModule } from '@common/course-access.module';
import { PrismaModule } from '@prisma/prisma.module';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';

@Module({
  imports: [PrismaModule, CourseAccessModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
