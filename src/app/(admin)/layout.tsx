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
  
  // --- SỬA LỖI VÒNG LẶP VÔ HẠN ---
  // Lấy từng giá trị riêng lẻ để tránh tạo object mới mỗi lần render.
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login');
    }
  }, [isHydrated, token, router]);

  // Nếu store chưa được khôi phục, hiển thị màn hình loading toàn trang
  if (!isHydrated) {
    return (
      // --- SỬA LỖI CẢNH BÁO CỦA SPIN ---
      // Đặt Spin vào một container để nó có thể chiếm toàn màn hình
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)' }}>
        <Spin size="large"/>
      </div>
    );
  }
  
  // Nếu đã khôi phục và không có token, trả về null để chờ useEffect chuyển hướng
  if (!token) {
    return null;
  }

  // Nếu có token, hiển thị layout chính
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