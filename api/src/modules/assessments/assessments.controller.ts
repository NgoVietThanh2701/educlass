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
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import {
  AssessmentResponseDto,
  OptionResponseDto,
  QuestionResponseDto,
} from './dto/assessment-response.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ChangeAssessmentStatusDto, UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AddOptionDto } from './dto/add-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { AssessmentDetailResponseDto } from './dto/assessment-detail-response.dto';
import { StrictThrottle } from '@common/decorators/custom-throttler.decorator';

@ApiTags('Assessments (Only Teacher)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@RolesUser(RoleUser.TEACHER)
@StrictThrottle()
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // ========== ASSESSMENT ==========
  @Post()
  @StrictThrottle()
  @SuccessMessage('Created assessment successfully')
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assessment created successfully.',
    type: AssessmentResponseDto,
  })
  create(
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateAssessmentDto,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.create(teacherId, dto);
  }

  @Get()
  @SuccessMessage('Retrieved assessments successfully')
  @ApiOperation({ summary: 'Get all assessments by section' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessments retrieved successfully.',
    type: AssessmentResponseDto,
    isArray: true,
  })
  findAll(@Param('sectionId') sectionId: string): Promise<AssessmentResponseDto[]> {
    return this.assessmentsService.findAll(sectionId);
  }

  @Get(':assessmentId')
  @SuccessMessage('Retrieved assessment successfully')
  @ApiOperation({ summary: 'Get assessment details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment retrieved successfully.',
    type: AssessmentDetailResponseDto,
  })
  findOne(@Param('assessmentId') assessmentId: string, @Param('sectionId') sectionId: string) {
    return this.assessmentsService.findOne(assessmentId, sectionId);
  }

  @Patch(':assessmentId')
  @StrictThrottle()
  @SuccessMessage('Updated assessment successfully')
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment updated successfully.',
    type: AssessmentResponseDto,
  })
  update(
    @Param('assessmentId') assessmentId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessmentsService.update(assessmentId, sectionId, dto);
  }

  @Patch(':assessmentId/status')
  @StrictThrottle()
  @SuccessMessage('Updated assessment status successfully')
  @ApiOperation({ summary: 'Change assessment status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment status updated successfully.',
    type: AssessmentResponseDto,
  })
  changeStatus(
    @Param('assessmentId') assessmentId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: ChangeAssessmentStatusDto,
  ) {
    return this.assessmentsService.changeStatus(assessmentId, sectionId, dto.status);
  }

  // ========== QUESTION ==========
  @Post(':assessmentId/questions')
  @StrictThrottle()
  @SuccessMessage('Added question successfully')
  @ApiOperation({ summary: 'Add a question to an assessment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Question added successfully.',
    type: QuestionResponseDto,
  })
  addQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: AddQuestionDto,
  ) {
    return this.assessmentsService.addQuestion(assessmentId, sectionId, dto);
  }

  @Patch(':assessmentId/questions/:questionId')
  @StrictThrottle()
  @SuccessMessage('Updated question successfully')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question updated successfully.',
    type: QuestionResponseDto,
  })
  updateQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.assessmentsService.updateQuestion(assessmentId, questionId, sectionId, dto);
  }

  @Delete(':assessmentId/questions/:questionId')
  @StrictThrottle()
  @SuccessMessage('Deleted question successfully')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question deleted successfully.',
  })
  deleteQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.assessmentsService.deleteQuestion(assessmentId, questionId, sectionId);
  }

  // ========== OPTION ==========
  @Post(':assessmentId/questions/:questionId/options')
  @StrictThrottle()
  @SuccessMessage('Added option successfully')
  @ApiOperation({ summary: 'Add an option to a question' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Option added successfully.',
    type: OptionResponseDto,
  })
  addOption(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: AddOptionDto,
  ) {
    return this.assessmentsService.addOption(assessmentId, questionId, sectionId, dto);
  }

  @Patch(':assessmentId/questions/:questionId/options/:optionId')
  @StrictThrottle()
  @SuccessMessage('Updated option successfully')
  @ApiOperation({ summary: 'Update an option' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Option updated successfully.',
    type: OptionResponseDto,
  })
  updateOption(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.assessmentsService.updateOption(assessmentId, questionId, optionId, sectionId, dto);
  }

  @Delete(':assessmentId/questions/:questionId/options/:optionId')
  @StrictThrottle()
  @SuccessMessage('Deleted option successfully')
  @ApiOperation({ summary: 'Delete an option' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Option deleted successfully.',
  })
  deleteOption(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.assessmentsService.deleteOption(assessmentId, questionId, optionId, sectionId);
  }
}
