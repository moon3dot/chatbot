import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdminAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      login: (adminData, token) => {
        set({
          admin: adminData,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
