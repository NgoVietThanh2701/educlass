import { Prisma } from '@prisma/client';
import { OptionResponseDto } from '../dto/assessment-response.dto';

export const optionSelect = Prisma.validator<Prisma.AssessmentOptionSelect>()({
  id: true,
  content: true,
  isCorrect: true,
  order: true,
});

export type OptionWithRelations = Prisma.AssessmentOptionGetPayload<{
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
