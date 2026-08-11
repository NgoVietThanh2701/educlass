/**
 * Session marker cookie (frontend origin, non-httpOnly).
 *
 * CRITICAL: the real refresh token is an httpOnly cookie owned by the API origin
 * and path-scoped to `/api/v1/auth/refresh`, so the browser JS can NEVER read it.
 * This marker is NOT a security boundary — it holds no secret and is only a hint
 * so the client knows whether a session *might* exist, avoiding unnecessary
 * `/users/me`, `/auth/refresh` and `/auth/logout` calls for brand-new visitors.
 * Real authentication/authorization always happens server-side (Guards).
 */
export const SESSION_MARKER_COOKIE = "hasAuth";

const MAX_AGE = 7 * 24 * 60 * 60; // seconds, match refresh token lifetime (7 days)

export function setSessionMarker(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SESSION_MARKER_COOKIE}=1; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function clearSessionMarker(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SESSION_MARKER_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function hasSessionMarker(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .some(
      (part) =>
        part.trim().startsWith(`${SESSION_MARKER_COOKIE}=`) &&
        part.trim().split("=")[1] !== "",
    );
}