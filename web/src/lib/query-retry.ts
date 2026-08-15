import axios, { type AxiosError } from "axios";

const MAX_RETRY = 2;

/**
 * A failure is "transient" when a blind retry can plausibly succeed:
 *  - requests that never reached the API (ECONNRESET / socket hang up, DNS
 *    errors, timeouts) — typically a momentary proxy/dev-server hiccup, or
 *  - upstream server-side (5xx) errors.
 *
 * 4xx client errors are NEVER retried: the outcome is deterministic and the
 * axios response interceptor already handles 401 (refresh + single retry).
 */
export function isTransientQueryError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return true;
  }

  const status = (error as AxiosError).response?.status;

  return typeof status !== "number" || status >= 500;
}

/** Retry up to `MAX_RETRY` times, only for transient failures. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_RETRY && isTransientQueryError(error);
}

/** Exponential backoff: 500ms → 1s → 2s (capped at 3s). */
export function queryRetryDelay(failureCount: number): number {
  return Math.min(500 * 2 ** failureCount, 3_000);
}