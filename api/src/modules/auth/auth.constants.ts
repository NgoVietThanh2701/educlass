export type SequenceName = (typeof SEQUENCE)[keyof typeof SEQUENCE];
export const SEQUENCE = {
  TEACHER: 'teacher_seq',
  STUDENT: 'student_seq',
} as const;

export const SALT_ROUNDS = 12;

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth/refresh-token',
};
