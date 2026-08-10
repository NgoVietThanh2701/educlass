import { User } from "@/types/user.type";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  accessToken: string | null;

  isAuthenticated: boolean;
  isInitializing: boolean;

  setUser(user: User | null): void;
  setAccessToken(accessToken: string | null): void;

  logout(): void;
  finishInitialize(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  isAuthenticated: false,
  isInitializing: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setAccessToken: (accessToken) =>
    set({
      accessToken,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),

  finishInitialize: () =>
    set({
      isInitializing: false,
    }),
}));
