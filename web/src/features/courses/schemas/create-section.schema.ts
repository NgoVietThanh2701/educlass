import * as z from "zod";

/**
 * Form validation mirroring the backend `CreateSectionDto`
 * (`@modules/sections/dto/create-section.dto.ts`):
 *   - title: required string, <= 200
 *   - description: optional string
 *   - order: optional (int >= 1)
 *
 * `order` is intentionally omitted in the UI — the backend auto-assigns the
 * next available position (last order + 1).
 */
export const createSectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên phần học là bắt buộc")
    .max(200, "Tên phần học tối đa 200 ký tự"),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional(),
});

export type CreateSectionFormValues = z.infer<typeof createSectionSchema>;
