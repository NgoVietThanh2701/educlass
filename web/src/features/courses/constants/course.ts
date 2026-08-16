import type {
  AssessmentStatus,
  LessonType,
} from "../types/course-detail.type";
import type {
  CourseCategory,
  CourseLevel,
  CourseStatus,
} from "../types/course.type";

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  "Lập trình": "Lập trình",
  Marketing: "Marketing",
  Design: "Design",
  "Đồ họa": "Đồ họa",
  "Truyền thông": "Truyền thông",
};

export const STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  DRAFT: { label: "Bản nháp", variant: "secondary" },
  PUBLISHED: { label: "Đã xuất bản", variant: "default" },
  ARCHIVED: { label: "Đã lưu trữ", variant: "destructive" },
};

/**
 * Lesson type labels — shared by every lesson/curriculum surface
 * (teacher editor, public catalog, student player).
 */
export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "Video",
  TEXT: "Bài viết",
};

/**
 * Assessment status labels — DRAFT/PUBLISHED/ARCHIVED reuse the same
 * label+variant mapping as course status (identical enum values), so this is a
 * single source shared by the teacher detail, section editor and student player.
 */
export const ASSESSMENT_STATUS_CONFIG: Record<
  AssessmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = STATUS_CONFIG;

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};
