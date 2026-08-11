"use client";

import { useEffect, useMemo } from "react";

import { useMe } from "@/features/auth/hooks/use-me";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { clearSessionMarker, hasSessionMarker } from "@/lib/cookie";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const finishInitialize = useAuthStore((state) => state.finishInitialize);

  // Only attempt session restoration when a session *might* exist. For a brand-new
  // visitor there is no marker, so we skip /users/me entirely (avoids a 401 cascade).
  const hasSession = useMemo(() => hasSessionMarker(), []);

  const { data: user, isSuccess, isError } = useMe({ enabled: hasSession });

  useEffect(() => {
    if (!hasSession) {
      setUser(null);
      finishInitialize();
      return;
    }

    if (isSuccess) {
      setUser(user);
      finishInitialize();
    }

    if (isError) {
      // Session could not be restored (e.g. refresh cookie expired/invalid)
      clearSessionMarker();
      setUser(null);
      finishInitialize();
    }
  }, [hasSession, user, isSuccess, isError, setUser, finishInitialize]);

  return <>{children}</>;
}
