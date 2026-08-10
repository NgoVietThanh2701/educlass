import { useMutation } from "@tanstack/react-query";
import { register } from "../api/register";

export function useRegister() {
  return useMutation({
    mutationFn: register,

    onSuccess: (response) => {
      console.log("Register response:", response);
    },
  });
}
