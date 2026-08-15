import { useMutation, useQueryClient } from "@tanstack/react-query";

import { resendOtp, verifyOtp } from "../api/verify-otp";
import { useAuthStore } from "../store/auth.store";
import { setSessionMarker } from "@/lib/cookie";

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: verifyOtp,

    onSuccess: (data) => {
      setSessionMarker();
      setAuth({ user: data.user, accessToken: data.accessToken });

      // OTP verify logs the user in → auth boundary, drop stale cached data.
      queryClient.removeQueries();
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: resendOtp,
  });
}
