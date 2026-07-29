// Error code for exception
export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST', // 400
  UNAUTHORIZED: 'UNAUTHORIZED', // 401 (Not Login or token failed)
  FORBIDDEN: 'FORBIDDEN', // 403 // Not permission
  NOT_FOUND: 'NOT_FOUND', // 404
  CONFLICT: 'CONFLICT', // 409 (data exists)
  WS_EXCEPTION: 'WS_EXCEPTION',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR', // 500

  // Custom Error code
  BAD_REQUEST_OTP_RATE_LIMIT: 'BAD_REQUEST_OTP_RATE_LIMIT',
  BAD_REQUEST_OTP_RESEND: 'BAD_REQUEST_OTP_RESEND',
  BAD_REQUEST_OTP_WRONG: 'BAD_REQUEST_OTP_WRONG',
  BAD_REQUEST_EXAM_STATUS: 'BAD_REQUEST_EXAM_STATUS',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
