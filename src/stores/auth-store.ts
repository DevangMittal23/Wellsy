import { create } from "zustand";
import type { Profile } from "@/types/user";

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, isLoading: false }),
}));
