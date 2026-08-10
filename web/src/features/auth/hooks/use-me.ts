import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/get-me";

export const AUTH_QUERY_KEYS = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.me,
    queryFn: getMe,
    retry: false,
  });
}
