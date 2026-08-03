import { Prisma } from '@prisma/client';

import { AssessmentDetailResponseDto } from '../dto/assessment-detail-response.dto';

import { questionSelect, toQuestionResponse } from './question.mapper';

export const assessmentDetailSelect = Prisma.validator<Prisma.AssessmentSelect>()({
  id: true,
  title: true,
  description: true,
  duration: true,
  status: true,
  shuffleQuestions: true,
  shuffleOptions: true,
  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      questions: true,
    },
  },

  questions: {
    orderBy: {
      order: 'asc',
    },
    select: questionSelect,
  },
});

export type AssessmentDetailWithRelations = Prisma.AssessmentGetPayload<{
  select: typeof assessmentDetailSelect;
}>;

export function toAssessmentDetailResponse(
  assessment: AssessmentDetailWithRelations,
): AssessmentDetailResponseDto {
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
    updatedAt: assessment.updatedAt,

    questions: assessment.questions.map(toQuestionResponse),
  };
}
