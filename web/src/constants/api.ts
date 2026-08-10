export const API_ENDPOINT = {
  // auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",

  // users
  ME: "/users/me",
} as const;
