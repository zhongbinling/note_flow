import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type User } from '../services/api';
import { useNoteStore } from '../store/noteStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(email, password);

          if (response.success) {
            localStorage.setItem('token', response.data.token);
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            // Pull notes from server after successful login
            useNoteStore.getState().pullFromServer();
            return true;
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.register(email, password, name);

          if (response.success) {
            localStorage.setItem('token', response.data.token);
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const state = get();

        // If already authenticated, don't re-check (avoid flickering)
        if (state.isAuthenticated && state.user) {
          return;
        }

        const token = state.token || localStorage.getItem('token');

        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        // Only show loading if not already authenticated
        if (!state.isAuthenticated) {
          set({ isLoading: true });
        }

        try {
          const response = await authApi.me();

          if (response.success) {
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            // Pull notes from server when session is restored
            useNoteStore.getState().pullFromServer();
          } else {
            localStorage.removeItem('token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          // On error, keep the current state if already authenticated
          // Only clear auth if not already authenticated
          if (!state.isAuthenticated) {
            localStorage.removeItem('token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },
    }),
    {
      name: 'noteflow-auth',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
