// admin-panel-frontend/src/lib/axios.ts
import axios from 'axios';

// Tạo một instance axios được cấu hình sẵn
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request:
// Middleware này sẽ được thực thi TRƯỚC KHI mỗi request được gửi đi.
api.interceptors.request.use(
  (config) => {
    // TODO: Sau này, chúng ta sẽ lấy token từ Zustand/localStorage và đính kèm vào đây.
    // Ví dụ:
    // const token = authStore.getState().token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response:
// Middleware này sẽ được thực thi SAU KHI nhận được response từ API.
api.interceptors.response.use(
  (response) => {
    // Backend của chúng ta luôn trả về cấu trúc { statusCode, message, data }.
    // Chúng ta sẽ tự động "bóc" lớp `data` ra cho tiện sử dụng ở frontend.
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    // TODO: Xử lý các lỗi chung từ API (ví dụ: lỗi 401 Unauthorized -> logout người dùng)
    // if (error.response.status === 401) {
    //   authStore.getState().logout();
    // }
    
    // Ném lỗi để React Query có thể bắt và xử lý ở từng hook.
    // Chúng ta sẽ lấy message lỗi từ response của backend nếu có.
    const errorMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;