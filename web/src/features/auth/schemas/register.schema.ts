import { RoleUser } from "@/types/role.type";
import * as z from "zod";

export const registerSchema = z
  .object({
    email: z.email("Email không hợp lệ").min(1, "Email là bắt buộc"),
    fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(100),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(30),
    confirmPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(30),
    role: z.enum(RoleUser),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
