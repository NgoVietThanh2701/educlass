import { useMutation } from "@tanstack/react-query";

import { resendOtp, verifyOtp } from "../api/verify-otp";
import { useAuthStore } from "../store/auth.store";
import { setSessionMarker } from "@/lib/cookie";

export function useVerifyOtp() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: verifyOtp,

    onSuccess: (response) => {
      setSessionMarker();
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: resendOtp,
  });
}
