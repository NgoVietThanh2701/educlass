import { Module } from '@nestjs/common';
import { CourseAccessModule } from '@common/course-access.module';
import { AttachmentService } from '@common/services/attachment.service';
import { PrismaModule } from '@prisma/prisma.module';
import { PublicCoursesController } from './public-courses.controller';
import { TeacherCoursesController } from './teacher-courses.controller';
import { StudentCoursesController } from './student-courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule, CourseAccessModule],
  controllers: [PublicCoursesController, TeacherCoursesController, StudentCoursesController],
  providers: [CoursesService, AttachmentService],
  exports: [CoursesService],
})
export class CoursesModule {}
