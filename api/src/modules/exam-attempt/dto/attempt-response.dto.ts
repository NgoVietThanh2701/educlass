import { ApiProperty } from '@nestjs/swagger';

export class AttemptAnswerResponseDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  optionId: string;
}

export class AttemptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

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
  })
  deadlineAt: string;

  @ApiProperty({
    nullable: true,
    example: 8.5,
  })
  score: number | null;

  @ApiProperty({
    example: 'IN_PROGRESS',
  })
  status: string;

  @ApiProperty({
    type: [AttemptAnswerResponseDto],
  })
  answers: AttemptAnswerResponseDto[];
}
