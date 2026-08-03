import { Prisma } from '@prisma/client';
import { SectionResponseDto } from './dto/section-response.dto';

export const sectionSelect = Prisma.validator<Prisma.SectionSelect>()({
  id: true,
  courseId: true,
  title: true,
  description: true,
  order: true,
  createdAt: true,
  updatedAt: true,
});

export type SectionMapperInput = Prisma.SectionGetPayload<{
  select: typeof sectionSelect;
}>;

export function toSectionResponse(section: SectionMapperInput): SectionResponseDto {
  return {
    id: section.id,
    courseId: section.courseId,
    title: section.title,
    description: section.description,
    order: section.order,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  };
}
