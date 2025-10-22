// src/app/(admin)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { AdminHeader } from './_components/AdminHeader';
import { AdminSidebar } from './_components/AdminSidebar';
import { siteConfig } from '@/configs/site';

const { Content, Footer } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    // Chỉ kiểm tra sau khi store đã được khôi phục từ localStorage
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  // Hiển thị loading cho đến khi chắc chắn về trạng thái xác thực
  if (!isHydrated || !token) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Đang xác thực..." />
      </div>
    );
  }

  // Nếu đã xác thực, hiển thị layout chính
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminSidebar />
      <Layout>
        <AdminHeader />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8 }}>
          {children}
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          ©{new Date().getFullYear()} {siteConfig.companyName}. All Rights Reserved.
        </Footer>
      </Layout>
    </Layout>
  );
}