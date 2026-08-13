import type { NextConfig } from "next";

/**
 * API origin used ONLY server-side by the Next.js rewrite proxy (never exposed
 * to the browser). All `/api/v1/*` calls from the web app are rewritten to this
 * origin, so from the browser's perspective every API request is SAME-ORIGIN.
 *
 * This is required for the httpOnly refresh-token cookie (SameSite=Strict) to be
 * sent on `POST /auth/refresh` after a full page reload (F5): without the proxy,
 * the API is a cross-site origin (e.g. page on `192.168.1.81:3000` vs API on
 * `localhost:5000`) and Strict cookies are never included on XHR — the refresh
 * fails with 401 and the session is lost even though the refresh token is valid.
 */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.81"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
