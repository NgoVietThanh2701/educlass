import { MetaPagingResponseDto } from '@common/dto/pagination-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AttemptAnswerResponseDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  optionId: string;
}

/** Per-question result returned after an attempt is scored (submit/timeout). */
export class QuestionResultDto {
  @ApiProperty({ description: 'Question ID' })
  questionId: string;

  @ApiProperty({
    description: 'Whether the student answered this question correctly',
  })
  correct: boolean;

  @ApiProperty({
    description: 'IDs of the correct options (client renders review feedback)',
    type: [String],
  })
  correctOptionIds: string[];
}

export class AttemptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assessmentId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty({
    type: String,
  })
  startedAt: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  finishedAt?: string | null;

  @ApiProperty({
    type: String,
    description: 'Scheduled end of the attempt (ISO 8601, UTC). Used by the client timer.',
  })
  deadlineAt: string;

  @ApiProperty({
    nullable: true,
    example: 8.5,
  })
  score: number | null;

  @ApiProperty({
    nullable: true,
    example: true,
    description: 'Whether the attempt reached the assessment passing score',
  })
  passed: boolean | null;

  @ApiProperty({
    example: 'IN_PROGRESS',
  })
  status: string;

  @ApiProperty({
    type: [AttemptAnswerResponseDto],
  })
  answers: AttemptAnswerResponseDto[];

  @ApiProperty({
    type: [QuestionResultDto],
    description: 'Per-question correctness (only meaningful after submit/timeout)',
  })
  questionResults: QuestionResultDto[];
}

export class AttemptListResponseDto {
  @ApiProperty({ type: [AttemptResponseDto], description: 'Array of attempts' })
  data: AttemptResponseDto[];

  @ApiProperty({ type: MetaPagingResponseDto, description: 'Pagination metadata' })
  meta: MetaPagingResponseDto;
}
