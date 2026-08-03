import { Prisma } from '@prisma/client';
import { CourseResponseDto } from './dto/course-response.dto';

export const courseSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  teacherId: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnailObjectKey: true,
  level: true,
  language: true,
  price: true,
  status: true,
  publishedAt: true,
  estimatedDuration: true,
  requirements: true,
  learningOutcomes: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type CourseMapperInput = Prisma.CourseGetPayload<{
  select: typeof courseSelect;
}>;

export function toCourseResponse(course: CourseMapperInput): CourseResponseDto {
  return {
    id: course.id,
    teacherId: course.teacherId,
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription,
    description: course.description,
    thumbnailObjectKey: course.thumbnailObjectKey,
    level: course.level,
    language: course.language,
    price: course.price.toNumber(),
    status: course.status,
    publishedAt: course.publishedAt,
    estimatedDuration: course.estimatedDuration,
    requirements: course.requirements,
    learningOutcomes: course.learningOutcomes,
    archivedAt: course.archivedAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}
