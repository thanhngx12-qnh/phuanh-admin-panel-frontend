// File: src/lib/axios.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';

// Interface chuẩn cho response từ Backend
export interface BackendResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 20000, // Tăng timeout lên 20s cho các request nặng
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ưu tiên lấy token từ Store (đã sync với localStorage)
    let token = useAuthStore.getState().token;
    
    // Fallback: Nếu store chưa kịp hydrate, thử lấy trực tiếp từ Cookie (an toàn hơn cho lần load đầu)
    if (!token) {
      token = Cookies.get('auth-storage') ? JSON.parse(Cookies.get('auth-storage')!).state.token : null;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Trả về toàn bộ response để component có thể check statusCode nếu cần
    // Hoặc nếu bạn muốn chỉ lấy data: return response.data;
    return response;
  },
  async (error: AxiosError<BackendResponse>) => {
    const originalRequest = error.config;
    
    // Xử lý lỗi 401 (Unauthorized) - Token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401) {
      // Gọi action logout từ store để xóa state
      useAuthStore.getState().logout();
      
      // Chuyển hướng về trang login nếu đang không ở đó (dùng window.location cho an toàn ở axios)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Trả về lỗi nguyên bản để React Query có thể bắt được (onError)
    // Không ném new Error() vì sẽ làm mất thông tin response
    return Promise.reject(error);
  }
);

export default api;