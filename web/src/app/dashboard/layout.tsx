"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import DashboardShell from "@/components/layout/dashboard/DashboardShell";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/features/auth/hooks/use-auth";

// Dashboard-scoped styles (Tailwind utilities for the sidebar/header).
import "./dashboard.css";

/**
 * Protected-route gate.
 *
 * The root `AuthProvider` restores the session via a single `/auth/refresh`
 * round-trip (it returns both a fresh access token and the user profile).
 * Until that finishes `isInitializing` is `true`: the access token may still be
 * missing, so we deliberately withhold the shell AND its children — this
 * prevents page-level `useQuery` calls from firing prematurely (which would
 * 401, refresh, and repaint after a flash of empty content) and keeps the
 * authenticated UI hidden until we actually know the session state.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  // Once init settles and we have no session, send the visitor to login.
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
