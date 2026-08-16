import type {
  LessonType,
  LessonUnlockRule,
  AssessmentStatus,
} from "./course-detail.type";

/**
 * Per-lesson progress for the student — mirrors the backend
 * `LessonProgressResponseDto` (GET `/.../lessons/:lessonId/progress`).
 * The list endpoint omits `id` (and the default fallback has no `id`), so it
 * stays optional here.
 */
export interface StudentLessonProgress {
  id?: string;
  lessonId: string;
  userId: string;
  completed: boolean;
  lastPosition: number;
  completedAt?: Date | string | null;
  createdAt: Date | string;
}

/** A lesson inside the student course detail tree (`CourseStudentLessonItemDto`). */
export interface StudentCourseLesson {
  id: string;
  sectionId: string;
  title: string;
  description?: string | null;
  type: LessonType;
  order: number;
  durationSeconds?: number | null;
  isPreview: boolean;
  unlockRule: LessonUnlockRule;
  isUnlocked: boolean;
  progress: StudentLessonProgress;
}

/** An assessment inside the student course detail tree (`CourseStudentAssessmentItemDto`). */
export interface StudentCourseAssessment {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  duration: number;
  status: AssessmentStatus;
  questionCount: number;
}

/** Overall course progress for the student (`CourseProgressResponseDto`). */
export interface StudentCourseProgress {
  courseId: string;
  studentId: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  completed: boolean;
}

export interface StudentCourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: StudentCourseLesson[];
  assessments: StudentCourseAssessment[];
}

/**
 * Student course detail — mirrors the backend `CourseStudentDetailDto` returned
 * by `GET /student/courses/:courseId`. Carries the enrolled student's overall
 * progress + the curriculum tree where each lesson already knows whether it is
 * unlocked and whether it has been completed.
 */
export interface StudentCourseDetail {
  id: string;
  teacherId: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl: string | null;
  level: string;
  language: string;
  price: number;
  publishedAt?: Date | string | null;
  estimatedDuration?: number | null;
  requirements?: string | null;
  learningOutcomes?: string | null;
  progress: StudentCourseProgress;
  sections: StudentCourseSection[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** A lesson or an assessment, flattened for the learning-player navigation. */
export type PlayerItem =
  | { kind: "lesson"; id: string; sectionId: string; data: StudentCourseLesson }
  | {
      kind: "assessment";
      id: string;
      sectionId: string;
      data: StudentCourseAssessment;
    };
