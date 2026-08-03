import { ApiProperty } from '@nestjs/swagger';
import { AssessmentStatus } from '@prisma/client';
import { QuestionResponseDto } from './assessment-response.dto';

export class AssessmentDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty()
  duration: number;

  @ApiProperty({ enum: AssessmentStatus })
  status: AssessmentStatus;

  @ApiProperty()
  shuffleQuestions: boolean;

  @ApiProperty()
  shuffleOptions: boolean;

  @ApiProperty()
  questionCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    type: () => [QuestionResponseDto],
  })
  questions: QuestionResponseDto[];
}
