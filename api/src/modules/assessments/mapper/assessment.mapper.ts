import { Prisma } from '@prisma/client';
import { AssessmentResponseDto } from '../dto/assessment-response.dto';

export const assessmentSelect = Prisma.validator<Prisma.AssessmentSelect>()({
  id: true,
  title: true,
  description: true,
  duration: true,
  status: true,
  shuffleQuestions: true,
  shuffleOptions: true,
  createdAt: true,
  _count: {
    select: {
      questions: true,
    },
  },
});

export type AssessmentWithRelations = Prisma.AssessmentGetPayload<{
  select: typeof assessmentSelect;
}>;

export function toAssessmentResponse(assessment: AssessmentWithRelations): AssessmentResponseDto {
  const questionCount = (assessment as { _count?: { questions?: number } })._count?.questions ?? 0;

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    duration: assessment.duration,
    status: assessment.status,
    shuffleQuestions: assessment.shuffleQuestions,
    shuffleOptions: assessment.shuffleOptions,
    questionCount,
    createdAt: assessment.createdAt,
  };
}
