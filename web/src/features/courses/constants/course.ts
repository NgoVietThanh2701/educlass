import type { CourseLevel, CourseStatus } from "../types/course.type";

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

export const STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  DRAFT: { label: "Bản nháp", variant: "secondary" },
  PUBLISHED: { label: "Đã xuất bản", variant: "default" },
  ARCHIVED: { label: "Đã lưu trữ", variant: "destructive" },
};
