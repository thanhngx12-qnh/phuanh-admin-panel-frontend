// admin-panel-frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for identifying potential problems in an application
  swcMinify: true, // Use SWC for minification for better performance
  output: 'standalone', // Optional: for easier Docker deployments

  // Custom Webpack configuration to handle Less and Ant Design styles
  webpack: (config, { isServer }) => {
    // Tùy chỉnh Less
    config.module.rules.push({
      test: /\.less$/,
      use: [
        {
          loader: 'css-loader', // Biến Less CSS thành CommonJS
          options: {
            // Cần thiết để xử lý các đường dẫn @import trong Less
            // và đảm bảo CSS Modules không được áp dụng cho Ant Design
            modules: {
              // Bỏ qua CSS Modules cho các file Ant Design
              auto: (resourcePath) => !resourcePath.includes('node_modules'),
              // Sử dụng tên class hashing cho các module CSS/Less của bạn
              localIdentName: '[local]--[hash:base64:5]',
            },
          },
        },
        {
          loader: 'less-loader', // Biên dịch Less thành CSS
          options: {
            lessOptions: {
              javascriptEnabled: true, // Cần thiết cho các tính năng Less của Ant Design
              // Định nghĩa các biến Less để tùy chỉnh theme Ant Design
              // Các biến này sẽ override các biến mặc định của Ant Design
              modifyVars: {
                // Ví dụ:
                // '@primary-color': '#0EA5E9', // Cyan
                // '@border-radius-base': '8px',
                // Để theme hóa đầy đủ, chúng ta sẽ dùng ConfigProvider trong React
              },
            },
          },
        },
      ],
    });

    // Cấu hình CSS-in-JS cho Ant Design (nếu Next.js chưa tự động xử lý)
    // Next.js 13+ và Ant Design 5+ thường không yêu cầu cấu hình đặc biệt cho CSS-in-JS
    // vì chúng đã tương thích tốt với App Router và Server Components.
    // Tuy nhiên, nếu gặp vấn đề về styles, có thể cần thêm polyfill hoặc cách cấu hình khác.
    // Hiện tại, chúng ta tin tưởng Ant Design 5 sẽ hoạt động mượt mà với Next.js 14.

    return config;
  },
};

module.exports = nextConfig;