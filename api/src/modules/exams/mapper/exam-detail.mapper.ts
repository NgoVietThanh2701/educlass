import { Prisma } from '@prisma/client';

import { ExamDetailResponseDto } from '../dto/exam-detail-response.dto';

import { questionSelect, toQuestionResponse } from './question.mapper';

export const examDetailSelect = Prisma.validator<Prisma.ExamSelect>()({
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

export type ExamDetailWithRelations = Prisma.ExamGetPayload<{
  select: typeof examDetailSelect;
}>;

export function toExamDetailResponse(exam: ExamDetailWithRelations): ExamDetailResponseDto {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    duration: exam.duration,
    status: exam.status,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    questionCount: exam._count.questions,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,

    questions: exam.questions.map(toQuestionResponse),
  };
}
