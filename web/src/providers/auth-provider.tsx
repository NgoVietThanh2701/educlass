"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import logoutApi from "@/features/auth/api/logout";
import { refreshAccessToken } from "@/features/auth/api/refresh";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { clearSessionMarker, hasSessionMarker } from "@/lib/cookie";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Restores the session on hard reload (F5) in a SINGLE round-trip.
 *
 * The refresh token is an httpOnly, path-scoped cookie the browser sends
 * automatically (same-origin via the Next proxy), so the access token NEVER
 * touches localStorage/sessionStorage (XSS can't steal it). `/auth/refresh`
 * returns BOTH a fresh access token AND the user profile, so we can initialise
 * auth in one request — a drastic improvement over the traditional "me 401 →
 * refresh → retry me" chain (2-3× faster on reload).
 *
 * The protected-route gate (`dashboard/layout.tsx`) waits on `isInitializing`,
 * therefore no page-level data query fires before the token is ready.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const finishInitialize = useAuthStore((state) => state.finishInitialize);

  // Only attempt session restoration when a session *might* exist. For a
  // brand-new visitor there is no marker, so skip the network call entirely.
  const hasSession = useMemo(() => hasSessionMarker(), []);

  useEffect(() => {
    if (!hasSession) {
      setAuth({ user: null, accessToken: null });
      finishInitialize();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { accessToken, user } = await refreshAccessToken();

        if (cancelled) return;

        setAuth({ user, accessToken });
        finishInitialize();
      } catch {
        // Refresh cookie missing/expired → no valid session. Best-effort
        // server-side revoke (for transient network failures the cookie may
        // still be valid), clear local state, and let the route gate bounce
        // the visitor to /login.
        if (cancelled) return;

        try {
          await logoutApi();
        } catch {
          // Ignore (e.g. cookie already expired).
        }

        clearSessionMarker();
        useAuthStore.getState().logout();
        queryClient.removeQueries();
        finishInitialize();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasSession, setAuth, finishInitialize, queryClient]);

  return <>{children}</>;
}
