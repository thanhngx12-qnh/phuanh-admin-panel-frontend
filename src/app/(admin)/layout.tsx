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
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  if (!isHydrated || !token) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* --- SỬA LỖI CẢNH BÁO CỦA SPIN --- */}
        {/* Bọc một div trống bên trong Spin để kích hoạt "nest pattern" */}
        <Spin size="large" tip="Đang xác thực...">
          <div style={{ padding: 50, background: 'rgba(0, 0, 0, 0.05)', borderRadius: 4 }} />
        </Spin>
      </div>
    );
  }

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