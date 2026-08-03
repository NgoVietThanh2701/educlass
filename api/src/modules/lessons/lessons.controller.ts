import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { RolesUser } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
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
import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_FILE_SIZE } from '@common/constants/upload.constant';
import { AppException } from '@common/exceptions/app.exception';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonAttachmentResponseDto } from './dto/lesson-attachment-response.dto';
import { LessonContentDto } from './dto/lesson-content.dto';
import { LessonProgressResponseDto } from './dto/lesson-progress-response.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonsService } from './lessons.service';

@ApiTags('Lessons')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@Controller('courses/:courseId/sections/:sectionId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Created lesson successfully')
  @ApiOperation({ summary: 'Create lesson under a section' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully', type: LessonResponseDto })
  create(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(courseId, sectionId, teacherId, dto);
  }

  @Get()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Retrieved lessons successfully')
  @ApiOperation({ summary: 'Get all lessons in a section' })
  @ApiResponse({ status: 200, type: LessonResponseDto, isArray: true })
  findAll(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.lessonsService.findAll(courseId, sectionId, teacherId);
  }

  @Get('student')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved lessons successfully')
  @ApiOperation({ summary: 'Student: Get all lessons in a section for an enrolled course' })
  @ApiResponse({ status: 200, type: LessonResponseDto, isArray: true })
  findAllForStudent(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.lessonsService.findAllForStudent(courseId, sectionId, studentId);
  }

  @Get(':lessonId')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Retrieved lesson successfully')
  @ApiOperation({ summary: 'Get lesson detail' })
  @ApiResponse({ status: 200, type: LessonResponseDto })
  findOne(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.lessonsService.findOne(courseId, sectionId, lessonId, teacherId);
  }

  @Get('student/:lessonId')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved lesson successfully')
  @ApiOperation({ summary: 'Student: Get lesson detail for an enrolled course' })
  @ApiResponse({ status: 200, type: LessonResponseDto })
  findOneForStudent(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.lessonsService.findOneForStudent(courseId, sectionId, lessonId, studentId);
  }

  @Patch(':lessonId')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Updated lesson successfully')
  @ApiOperation({ summary: 'Update lesson' })
  @ApiResponse({ status: 200, type: LessonResponseDto })
  update(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(courseId, sectionId, lessonId, teacherId, dto);
  }

  @Post(':lessonId/content')
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Updated lesson content successfully')
  @ApiOperation({ summary: 'Upsert lesson content' })
  @ApiResponse({ status: 200, description: 'Lesson content updated successfully' })
  upsertContent(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: LessonContentDto,
  ) {
    return this.lessonsService.upsertContent(courseId, sectionId, lessonId, teacherId, dto);
  }

  @Post(':lessonId/attachments')
  @RolesUser(RoleUser.TEACHER)
  @ApiOperation({ summary: 'Upload a lesson attachment file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: UPLOAD_MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (UPLOAD_ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  @ApiResponse({ status: 201, type: LessonAttachmentResponseDto })
  uploadAttachment(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file || !file.buffer) {
      throw AppException.badRequest('No file uploaded or file type not allowed');
    }

    return this.lessonsService.uploadAttachment(courseId, sectionId, lessonId, teacherId, file);
  }

  @Get(':lessonId/progress')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Retrieved lesson progress successfully')
  @ApiOperation({ summary: 'Get the current student lesson progress' })
  @ApiResponse({ status: 200, type: LessonProgressResponseDto })
  getProgress(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.lessonsService.getProgress(courseId, sectionId, lessonId, studentId);
  }

  @Patch(':lessonId/progress')
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Updated lesson progress successfully')
  @ApiOperation({ summary: 'Save or update lesson progress for the current student' })
  @ApiResponse({ status: 200, type: LessonProgressResponseDto })
  upsertProgress(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.lessonsService.upsertProgress(courseId, sectionId, lessonId, studentId, dto);
  }
}
