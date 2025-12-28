// src/app/(auth)/layout.tsx
'use client';

/**
 * ⛔ Ngăn Next.js prerender các trang auth (login, forgot password)
 * Tránh lỗi build & hydration khi deploy Vercel
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
