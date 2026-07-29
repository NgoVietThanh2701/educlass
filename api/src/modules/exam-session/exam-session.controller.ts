import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExamSessionService } from './exam-session.service';
import { RolesUser } from '@common/decorators/roles.decorator';
import { RoleUser } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { ExamSessionResponseDto } from './dto/exam-session-response.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { StrictThrottle, ModerateThrottle } from '@common/decorators/custom-throttler.decorator';

@ApiTags('Exam Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@ModerateThrottle()
@Controller('exam-sessions')
export class ExamSessionController {
  constructor(private readonly examSessionService: ExamSessionService) {}

  @Post()
  @StrictThrottle()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Created exam session successfully')
  @ApiOperation({ summary: 'Create a new exam session (Only Teacher)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Exam created successfully.',
    type: ExamSessionResponseDto,
  })
  create(@CurrentUser('id') teacherId: string, @Body() dto: CreateExamSessionDto) {
    return this.examSessionService.create(teacherId, dto);
  }

  @Get('teacher')
  @RolesUser(RoleUser.TEACHER)
  @ApiOperation({ summary: 'Get all exam sessions of the current teacher' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved exam sessions successfully.',
    type: ExamSessionResponseDto,
    isArray: true,
  })
  findAllByTeacher(@CurrentUser('id') teacherId: string) {
    return this.examSessionService.findAllByTeacher(teacherId);
  }

  @Get('student')
  @RolesUser(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get all exam sessions of the current student' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved exam sessions successfully.',
    type: ExamSessionResponseDto,
    isArray: true,
  })
  findAllByStudent(@CurrentUser('id') studentId: string) {
    return this.examSessionService.findAllByStudent(studentId);
  }

  @Get(':id')
  @RolesUser(RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get exam session details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved exam session successfully.',
    type: ExamSessionResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: RoleUser,
  ) {
    return this.examSessionService.findOne(id, userId, role);
  }

  @Patch(':id')
  @StrictThrottle()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Updated exam session successfully')
  @ApiOperation({ summary: 'Update an exam session (Only Teacher)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam session updated successfully.',
    type: ExamSessionResponseDto,
  })
  update(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateExamSessionDto,
  ) {
    return this.examSessionService.update(id, teacherId, dto);
  }

  @Delete(':id')
  @StrictThrottle()
  @RolesUser(RoleUser.TEACHER)
  @SuccessMessage('Deleted exam session successfully')
  @ApiOperation({
    summary: 'Delete a scheduled exam session (Only Teacher)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam session deleted successfully.',
  })
  delete(@Param('id') id: string, @CurrentUser('id') teacherId: string) {
    return this.examSessionService.delete(id, teacherId);
  }
}
