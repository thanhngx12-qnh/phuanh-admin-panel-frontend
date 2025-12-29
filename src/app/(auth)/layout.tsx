// src/app/(auth)/layout.tsx
'use client';

import React from 'react';

// Layout dành cho các trang auth (login, forgot password, ...)
// Không chứa Sidebar / Header
// Chỉ render trang con
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
