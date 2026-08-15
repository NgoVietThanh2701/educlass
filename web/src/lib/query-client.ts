import { QueryClient } from "@tanstack/react-query";

import { queryRetryDelay, shouldRetryQuery } from "./query-retry";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Transient-error retry policy (network failures / 5xx) applied to every
      // query automatically — hooks only opt out by passing their own `retry`.
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});
