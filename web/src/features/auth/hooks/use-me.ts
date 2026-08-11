import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/get-me";

export const AUTH_QUERY_KEYS = {
  me: ["auth", "me"] as const,
};

interface UseMeOptions {
  /** Whether the session-restoration request should run (set false when no session marker exists). */
  enabled?: boolean;
}

export function useMe(options?: UseMeOptions) {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me,
    queryFn: getMe,
    retry: false,
    enabled: options?.enabled ?? true,
  });
}
