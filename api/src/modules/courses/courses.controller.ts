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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { UPLOAD_IMAGE_MIME_TYPES, UPLOAD_MAX_FILE_SIZE } from '@common/constants/upload.constant';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RolesUser(RoleUser.TEACHER)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @SuccessMessage('Created course successfully')
  @ApiOperation({ summary: 'Create a new course with optional thumbnail image' })
  @ApiConsumes('multipart/form-data')
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
  @ApiResponse({ status: 201, description: 'Course created successfully', type: CourseResponseDto })
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
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Retrieved courses successfully')
  @ApiOperation({ summary: 'Get all courses of current teacher' })
  @ApiResponse({ status: 200, type: CourseResponseDto, isArray: true })
  findAllByTeacher(@CurrentUser('id') teacherId: string): Promise<CourseResponseDto[]> {
    return this.coursesService.findAllByTeacher(teacherId);
  }

  @Get('student')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved enrolled courses successfully')
  @ApiOperation({ summary: 'Get all courses enrolled by the current student' })
  @ApiResponse({ status: 200, type: CourseResponseDto, isArray: true })
  findAllByStudent(@CurrentUser('id') studentId: string): Promise<CourseResponseDto[]> {
    return this.coursesService.findAllByStudent(studentId);
  }

  @Get(':courseId')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Retrieved course successfully')
  @ApiOperation({ summary: 'Get course detail' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  findOne(@Param('courseId') courseId: string, @CurrentUser('id') teacherId: string) {
    return this.coursesService.findOne(courseId, teacherId);
  }

  @Get('student/:courseId')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved course successfully')
  @ApiOperation({ summary: 'Student: Get course detail for an enrolled course' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  findOneForStudent(@Param('courseId') courseId: string, @CurrentUser('id') studentId: string) {
    return this.coursesService.findOneForStudent(courseId, studentId);
  }

  @Patch(':courseId')
  @SuccessMessage('Updated course successfully')
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 200, type: CourseResponseDto })
  update(
    @Param('courseId') courseId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(courseId, teacherId, dto);
  }
}
