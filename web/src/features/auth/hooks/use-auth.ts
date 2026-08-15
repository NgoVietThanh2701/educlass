import { useShallow } from "zustand/react/shallow";

import type { User } from "@/types/user.type";

import { useAuthStore } from "../store/auth.store";

export interface AuthSnapshot {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

/**
 * Subscribe to the auth snapshot used by route guards.
 *
 * `isInitializing` is `true` until session restoration (kicked off by
 * `AuthProvider` via a single `/auth/refresh` round-trip) settles. During this
 * window protected routes should NOT render their content (and therefore should
 * NOT fire data-fetching queries yet) — the access token is not guaranteed to
 * be present until the refresh resolves, otherwise a page query would 401,
 * trigger the refresh interceptor, and finally paint after a flash of empty
 * content.
 *
 * `useShallow` keeps the aggregated snapshot referentially stable unless any
 * primitive actually changed — this lets `useSyncExternalStore` cache its
 * snapshot instead of treating every render as new state (avoids the
 * "getServerSnapshot should be cached" infinite-loop warning).
 */
export function useAuth(): AuthSnapshot {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isInitializing: state.isInitializing,
    })),
  );
}
