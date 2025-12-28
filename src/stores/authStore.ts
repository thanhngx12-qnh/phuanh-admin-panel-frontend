// File: src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types'; // Import User từ file types chung

// State definition
interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
}

// Action definition
interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,

      login: (user, token) => set({ user, token }),
      
      logout: () => {
        // Xóa sạch storage
        localStorage.removeItem('auth-storage'); 
        set({ user: null, token: null });
      },

      setUser: (user) => set({ user }),
      
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage', // Key trong localStorage
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist token, user info nên fetch lại hoặc persist tùy nhu cầu
      // Ở đây ta persist cả 2 để UX tốt hơn (không bị flash loading user info)
      partialize: (state) => ({ token: state.token, user: state.user }),
      
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);