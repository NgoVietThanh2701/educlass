import { useMutation, useQueryClient } from "@tanstack/react-query";

import logout from "../api/logout";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Auth boundary — the next session must never see this user's cached data.
      queryClient.removeQueries();
    },
  });
}
