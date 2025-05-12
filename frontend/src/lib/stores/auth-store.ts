import { create } from "zustand";
import { authAPI } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  checkAuth: async () => {
try {
      set({ loading: true });
      const userData = await authAPI.getProfile();
      set({ user: userData });

    } catch (err: any) {
      if (err.response?.status === 401) {
        // Handle 401 error gracefully - User is not logged in
        console.log("User is not logged in or session expired.");
        set({ user: null });
      } else {
        // Other errors
        console.error("Auth Check Error:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        set({ user: null });
      }
    } finally {
      set({ loading: false });
    }
  },


  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const response = await authAPI.login({ email, password });
      console.log("Login Response:", response);
      const userData = await authAPI.getProfile();
      set({ user: userData });
    } catch (err: any) {
      console.error("Login Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      set({ error: err.response?.data?.message || "Login failed" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  register: async (userData) => {
    try {
      set({ loading: true, error: null });
      await authAPI.register(userData);
      await useAuthStore.getState().login(userData.email, userData.password);
    } catch (err: any) {
      console.error("Register Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      set({ error: err.response?.data?.message || "Registration failed" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      await authAPI.logout();
      set({ user: null });
    } catch (err: any) {
      console.error("Logout Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      set({ error: err.response?.data?.message || "Logout failed" });
    } finally {
      set({ loading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
