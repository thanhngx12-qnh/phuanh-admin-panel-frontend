// admin-panel-frontend/src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd'; // Import ConfigProvider
import theme from '@/configs/theme'; // Import theme của chúng ta

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quang Minh Admin Panel',
  description: 'Admin Panel for Quang Minh Smart Border',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Bọc toàn bộ ứng dụng bằng Ant Design ConfigProvider để áp dụng theme */}
        <ConfigProvider theme={theme}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}