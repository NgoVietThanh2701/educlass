// otp/otp.constants.ts
export const MAX_OTP_SEND_ATTEMPTS = 3; // số lần gửi tối đa trong một khoảng thời gian
export const MAX_OTP_VERIFY_ATTEMPTS = 5;

export const OTP_PREFIX = 'otp:';
export const OTP_RATE_LIMIT_PREFIX = 'otp:ratelimit:';
export const OTP_VERIFY_ATTEMPT_PREFIX = 'otp:verify-attempt:';

export const SALT_ROUNDS_OTP = 8;
