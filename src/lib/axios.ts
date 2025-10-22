// admin-panel-frontend/src/lib/axios.ts
import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore'; // Import store

export interface BackendResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- SỬA LẠI TRIỆT ĐỂ INTERCEPTOR REQUEST ---
api.interceptors.request.use(
  (config) => {
    // Lấy token trực tiếp từ Zustand store mà không cần hook
    // Đây là cách an toàn để truy cập store bên ngoài component React
    const token = useAuthStore.getState().token;

    // Nếu có token, đính kèm vào header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;