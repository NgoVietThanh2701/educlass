import { Prisma } from '@prisma/client';
import { OptionResponseDto } from '../dto/exam-response.dto';

export const optionSelect = Prisma.validator<Prisma.QuestionOptionSelect>()({
  id: true,
  content: true,
  isCorrect: true,
  order: true,
});

export type OptionWithRelations = Prisma.QuestionOptionGetPayload<{
  select: typeof optionSelect;
}>;

export function toOptionResponse(option: OptionWithRelations): OptionResponseDto {
  return {
    id: option.id,
    content: option.content,
    isCorrect: option.isCorrect,
    order: option.order,
  };
}
