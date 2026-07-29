import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesUserGuard } from '@common/guards/role-user.guard';
import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExamAttemptService } from './exam-attempt.service';
import { RolesUser } from '@common/decorators/roles.decorator';
import { RoleUser } from '@prisma/client';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { AttemptResponseDto } from './dto/attempt-response.dto';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { SyncAnswersDto } from './dto/sync-answers.dto';
import { StrictThrottle } from '@common/decorators/custom-throttler.decorator';

@ApiTags('Exam-Attempts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesUserGuard)
@Controller('attempts')
export class ExamAttemptController {
  constructor(private readonly attemptService: ExamAttemptService) {}

  @Post('start')
  @StrictThrottle()
  @RolesUser(RoleUser.STUDENT)
  @SuccessMessage('Start attempt sucessfully')
  @ApiOperation({ summary: 'Start a new attempt for a session (Only Student)' })
  @ApiResponse({
    description: 'Start attempt sucessfully!',
    example: AttemptResponseDto,
  })
  start(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    return this.attemptService.startAttempt(studentId, dto);
  }

  @Post(':id/submit')
  @StrictThrottle()
  @SuccessMessage('Submit answers and finish attempt sucessfully')
  @RolesUser(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Submit answers and finish attempt (Only Student)' })
  @ApiResponse({
    description: 'Submit answers and finish attempt sucessfully!',
    example: AttemptResponseDto,
  })
  submit(
    @Param('id') id: string,
    @CurrentUser('id') studentId: string,
  ): Promise<AttemptResponseDto> {
    return this.attemptService.submitAttempt(id, studentId);
  }

  @Put(':id/answers')
  @RolesUser(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Auto-save answers during attempt (Only Student)' })
  syncAnswers(
    @Param('id') id: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SyncAnswersDto,
  ) {
    return this.attemptService.syncAnswers(id, studentId, dto);
  }

  @Get(':id')
  @SuccessMessage('Get attempt details sucessfully')
  @ApiOperation({ summary: 'Get attempt details (student own / teacher of class)' })
  @ApiResponse({
    description: 'Get attempt details sucessfully!',
    example: AttemptResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') studentId: string,
    @CurrentUser('role') role: RoleUser,
  ): Promise<AttemptResponseDto> {
    return this.attemptService.findOne(id, studentId, role);
  }
}
