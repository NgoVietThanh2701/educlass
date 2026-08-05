import { Prisma } from '@prisma/client';
import { AssessmentResponseDto } from '../dto/assessment-response.dto';

export const assessmentPublicOutlineSelect = Prisma.validator<Prisma.AssessmentSelect>()({
  id: true,
  title: true,
  description: true,
  order: true,
  duration: true,
  status: true,
});

export const assessmentTreeSelect = Prisma.validator<Prisma.AssessmentSelect>()({
  id: true,
  title: true,
  description: true,
  order: true,
  duration: true,
  status: true,
  _count: {
    select: {
      questions: true,
    },
  },
});

export const assessmentSelect = Prisma.validator<Prisma.AssessmentSelect>()({
  id: true,
  sectionId: true,
  title: true,
  description: true,
  order: true,
  duration: true,
  passingScore: true,
  maxAttempts: true,
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
});

export type AssessmentWithRelations = Prisma.AssessmentGetPayload<{
  select: typeof assessmentSelect;
}>;

function getQuestionCount(assessment: { _count?: { questions?: number } }) {
  return assessment._count?.questions ?? 0;
}

export function toAssessmentPublicOutline(
  assessment: Prisma.AssessmentGetPayload<{ select: typeof assessmentPublicOutlineSelect }>,
) {
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    order: assessment.order,
    duration: assessment.duration,
    status: assessment.status,
  };
}

export function toAssessmentTreeItem(
  assessment: Prisma.AssessmentGetPayload<{ select: typeof assessmentTreeSelect }>,
) {
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    order: assessment.order,
    duration: assessment.duration,
    status: assessment.status,
    questionCount: getQuestionCount(assessment),
  };
}

export function toAssessmentResponse(assessment: AssessmentWithRelations): AssessmentResponseDto {
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    duration: assessment.duration,
    status: assessment.status,
    shuffleQuestions: assessment.shuffleQuestions,
    shuffleOptions: assessment.shuffleOptions,
    questionCount: getQuestionCount(assessment),
    createdAt: assessment.createdAt,
  };
}
