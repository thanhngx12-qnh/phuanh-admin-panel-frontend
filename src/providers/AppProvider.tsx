// File: src/providers/AppProvider.tsx
'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Sử dụng useState để đảm bảo QueryClient chỉ được tạo 1 lần duy nhất
  // trong suốt vòng đời của component trên client, tránh hydration mismatch
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Thời gian data được coi là "tươi mới" (5 phút)
        staleTime: 5 * 60 * 1000, 
        // Không tự động fetch lại khi focus cửa sổ (giảm tải cho server)
        refetchOnWindowFocus: false,
        // Số lần thử lại khi request thất bại
        retry: 1, 
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}