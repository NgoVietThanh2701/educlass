import { Prisma } from '@prisma/client';
import { SectionResponseDto } from './dto/section-response.dto';

export const sectionOutlineSelect = Prisma.validator<Prisma.SectionSelect>()({
  id: true,
  title: true,
  description: true,
  order: true,
});

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

export function toSectionOutline(section: Prisma.SectionGetPayload<{ select: typeof sectionOutlineSelect }>) {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
  };
}

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
