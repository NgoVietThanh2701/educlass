// otp/otp.constants.ts
export const MAX_OTP_RATE_LIMIT = 3; // số lần gửi tối đa trong một khoảng thời gian
export const MAX_OTP_VERIFY_ATTEMPTS = 5;

export const KEY_OTP_PREFIX = {
  OTP: 'otp:',
  OTP_RATE_LIMIT: 'otp:ratelimit:',
  OTP_VERIFY_ATTEMPT: 'otp:verify-attempt:',
} as const;

export type KeyOtpPrefix = (typeof KEY_OTP_PREFIX)[keyof typeof KEY_OTP_PREFIX];

export const SALT_ROUNDS_OTP = 8;
