// admin-panel-frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- 1. Định nghĩa Types (Data Contract) ---
// Định nghĩa các vai trò người dùng để đảm bảo nhất quán
export type UserRole = 'ADMIN' | 'CONTENT_MANAGER' | 'SALES' | 'OPS';

// Định nghĩa cấu trúc của đối tượng User
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

// Định nghĩa trạng thái của store
interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean; // Trạng thái để biết store đã được load từ localStorage hay chưa
}

// Định nghĩa các hành động (actions) có thể thực hiện trên store
interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setHydrated: () => void;
}

// --- 2. Tạo Store với Middleware `persist` ---
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // --- State mặc định ---
      user: null,
      token: null,
      isHydrated: false,

      // --- Actions ---
      login: (user, token) => {
        set({ user, token });
      },

      logout: () => {
        // Xóa thông tin user và token khỏi state
        set({ user: null, token: null });
      },

      setUser: (user) => {
        set({ user });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      }
    }),
    {
      // --- Cấu hình cho Middleware `persist` ---
      name: 'auth-storage', // Tên của key trong localStorage
      storage: createJSONStorage(() => localStorage), // Chỉ định sử dụng localStorage

      // Chỉ lưu trữ `token` vào localStorage.
      // Không lưu `user` vì thông tin user có thể thay đổi và nên được fetch lại khi cần.
      partialize: (state) => ({ token: state.token }),

      // Hàm này sẽ được gọi sau khi state được load từ localStorage.
      // Chúng ta dùng nó để cập nhật cờ `isHydrated`.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      }
    }
  )
);