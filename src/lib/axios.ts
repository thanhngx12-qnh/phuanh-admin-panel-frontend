// admin-panel-frontend/src/lib/axios.ts
import axios, { AxiosResponse } from 'axios';

// Định nghĩa cấu trúc response chung từ backend của bạn
// Chúng ta sẽ export nó để có thể dùng ở nơi khác
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

api.interceptors.request.use(
  (config) => {
    // TODO: Thêm logic lấy token từ Zustand
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  // --- SỬA LẠI TRIỆT ĐỂ ---
  // Chỉ trả về nguyên gốc response, không "bóc" bất cứ thứ gì.
  (response: AxiosResponse) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;