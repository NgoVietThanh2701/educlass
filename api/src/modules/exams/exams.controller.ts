import { RolesUser } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleUser } from '@prisma/client';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamResponseDto, OptionResponseDto, QuestionResponseDto } from './dto/exam-response.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ChangeExamStatusDto, UpdateExamDto } from './dto/update-exam.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AddOptionDto } from './dto/add-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { ExamDetailResponseDto } from './dto/exam-detail-response.dto';

@ApiTags('Exams (Only Teacher)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RolesUser(RoleUser.TEACHER)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ========== EXAM ==========
  @Post()
  @SuccessMessage('Created exam successfully')
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Exam created successfully.',
    type: ExamResponseDto,
  })
  create(
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateExamDto,
  ): Promise<ExamResponseDto> {
    return this.examsService.create(teacherId, dto);
  }

  @Get()
  @SuccessMessage('Retrieved exams successfully')
  @ApiOperation({ summary: 'Get all exams' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exams retrieved successfully.',
    type: ExamResponseDto,
    isArray: true,
  })
  findAll(@CurrentUser('id') teacherId: string): Promise<ExamResponseDto[]> {
    return this.examsService.findAll(teacherId);
  }

  @Get(':examId')
  @Get(':examId')
  @SuccessMessage('Retrieved exam successfully')
  @ApiOperation({ summary: 'Get exam details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam retrieved successfully.',
    type: ExamDetailResponseDto,
  })
  findOne(@Param('examId') examId: string, @CurrentUser('id') teacherId: string) {
    return this.examsService.findOne(examId, teacherId);
  }

  @Patch(':examId')
  @SuccessMessage('Updated exam successfully')
  @ApiOperation({ summary: 'Update an exam' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam updated successfully.',
    type: ExamResponseDto,
  })
  update(
    @Param('examId') examId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(examId, teacherId, dto);
  }

  @Patch(':examId/status')
  @SuccessMessage('Updated exam status successfully')
  @ApiOperation({ summary: 'Change exam status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam status updated successfully.',
    type: ExamResponseDto,
  })
  changeStatus(
    @Param('examId') examId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: ChangeExamStatusDto,
  ) {
    return this.examsService.changeStatus(examId, teacherId, dto.status);
  }

  // ========== QUESTION ==========
  @Post(':examId/questions')
  @SuccessMessage('Added question successfully')
  @ApiOperation({ summary: 'Add a question to an exam' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Question added successfully.',
    type: QuestionResponseDto,
  })
  addQuestion(
    @Param('examId') examId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: AddQuestionDto,
  ) {
    return this.examsService.addQuestion(examId, teacherId, dto);
  }

  @Patch(':examId/questions/:questionId')
  @SuccessMessage('Updated question successfully')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question updated successfully.',
    type: QuestionResponseDto,
  })
  updateQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.examsService.updateQuestion(examId, questionId, teacherId, dto);
  }

  @Delete(':examId/questions/:questionId')
  @SuccessMessage('Deleted question successfully')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question deleted successfully.',
  })
  deleteQuestion(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.examsService.deleteQuestion(examId, questionId, teacherId);
  }

  // ========== OPTION ==========
  @Post(':examId/questions/:questionId/options')
  @SuccessMessage('Added option successfully')
  @ApiOperation({ summary: 'Add an option to a question' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Option added successfully.',
    type: OptionResponseDto,
  })
  addOption(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: AddOptionDto,
  ) {
    return this.examsService.addOption(examId, questionId, teacherId, dto);
  }

  @Patch(':examId/questions/:questionId/options/:optionId')
  @SuccessMessage('Updated option successfully')
  @ApiOperation({ summary: 'Update an option' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Option updated successfully.',
    type: OptionResponseDto,
  })
  updateOption(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.examsService.updateOption(examId, questionId, optionId, teacherId, dto);
  }

  @Delete(':examId/questions/:questionId/options/:optionId')
  @SuccessMessage('Deleted option successfully')
  @ApiOperation({ summary: 'Delete an option' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Option deleted successfully.',
  })
  deleteOption(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
    @CurrentUser('id') teacherId: string,
  ) {
    return this.examsService.deleteOption(examId, questionId, optionId, teacherId);
  }
}
