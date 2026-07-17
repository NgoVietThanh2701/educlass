import { ApiProperty } from '@nestjs/swagger';
import { ExamStatus } from '@prisma/client';
import { QuestionResponseDto } from './exam-response.dto';

export class ExamDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty()
  duration: number;

  @ApiProperty({ enum: ExamStatus })
  status: ExamStatus;

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
