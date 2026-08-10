import * as z from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username hoặc email là bắt buộc"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(30),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
