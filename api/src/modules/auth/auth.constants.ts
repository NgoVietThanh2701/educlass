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
  // Scope to the auth namespace so the cookie is sent on both
  // `/auth/refresh` and `/auth/logout` (guarded endpoints need it), while NOT
  // exposing the refresh token on unrelated data endpoints (`/users/me`, ...).
  path: '/api/v1/auth',
};

// One-time `state` (CSRF) cookie for the Google OAuth redirect round-trip.
export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state';

export const GOOGLE_OAUTH_STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Lax (NOT strict): the cookie must be delivered on the cross-site
  // top-level navigation FROM accounts.google.com back to the app.
  sameSite: 'lax' as const,
  maxAge: 10 * 60 * 1000, // 10 minutes — the flow should finish in seconds
  path: '/',
};
