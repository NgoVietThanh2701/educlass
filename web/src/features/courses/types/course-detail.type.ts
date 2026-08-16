import type { TeacherCourseDetail } from "./course.type";

// Mirrors Prisma enums (kept local since @prisma/client is not available in the frontend).
export type LessonType = "VIDEO" | "TEXT";
export type LessonUnlockRule =
  "FREE" | "PREVIOUS_LESSON" | "PREVIOUS_ASSESSMENT";
export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CourseDetailLessonContent {
  objectKey?: string | null;
  videoDuration?: number | null;
  textContent?: string | null;
}

export interface CourseDetailAttachment {
  id: string;
  lessonId: string;
  fileName: string;
  objectKey: string;
  resourceType: string;
  size: number;
  mimeType: string;
  createdAt: Date | string;
}

export interface CourseDetailLesson {
  id: string;
  sectionId: string;
  title: string;
  description?: string | null;
  type: LessonType;
  order: number;
  durationSeconds?: number | null;
  isPreview: boolean;
  unlockRule: LessonUnlockRule;
  content?: CourseDetailLessonContent | null;
  attachments: CourseDetailAttachment[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CourseDetailAssessment {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  status: AssessmentStatus;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CourseDetailSection {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  lessons: CourseDetailLesson[];
  assessments: CourseDetailAssessment[];
}

/**
 * Full teacher course detail — mirrors the backend `CourseTeacherDetailDto`:
 * course metadata + ordered sections with lessons and assessments.
 */
export interface CourseTeacherDetail extends TeacherCourseDetail {
  sections: CourseDetailSection[];
}

export interface CoursePublicLessonOutline {
  id: string;
  title: string;
  description?: string | null;
  type: LessonType;
  order: number;
  durationSeconds?: number | null;
  isPreview: boolean;
}

export interface CoursePublicAssessmentOutline {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  duration: number;
  status: AssessmentStatus;
}

export interface CoursePublicSectionOutline {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: CoursePublicLessonOutline[];
  assessments: CoursePublicAssessmentOutline[];
}

/**
 * Public course detail — mirrors the backend `CoursePublicDetailDto`
 * (GET /public/courses/:slug). Includes the full curriculum outline
 * (sections → lessons + assessments) for the catalog "learn" landing page.
 */
export interface CoursePublicDetail {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  level: string;
  category?: string | null;
  language: string;
  price: number;
  publishedAt?: Date | string | null;
  estimatedDuration?: number | null;
  requirements?: string | null;
  learningOutcomes?: string | null;
  sections: CoursePublicSectionOutline[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
