import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { CourseAccessService } from './services/course-access.service';

@Module({
  imports: [PrismaModule],
  providers: [CourseAccessService],
  exports: [CourseAccessService],
})
export class CourseAccessModule {}
