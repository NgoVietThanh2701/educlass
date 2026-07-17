import { Prisma } from '@prisma/client';
import { ExamResponseDto } from '../dto/exam-response.dto';

export const examSelect = Prisma.validator<Prisma.ExamSelect>()({
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

export type ExamWithRelations = Prisma.ExamGetPayload<{
  select: typeof examSelect;
}>;

export function toExamResponse(exam: ExamWithRelations): ExamResponseDto {
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
  };
}
