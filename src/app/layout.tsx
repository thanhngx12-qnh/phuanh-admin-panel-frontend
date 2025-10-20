// admin-panel-frontend/src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import theme from '@/configs/theme';
import AntdRegistry from '@/lib/AntdRegistry';
import React from 'react';
import { siteConfig } from '@/configs/site';
import { AppProvider } from '@/providers/AppProvider'; // <-- Import AppProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: siteConfig.defaultTitle,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.companyName }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Bọc toàn bộ bằng AppProvider để cung cấp React Query context */}
        <AppProvider>
          <AntdRegistry>
            <ConfigProvider theme={theme} wave={{ disabled: true }}>
              {children}
            </ConfigProvider>
          </AntdRegistry>
        </AppProvider>
      </body>
    </html>
  );
}