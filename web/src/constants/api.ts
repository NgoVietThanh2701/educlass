export const API_ENDPOINT = {
  // auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_OTP: "/auth/register/verify-otp",
  RESEND_OTP: "/auth/register/resend-verification",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",

  // users
  ME: "/users/me",
} as const;
