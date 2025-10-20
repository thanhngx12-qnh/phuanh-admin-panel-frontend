// admin-panel-frontend/next.config.ts
import { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output: 'standalone', // Giữ lại nếu bạn muốn dùng cho Docker

  // XÓA HOÀN TOÀN PHẦN WEBPACK TÙY CHỈNH
  // Ant Design 5 (CSS-in-JS) hoạt động tốt với Next.js 14+ mà không cần
  // tùy chỉnh webpack sâu cho Less, miễn là bạn không import file .less trực tiếp.
  // Việc theme hóa sẽ được xử lý qua ConfigProvider và token.
};

export default nextConfig;