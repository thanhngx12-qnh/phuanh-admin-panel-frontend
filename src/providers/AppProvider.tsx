// admin-panel-frontend/src/providers/AppProvider.tsx
'use client'; // Đánh dấu đây là một Client Component

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Khởi tạo QueryClient ở ngoài component để nó không bị tạo lại mỗi lần render.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tắt tính năng tự động fetch lại khi focus vào cửa sổ
      retry: 1, // Thử lại request tối đa 1 lần nếu thất bại
    },
  },
});

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Công cụ DevTools cho React Query, chỉ hoạt động ở môi trường development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}