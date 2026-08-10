import { useMutation } from "@tanstack/react-query";
import { login } from "../api/login";
import { useAuthStore } from "../store/auth.store";

export function useLogin() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: login,

    onSuccess: (response) => {
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
    },
  });
}
