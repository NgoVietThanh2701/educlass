import { AssessmentStatus, CourseLevel, CourseStatus, Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import {
  assessmentPublicOutlineSelect,
  toAssessmentPublicOutline,
} from '@modules/assessments/mapper/assessment.mapper';
import { lessonPublicOutlineSelect, toLessonPublicOutline } from '@modules/lessons/lesson.mapper';
import { sectionOutlineSelect, toSectionOutline } from '@modules/sections/section.mapper';
import { CourseListItemDto, CourseTeacherListItemDto } from './dto/course-list-item.dto';
import { CoursePublicDetailDto } from './dto/course-public-detail.dto';
import { CourseResponseDto } from './dto/course-response.dto';

export const courseListSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  teacherId: true,
  title: true,
  slug: true,
  shortDescription: true,
  thumbnailObjectKey: true,
  level: true,
  language: true,
  price: true,
  publishedAt: true,
  estimatedDuration: true,
  createdAt: true,
  updatedAt: true,
});

export const courseTeacherListSelect = Prisma.validator<Prisma.CourseSelect>()({
  ...courseListSelect,
  status: true,
  archivedAt: true,
});

export const courseTeacherSelect = Prisma.validator<Prisma.CourseSelect>()({
  ...courseTeacherListSelect,
  description: true,
  requirements: true,
  learningOutcomes: true,
});

export const courseStudentSelect = Prisma.validator<Prisma.CourseSelect>()({
  ...courseListSelect,
  description: true,
  requirements: true,
  learningOutcomes: true,
});

export const coursePublicDetailSelect = Prisma.validator<Prisma.CourseSelect>()({
  ...courseListSelect,
  description: true,
  requirements: true,
  learningOutcomes: true,
  sections: {
    orderBy: { order: 'asc' },
    select: {
      ...sectionOutlineSelect,
      lessons: {
        orderBy: { order: 'asc' },
        select: lessonPublicOutlineSelect,
      },
      assessments: {
        orderBy: { order: 'asc' },
        select: assessmentPublicOutlineSelect,
      },
    },
  },
});

export const courseSelect = courseTeacherSelect;

type CourseListMapperInput = {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailObjectKey: string | null;
  level: CourseLevel;
  language: string;
  price: Prisma.Decimal;
  publishedAt: Date | null;
  estimatedDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseMapperInput = CourseListMapperInput & {
  description?: string | null;
  status?: CourseStatus;
  requirements?: string | null;
  learningOutcomes?: string | null;
  archivedAt?: Date | null;
};

export type CoursePublicDetailMapperInput = Prisma.CourseGetPayload<{
  select: typeof coursePublicDetailSelect;
}>;

function buildThumbnailUrl(thumbnailObjectKey: string | null) {
  return thumbnailObjectKey
    ? cloudinary.url(thumbnailObjectKey, {
        resource_type: 'image',
        secure: true,
      })
    : null;
}

export function toCourseListItem(course: CourseListMapperInput): CourseListItemDto {
  return {
    id: course.id,
    teacherId: course.teacherId,
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription,
    thumbnailUrl: buildThumbnailUrl(course.thumbnailObjectKey),
    level: course.level,
    language: course.language,
    price: course.price.toNumber(),
    publishedAt: course.publishedAt,
    estimatedDuration: course.estimatedDuration,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

export function toCourseTeacherListItem(
  course: CourseListMapperInput & { status: CourseStatus; archivedAt: Date | null },
): CourseTeacherListItemDto {
  return {
    ...toCourseListItem(course),
    status: course.status,
    archivedAt: course.archivedAt,
  };
}

export function toCourseResponse(course: CourseMapperInput): CourseResponseDto {
  return {
    ...toCourseListItem(course),
    description: course.description,
    status: course.status!,
    requirements: course.requirements,
    learningOutcomes: course.learningOutcomes,
    archivedAt: course.archivedAt,
  };
}

export function toCoursePublicDetail(course: CoursePublicDetailMapperInput): CoursePublicDetailDto {
  return {
    id: course.id,
    teacherId: course.teacherId,
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription,
    description: course.description,
    thumbnailUrl: buildThumbnailUrl(course.thumbnailObjectKey),
    level: course.level,
    language: course.language,
    price: course.price.toNumber(),
    publishedAt: course.publishedAt,
    estimatedDuration: course.estimatedDuration,
    requirements: course.requirements,
    learningOutcomes: course.learningOutcomes,
    sections: course.sections.map((section) => ({
      ...toSectionOutline(section),
      lessons: section.lessons.map(toLessonPublicOutline),
      assessments: section.assessments
        .filter((assessment) => assessment.status === AssessmentStatus.PUBLISHED)
        .map(toAssessmentPublicOutline),
    })),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}
