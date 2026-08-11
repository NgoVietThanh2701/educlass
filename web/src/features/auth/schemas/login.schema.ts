import * as z from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username hoặc email là bắt buộc"),
  // Backend chỉ yêu cầu non-empty khi login (Password rule đầy đủ nằm ở register)
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(60, "Mật khẩu tối đa 60 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
      "Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
    ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
