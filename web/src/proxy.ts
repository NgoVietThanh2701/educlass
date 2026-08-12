import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Session marker cookie name (matches `SESSION_MARKER_COOKIE` in src/lib/cookie.ts).
 *
 * IMPORTANT: the real refresh token is an httpOnly cookie owned by the API origin
 * and path-scoped to `/api/v1/auth/refresh`, so it is NEVER sent to the frontend
 * proxy requests (e.g. `/dashboard`). We therefore gate routing on the
 * frontend-origin `hasAuth` marker instead — it IS sent on every frontend request.
 * This is only a UX guard; real auth is enforced server-side (Guards + JWT).
 */
const SESSION_MARKER_COOKIE = "hasAuth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_MARKER_COOKIE)?.value);

  // Protected routes (yêu cầu đăng nhập)
  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: nếu đã có phiên thì chuyển về dashboard
  if (isAuthPath(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/dashboaraaa");
}

function isAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

// export const config = {
//   matcher: ["/dashboard/:path*", "/login", "/register"],
// };
