export type SequenceName = (typeof SEQUENCE)[keyof typeof SEQUENCE];
export const SEQUENCE = {
  TEACHER: 'teacher_seq',
  STUDENT: 'student_seq',
} as const;

export const SALT_ROUNDS = 12;

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Builds the httpOnly refresh-token cookie options. `maxAge` mirrors the token
 * lifetime (`JWT_REFRESH_EXPIRES_IN`, seconds) so the cookie never outlives the
 * token. Read at request time (after ConfigModule has loaded `.env`).
 */
export function getRefreshTokenCookieOptions() {
  const expiresInSeconds = Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 90000);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: expiresInSeconds * 1000,
    // Scope to the auth namespace so the cookie is sent on both
    // `/auth/refresh` and `/auth/logout` (guarded endpoints need it), while NOT
    // exposing the refresh token on unrelated data endpoints (`/users/me`, ...).
    path: '/api/v1/auth',
  };
}

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
