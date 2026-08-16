// Local enum types (mirror Prisma enums since @prisma/client is not available in the frontend)

export const COURSE_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

export const COURSE_LEVEL = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type CourseLevel = (typeof COURSE_LEVEL)[number];

/**
 * Base course list item returned by both the public and student list endpoints
 * (`CourseListItemDto` on the backend). The `status` field is intentionally
 * NOT part of this type: only the teacher list response includes it.
 */
export interface Course {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  /** Public catalog fields (enriched by GET /public/courses). */
  teacherName?: string | null;
  students?: number;
  level: CourseLevel;
  language: string;
  price: number;
  publishedAt?: Date | string | null;
  estimatedDuration?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Teacher course list item (`CourseTeacherListItemDto` on the backend).
 * Extends the base `Course` with the teacher-only `status` / `archivedAt` fields.
 */
export interface TeacherCourse extends Course {
  status: CourseStatus;
  archivedAt?: Date | string | null;
}

/**
 * Full teacher course detail / create response (`CourseResponseDto` on the backend).
 * Returned by POST /teacher/courses and other teacher detail endpoints.
 */
export interface TeacherCourseDetail extends TeacherCourse {
  description?: string | null;
  requirements?: string | null;
  learningOutcomes?: string | null;
}

/** Filter value used by the course list UI. */
export type CourseStatusFilter = "ALL" | CourseStatus;
