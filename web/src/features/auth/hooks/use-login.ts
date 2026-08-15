import { useMutation, useQueryClient } from "@tanstack/react-query";

import { login } from "../api/login";
import { useAuthStore } from "../store/auth.store";
import { setSessionMarker } from "@/lib/cookie";

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: login,

    onSuccess: (data) => {
      setSessionMarker();
      setAuth({ user: data.user, accessToken: data.accessToken });

      // Auth boundary: the user (and their role — TEACHER/STUDENT) may have
      // changed, so drop every cached query to prevent cross-session/role
      // data leakage. `removeQueries` leaves the running mutation untouched.
      queryClient.removeQueries();
    },
  });
}
