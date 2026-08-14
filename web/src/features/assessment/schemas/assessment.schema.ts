import { z } from "zod";

/** Info of an assessment (title, duration, shuffle flags). */
export const assessmentInfoSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề là bắt buộc")
    .max(255, "Tiêu đề tối đa 255 ký tự"),
  description: z
    .string()
    .max(2000, "Mô tả tối đa 2000 ký tự")
    .optional(),
  duration: z
    .number()
    .int()
    .min(1, "Thời gian tối thiểu 1 phút"),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
});

export type AssessmentInfoFormValues = z.infer<typeof assessmentInfoSchema>;