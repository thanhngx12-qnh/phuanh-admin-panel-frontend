// src/app/(admin)/_components/AdminHeader.tsx
'use client';

import React from 'react';
import { Layout, Avatar, Dropdown, MenuProps, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const { Header } = Layout;

export function AdminHeader() {
  const router = useRouter();
  
  // --- SỬA LỖI VÒNG LẶP VÔ HẠN ---
  // Lấy từng giá trị và action một cách riêng lẻ
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      {user && (
        <Dropdown menu={{ items }} placement="bottomRight">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <Typography.Text>{user.fullName || user.email}</Typography.Text>
          </div>
        </Dropdown>
      )}
    </Header>
  );
}