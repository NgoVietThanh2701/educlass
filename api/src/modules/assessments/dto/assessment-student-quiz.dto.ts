import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';

export class StudentQuizOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  order: number;
}

export class StudentQuizQuestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [StudentQuizOptionDto] })
  options: StudentQuizOptionDto[];
}

/**
 * Student-facing quiz payload for `GET /student/courses/:courseId/assessments/:assessmentId`.
 * Deliberately excludes `isCorrect`/`score` from options — the answer key must
 * never leak to the student before/during an attempt.
 */
export class StudentAssessmentQuizDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  questionCount: number;

  @ApiProperty({ type: [StudentQuizQuestionDto] })
  questions: StudentQuizQuestionDto[];
}
