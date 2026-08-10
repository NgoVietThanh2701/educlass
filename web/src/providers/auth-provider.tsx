"use client";

import { useEffect } from "react";

import { useMe } from "@/features/auth/hooks/use-me";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const finishInitialize = useAuthStore((state) => state.finishInitialize);

  const { data: user, isSuccess, isError } = useMe();

  useEffect(() => {
    if (isSuccess) {
      setUser(user);
      finishInitialize();
    }

    if (isError) {
      setUser(null);
      finishInitialize();
    }
  }, [user, isSuccess, isError, setUser, finishInitialize]);

  return <>{children}</>;
}
