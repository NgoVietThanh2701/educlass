import logout from "@/features/auth/api/logout";
import { refreshAccessToken } from "@/features/auth/api/refresh";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

interface RetryQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshing = false;

let failedQueue: RetryQueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
    }
  });

  failedQueue = [];
}

function isAuthEndpoint(url?: string) {
  if (!url) {
    return false;
  }

  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ].some((endpoint) => url.includes(endpoint));
}

export function setupRequestInterceptor(api: AxiosInstance) {
  api.interceptors.request.use(
    (config) => {
      const accessToken = useAuthStore.getState().accessToken;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );
}

export function setupResponseInterceptor(api: AxiosInstance) {
  api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig;

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        isAuthEndpoint(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;

              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        try {
          await logout();
        } catch {
          // Ignore logout API error.
        }

        useAuthStore.getState().logout();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
