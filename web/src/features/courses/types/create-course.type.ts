import type { CourseStatus } from "./course.type";

/**
 * Create-course types mirroring the backend `CreateCourseDto`.
 * The backend `CourseLevel` enum includes `ALL`, so the create form's level
 * union is a superset of the list-display `CourseLevel`.
 */
export const CREATE_COURSE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL",
] as const;

export type CreateCourseLevel = (typeof CREATE_COURSE_LEVELS)[number];

export const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
] as const;

export type CourseLanguage = (typeof LANGUAGES)[number]["value"];

/** Payload matching `CreateCourseDto` (validated by `ValidationPipe` on the backend). */
export interface CreateCourseRequest {
  title: string;
  shortDescription: string;
  description: string;
  level?: CreateCourseLevel;
  language?: CourseLanguage;
  price: number;
  estimatedDuration: number;
  requirements?: string;
  learningOutcomes?: string;
}

/** Request sent over `multipart/form-data`: the DTO fields + optional thumbnail file. */
export interface CreateCoursePayload {
  data: CreateCourseRequest;
  thumbnail?: File | null;
}

/**
 * Payload for PATCH /teacher/courses/:id (backend `UpdateCourseDto`, which is
 * `PartialType(CreateCourseDto)` — all fields optional).
 */
export type UpdateCourseRequest = Partial<CreateCourseRequest>;

/** Payload for PATCH /teacher/courses/:id/status (backend `ChangeCourseStatusDto`). */
export interface ChangeCourseStatusRequest {
  status: CourseStatus;
}

