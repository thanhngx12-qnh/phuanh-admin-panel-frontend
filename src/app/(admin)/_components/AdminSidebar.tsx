// src/app/(admin)/_components/AdminSidebar.tsx
'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, TruckOutlined, FormOutlined, AppstoreOutlined, ReadOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/configs/site';

const { Sider } = Layout;

// TODO: Logic filter menu theo role sẽ được thêm sau
const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard', roles: ['ADMIN', 'CONTENT_MANAGER', 'SALES', 'OPS'] },
  { key: '/admin/consignments', icon: <TruckOutlined />, label: 'Quản lý Vận đơn', roles: ['ADMIN', 'OPS'] },
  { key: '/admin/quotes', icon: <FormOutlined />, label: 'Quản lý Báo giá', roles: ['ADMIN', 'SALES'] },
  {
    key: 'cms',
    icon: <AppstoreOutlined />,
    label: 'Quản lý Nội dung',
    roles: ['ADMIN', 'CONTENT_MANAGER'],
    children: [
      { key: '/admin/services', label: 'Dịch vụ' },
      { key: '/admin/news', label: 'Tin tức' },
    ],
  },
  { key: '/admin/careers', icon: <ReadOutlined />, label: 'Quản lý Tuyển dụng', roles: ['ADMIN', 'CONTENT_MANAGER'] },
  { key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý Người dùng', roles: ['ADMIN'] },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const accessibleMenuItems = menuItems;

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
      >
        {accessibleMenuItems.map((item) =>
          item.children ? (
            <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
              {item.children.map((child) => (
                <Menu.Item key={child.key}>
                  <Link href={child.key}>{child.label}</Link>
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          ) : (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link href={item.key}>{item.label}</Link>
            </Menu.Item>
          )
        )}
      </Menu>
    </Sider>
  );
}