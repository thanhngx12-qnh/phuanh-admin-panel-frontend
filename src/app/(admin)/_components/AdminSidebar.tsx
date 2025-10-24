// src/app/(admin)/_components/AdminSidebar.tsx
'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { DashboardOutlined, TruckOutlined, FormOutlined, AppstoreOutlined, ReadOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/configs/site';

const { Sider } = Layout;

// --- SỬA LỖI Ở ĐÂY: Lọc ra các giá trị có thể là null/undefined ---
// Định nghĩa một kiểu chặt chẽ hơn, không bao giờ là null hoặc undefined
type NonNullableMenuItem = NonNullable<MenuProps['items']>[number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: NonNullableMenuItem[],
  type?: 'group',
): NonNullableMenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as NonNullableMenuItem;
}

export function AdminSidebar() {
  const pathname = usePathname();

  const items: NonNullableMenuItem[] = [
    getItem(<Link href="/admin">Dashboard</Link>, '/admin', <DashboardOutlined />),
    getItem(<Link href="/consignments">Quản lý Vận đơn</Link>, '/consignments', <TruckOutlined />),
    getItem(<Link href="/quotes">Quản lý Báo giá</Link>, '/quotes', <FormOutlined />),
    getItem('Quản lý Nội dung', 'cms', <AppstoreOutlined />, [
      getItem(<Link href="/services">Dịch vụ</Link>, '/services'),
      getItem(<Link href="/news">Tin tức</Link>, '/news'),
    ]),
    getItem(<Link href="/careers">Quản lý Tuyển dụng</Link>, '/careers', <ReadOutlined />),
    getItem(<Link href="/users">Quản lý Người dùng</Link>, '/users', <UserOutlined />),
  ];

  const findParentMenuKey = (menuItems: NonNullableMenuItem[], currentPath: string): React.Key | undefined => {
    for (const item of menuItems) {
      // Thêm một bước kiểm tra `item` để chắc chắn
      if (item && 'children' in item && item.children) {
        // ép kiểu `item.children` về đúng dạng mảng để .some() hoạt động
        const hasActiveChild = (item.children as NonNullableMenuItem[]).some(
          (child) => child && child.key === currentPath
        );
        if (hasActiveChild) {
          return item.key;
        }
      }
    }
    return undefined;
  };
  
  const openKeys = findParentMenuKey(items, pathname);

  return (
    <Sider width={280} theme="light" collapsible>
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0EA5E9' }}>
        <h2 style={{ color: 'white', margin: 0 }}>{siteConfig.defaultTitle}</h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={openKeys ? [openKeys.toString()] : []}
        style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        items={items}
      />
    </Sider>
  );
}