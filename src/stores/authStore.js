import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasApiKey: false,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setApiKeyStatus: (status) => set({ hasApiKey: status }),

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.auth.login({
            email: credentials.email,
            password: credentials.password,
          });
          const user = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.email}`,
            token: result.token,
          };
          set({ user, token: result.token, hasApiKey: result.has_api_key, isAuthenticated: true, isLoading: false });
          return result;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },
      
      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.auth.signup({
            name: data.name,
            email: data.email,
            password: data.password,
          });
          const user = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.email}`,
            token: result.token,
          };
          set({ user, token: result.token, hasApiKey: false, isAuthenticated: true, isLoading: false });
          return result;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },
      
      logout: () => {
        set({ user: null, token: null, hasApiKey: false, isAuthenticated: false, error: null });
      },
      
      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'sonic-auth',
      partialize: (state) => ({ user: state.user, token: state.token, hasApiKey: state.hasApiKey, isAuthenticated: state.isAuthenticated }),
    }
  )
);