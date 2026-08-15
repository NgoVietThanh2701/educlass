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

/**
 * Lightweight assessment row for the TEACHER course-detail tree.
 *
 * Deliberately does NOT fetch the questions/options — those are only needed on
 * the assessment's own edit page (fetched via `getAssessmentDetail`). Loading
 * them inside `GET /teacher/courses/:id` made that response huge (all questions
 * + all options of every assessment) and the endpoint noticeably slow.
 */
export const assessmentTeacherTreeSelect = Prisma.validator<Prisma.AssessmentSelect>()({
  id: true,
  title: true,
  description: true,
  order: true,
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

export function toAssessmentTeacherTreeItem(
  assessment: Prisma.AssessmentGetPayload<{ select: typeof assessmentTeacherTreeSelect }>,
) {
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    order: assessment.order,
    duration: assessment.duration,
    status: assessment.status,
    shuffleQuestions: assessment.shuffleQuestions,
    shuffleOptions: assessment.shuffleOptions,
    questionCount: getQuestionCount(assessment),
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
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
