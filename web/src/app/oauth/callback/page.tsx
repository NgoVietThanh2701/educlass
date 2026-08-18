"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { refreshAccessToken } from "@/features/auth/api/refresh";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { setSessionMarker } from "@/lib/cookie";

/**
 * OAuth redirect target: after the Google callback the API has already set the
 * httpOnly refresh cookie on this origin. This page finalises the session by
 * re-using the standard `/auth/refresh` round-trip (fresh access token + user),
 * marks the session, then bounces to the dashboard.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { accessToken, user } = await refreshAccessToken();
        if (cancelled) return;

        setSessionMarker();
        useAuthStore.getState().setAuth({ user, accessToken });
        router.replace(ROUTES.DASHBOARD);
      } catch {
        if (cancelled) return;
        setFailed(true);
        router.replace(ROUTES.LOGIN);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {failed ? (
        <p className="text-sm text-muted-foreground">
          Đăng nhập Google không thành công. Đang quay lại trang đăng nhập…
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Đang đăng nhập…</p>
        </div>
      )}
    </div>
  );
}
