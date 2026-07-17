import { Prisma } from '@prisma/client';
import { QuestionResponseDto } from '../dto/exam-response.dto';

export const questionSelect = Prisma.validator<Prisma.ExamQuestionSelect>()({
  id: true,
  content: true,
  explanation: true,
  score: true,
  order: true,
  type: true,

  options: {
    orderBy: {
      order: 'asc',
    },
    select: {
      id: true,
      content: true,
      isCorrect: true,
      order: true,
    },
  },
});

export type QuestionWithRelations = Prisma.ExamQuestionGetPayload<{
  select: typeof questionSelect;
}>;

export function toQuestionResponse(question: QuestionWithRelations): QuestionResponseDto {
  return {
    id: question.id,
    content: question.content,
    explanation: question.explanation,
    score: question.score.toNumber(),
    order: question.order,
    type: question.type,

    options: question.options.map((option) => ({
      id: option.id,
      content: option.content,
      isCorrect: option.isCorrect,
      order: option.order,
    })),
  };
}
