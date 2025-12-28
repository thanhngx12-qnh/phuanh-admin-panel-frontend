// admin-panel-frontend/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Thêm dòng này để tắt hoàn toàn sharp trong build
    unoptimized: true,
  },
};

module.exports = nextConfig;