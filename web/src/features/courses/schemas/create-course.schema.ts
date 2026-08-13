import * as z from "zod";

import {
  CREATE_COURSE_LEVELS,
  type CreateCourseLevel,
} from "../types/create-course.type";

/**
 * Form validation mirroring the backend `CreateCourseDto`:
 * - title: required, <= 200
 * - shortDescription: required, <= 500
 * - description: required
 * - level: enum (BEGINNER | INTERMEDIATE | ADVANCED | ALL)
 * - language: string (vi | en offered in UI)
 * - price / estimatedDuration: number >= 0 (sent as numbers via `valueAsNumber`)
 */
export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên khóa học là bắt buộc")
    .max(200, "Tên khóa học tối đa 200 ký tự"),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Mô tả ngắn là bắt buộc")
    .max(500, "Mô tả ngắn tối đa 500 ký tự"),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc"),
  level: z.enum(CREATE_COURSE_LEVELS),
  language: z.enum(["vi", "en"]),
  price: z.number().min(0, "Giá không được nhỏ hơn 0"),
  estimatedDuration: z.number().min(0, "Thời lượng không được nhỏ hơn 0"),
  requirements: z.string().optional(),
  learningOutcomes: z.string().optional(),
});

export type CreateCourseFormValues = z.infer<typeof createCourseSchema>;

export const LEVEL_OPTIONS: { value: CreateCourseLevel; label: string }[] = [
  { value: "BEGINNER", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED", label: "Nâng cao" },
  { value: "ALL", label: "Tất cả" },
];

