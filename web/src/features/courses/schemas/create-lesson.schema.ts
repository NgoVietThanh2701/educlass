import { z } from "zod";

export const LESSON_TYPES = ["VIDEO", "TEXT"] as const;
export type LessonTypeValue = (typeof LESSON_TYPES)[number];
export const LESSON_TYPE_OPTIONS: { value: LessonTypeValue; label: string }[] = [
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Bài viết" },
];

export const LESSON_UNLOCK_RULES = ["FREE", "PREVIOUS_LESSON", "PREVIOUS_ASSESSMENT"] as const;
export type LessonUnlockRuleValue = (typeof LESSON_UNLOCK_RULES)[number];
export const LESSON_UNLOCK_RULE_OPTIONS: {
  value: LessonUnlockRuleValue;
  label: string;
}[] = [
  { value: "FREE", label: "Mở khóa ngay" },
  { value: "PREVIOUS_LESSON", label: "Sau bài học trước" },
  { value: "PREVIOUS_ASSESSMENT", label: "Sau bài kiểm tra trước" },
];

/**
 * Form schema mirroring CreateLessonDto (minus order, which the backend
 * assigns automatically). The video file itself is not part of the DTO — it
 * is uploaded/processed on the frontend and attached via lesson content.
 *
 * Matches the createCourseSchema convention: enum/string-boolean fields are
 * required in the schema and get their defaults from the form's defaultValues
 * (so zodResolver types line up cleanly).
 *
 * `durationSeconds` uses plain `z.number()` (no preprocess). The number input
 * renders as a string, so the form registers it with a `valueAs` converter that
 * collapses empty input back to `undefined` — keeping the optional field truly
 * optional and matching how `createCourseSchema` handles `price` /
 * `estimatedDuration` via `valueAsNumber`.
 */
export const createLessonSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề là bắt buộc")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  description: z
    .string()
    .max(1000, "Mô tả tối đa 1000 ký tự")
    .optional(),
  type: z.enum(LESSON_TYPES),
  // durationSeconds is optional; the form uses a valueAs converter (empty
  // string → undefined) so z.number() stays clean and types line up.
  durationSeconds: z
    .number()
    .int()
    .min(0, "Thời lượng phải lớn hơn hoặc bằng 0")
    .optional(),
  isPreview: z.boolean(),
  unlockRule: z.enum(LESSON_UNLOCK_RULES),
});

export type CreateLessonFormValues = z.infer<typeof createLessonSchema>;