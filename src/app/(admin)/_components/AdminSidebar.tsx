// src/app/(admin)/_components/AdminSidebar.tsx
'use client';

import React from 'react';
import { Layout, Menu, MenuProps } from 'antd';
import { DashboardOutlined, TruckOutlined, FormOutlined, AppstoreOutlined, ReadOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/configs/site';
import { useAuthStore } from '@/stores/authStore';

const { Sider } = Layout;

// --- SỬA LỖI DEPRECATED WARNING ---
// Định nghĩa kiểu cho một mục menu để dễ quản lý
type MenuItem = Required<MenuProps>['items'][number];

// Hàm helper để tạo một mục menu
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // TODO: Logic filter menu theo role sẽ được hoàn thiện sau
  const items: MenuItem[] = [
    getItem(<Link href="/admin">Dashboard</Link>, '/admin', <DashboardOutlined />),
    getItem(<Link href="/admin/consignments">Quản lý Vận đơn</Link>, '/admin/consignments', <TruckOutlined />),
    getItem(<Link href="/admin/quotes">Quản lý Báo giá</Link>, '/admin/quotes', <FormOutlined />),
    getItem('Quản lý Nội dung', 'cms', <AppstoreOutlined />, [
      getItem(<Link href="/admin/services">Dịch vụ</Link>, '/admin/services'),
      getItem(<Link href="/admin/news">Tin tức</Link>, '/admin/news'),
    ]),
    getItem(<Link href="/admin/careers">Quản lý Tuyển dụng</Link>, '/admin/careers', <ReadOutlined />),
    getItem(<Link href="/admin/users">Quản lý Người dùng</Link>, '/admin/users', <UserOutlined />),
  ];

  return (
    <Sider width={280} theme="light" collapsible>
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0EA5E9' }}>
        <h2 style={{ color: 'white', margin: 0 }}>{siteConfig.defaultTitle}</h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={['cms']}
        style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        items={items} // <-- Sử dụng prop `items` thay vì children
      />
    </Sider>
  );
}