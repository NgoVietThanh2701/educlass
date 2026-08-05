import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { RolesUser } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { CourseProgressResponseDto } from './dto/course-progress-response.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Enrolled successfully')
  @ApiOperation({ summary: 'Enroll student to a course (Only Student)' })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created successfully',
    type: EnrollmentResponseDto,
  })
  enroll(@Param('courseId') courseId: string, @CurrentUser('id') studentId: string) {
    return this.enrollmentsService.enroll(courseId, studentId);
  }

  @Get('me')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved my enrollments successfully')
  @ApiOperation({ summary: 'Get all enrollments of current student (Only Student)' })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto, isArray: true })
  findMyEnrollments(@CurrentUser('id') studentId: string) {
    return this.enrollmentsService.findMyEnrollments(studentId);
  }

  @Get('me/progress')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved my course progress successfully')
  @ApiOperation({ summary: 'Get aggregated learning progress for all enrolled courses (Only Student)' })
  @ApiResponse({ status: 200, type: CourseProgressResponseDto, isArray: true })
  getMyCourseProgress(@CurrentUser('id') studentId: string) {
    return this.enrollmentsService.getMyCourseProgress(studentId);
  }

  @Get(':courseId/progress')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved course progress successfully')
  @ApiOperation({ summary: 'Get aggregated learning progress for one course (Only Student)' })
  @ApiResponse({ status: 200, type: CourseProgressResponseDto })
  getCourseProgress(@Param('courseId') courseId: string, @CurrentUser('id') studentId: string) {
    return this.enrollmentsService.getCourseProgress(studentId, courseId);
  }

  @Patch(':courseId/:studentId/status')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Updated enrollment status successfully')
  @ApiOperation({ summary: 'Update enrollment status by teacher' })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  updateStatus(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollmentsService.updateStatus(courseId, studentId, teacherId, dto.status);
  }
}
