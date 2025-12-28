// File: src/lib/AntdRegistry.tsx
'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

// Wrapper component sử dụng thư viện chính thức của Ant Design cho Next.js 14
const StyledComponentsRegistry = ({ children }: { children: React.ReactNode }) => {
  return <AntdRegistry>{children}</AntdRegistry>;
};

export default StyledComponentsRegistry;