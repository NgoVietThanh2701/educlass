import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { RolesUser } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { CourseListItemDto } from './dto/course-list-item.dto';
import { CourseStudentDetailDto } from './dto/course-student-detail.dto';
import { CoursesService } from './courses.service';

@ApiTags('Student Courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RolesUser(RoleUser.STUDENT)
@Controller('student/courses')
export class StudentCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @SuccessMessage('Retrieved enrolled courses successfully')
  @ApiOperation({ summary: 'Get all courses the current student is enrolled in' })
  @ApiResponse({ status: 200, type: CourseListItemDto, isArray: true })
  findAllByStudent(@CurrentUser('id') studentId: string) {
    return this.coursesService.findAllByStudent(studentId);
  }

  @Get(':courseId')
  @SuccessMessage('Retrieved course detail successfully')
  @ApiOperation({ summary: 'Get enrolled course detail with progress and unlock status' })
  @ApiResponse({ status: 200, type: CourseStudentDetailDto })
  findStudentDetail(@Param('courseId') courseId: string, @CurrentUser('id') studentId: string) {
    return this.coursesService.findStudentDetail(courseId, studentId);
  }
}
