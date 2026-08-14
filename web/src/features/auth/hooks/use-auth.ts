import { User } from "@/types/user.type";

import { useAuthStore } from "../store/auth.store";

export interface AuthSnapshot {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

/**
 * Subscribe to the auth snapshot used by route guards.
 *
 * `isInitializing` is `true` until the session-restoration request (kick-off by
 * `AuthProvider`) settles. During this window protected routes should NOT render
 * their content (and therefore should NOT fire data-fetching queries yet) — the
 * access token is not guaranteed to be present until `useMe` resolves, otherwise
 * a page query would 401, trigger the refresh interceptor, and finally paint
 * after a flash of empty content.
 */
export function useAuth(): AuthSnapshot {
  return useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isInitializing: state.isInitializing,
  }));
}
