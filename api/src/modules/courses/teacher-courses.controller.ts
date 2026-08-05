import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { RolesUser } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { AppException } from '@common/exceptions/app.exception';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { UPLOAD_IMAGE_MIME_TYPES, UPLOAD_MAX_FILE_SIZE } from '@common/constants/upload.constant';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseSwaggerBody } from './dto/create-course-swagger.body';
import { CourseResponseDto } from './dto/course-response.dto';
import { UpdateCourseDto, ChangeCourseStatusDto } from './dto/update-course.dto';
import { CourseTeacherListItemDto } from './dto/course-list-item.dto';
import { CourseTeacherDetailDto } from './dto/course-teacher-detail.dto';
import { CoursesService } from './courses.service';

@ApiTags('Teacher Courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RolesUser(RoleUser.TEACHER)
@Controller('teacher/courses')
export class TeacherCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @SuccessMessage('Created course successfully')
  @ApiOperation({ summary: 'Create a new course with optional thumbnail image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCourseSwaggerBody })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: UPLOAD_MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (UPLOAD_IMAGE_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  @ApiResponse({ status: 201, type: CourseResponseDto })
  create(
    @CurrentUser('id') teacherId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCourseDto,
  ) {
    if (file && !file.buffer) {
      throw AppException.badRequest('No file uploaded or file type not allowed');
    }

    return this.coursesService.create(teacherId, dto, file);
  }

  @Get()
  @SuccessMessage('Retrieved courses successfully')
  @ApiOperation({ summary: 'Get all courses created by the current teacher' })
  @ApiResponse({ status: 200, type: CourseTeacherListItemDto, isArray: true })
  findAllByTeacher(@CurrentUser('id') teacherId: string) {
    return this.coursesService.findAllByTeacher(teacherId);
  }

  @Get(':courseId')
  @SuccessMessage('Retrieved course detail successfully')
  @ApiOperation({summary: `Get course detail with sections, lessons, and assessments for editing`})
  @ApiResponse({ status: 200, type: CourseTeacherDetailDto })
  findTeacherDetail(@Param('courseId') courseId: string, @CurrentUser('id') teacherId: string) {
    return this.coursesService.findTeacherDetail(courseId, teacherId);
  }

  @Patch(':courseId/status')
  @SuccessMessage('Updated course status successfully')
  @ApiOperation({ summary: 'Change course status' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  changeStatus(
    @Param('courseId') courseId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: ChangeCourseStatusDto,
  ) {
    return this.coursesService.changeStatus(courseId, teacherId, dto.status);
  }

  @Patch(':courseId')
  @SuccessMessage('Updated course successfully')
  @ApiOperation({ summary: 'Update course metadata' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  update(
    @Param('courseId') courseId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(courseId, teacherId, dto);
  }
}
