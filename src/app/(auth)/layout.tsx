// src/app/(auth)/layout.tsx
import React from 'react';

// Layout này dành cho các trang công khai (login, forgot password, etc.)
// Nó không chứa Sidebar, Header hay logic bảo vệ.
// Nó chỉ đơn giản là render component trang con.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}