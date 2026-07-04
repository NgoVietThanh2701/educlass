export const OTP_PURPOSE = {
  REGISTER: 'REGISTER',
  RESET_PASSWORD: 'RESET_PASSWORD',
  CHANGE_EMAIL: 'CHANGE_EMAIL',
} as const;

export type OtpPurposeType = (typeof OTP_PURPOSE)[keyof typeof OTP_PURPOSE];
