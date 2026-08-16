/**
 * Lesson types mirroring the backend lesson DTOs.
 * Endpoint: `/courses/:courseId/sections/:sectionId/lessons` (TEACHER only).
 */
import type {
  CourseDetailAttachment,
  CourseDetailLesson,
  LessonType,
  LessonUnlockRule,
} from "./course-detail.type";

/**
 * Payload matching `CreateLessonDto`. `order` is intentionally omitted so the
 * backend auto-assigns the next available position (its service uses
 * `(lastLesson?.order ?? 0) + 1`).
 */
export interface CreateLessonRequest {
  title: string;
  description?: string;
  type?: LessonType;
  durationSeconds?: number;
  isPreview?: boolean;
  unlockRule?: LessonUnlockRule;
}

/** Payload matching `LessonContentDto` — media is attached *after* creation. */
export interface LessonContentRequest {
  objectKey?: string | null;
  videoDuration?: number | null;
  textContent?: string | null;
}

/** Response matching `LessonAttachmentResponseDto`. */
export type LessonAttachmentResponse = CourseDetailAttachment;

/** Response matching `LessonResponseDto`. */
export type LessonResponse = CourseDetailLesson;
