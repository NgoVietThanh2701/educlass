import * as z from "zod";

export const verifyOtpSchema = z.object({
  email: z.email("Email không hợp lệ"),
  code: z.string().length(6, "Mã OTP phải gồm 6 chữ số"),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
