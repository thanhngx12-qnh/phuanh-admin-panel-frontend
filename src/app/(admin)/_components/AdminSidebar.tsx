// src/app/(admin)/_components/AdminSidebar.tsx
'use client';

import React, { useMemo } from 'react'; // Import useMemo
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { DashboardOutlined, TruckOutlined, FormOutlined, AppstoreOutlined, ReadOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/configs/site';
import { useAuthStore, UserRole } from '@/stores/authStore'; // Import UserRole

const { Sider } = Layout;

type NonNullableMenuItem = NonNullable<MenuProps['items']>[number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: NonNullableMenuItem[],
  type?: 'group',
): NonNullableMenuItem {
  return { key, icon, children, label, type } as NonNullableMenuItem;
}

// --- ĐỊNH NGHĨA CẤU TRÚC MENU VỚI QUYỀN HẠN ---
interface MenuItemConfig {
  label: React.ReactNode;
  key: React.Key;
  icon?: React.ReactNode;
  children?: Omit<MenuItemConfig, 'icon' | 'children' | 'roles'>[];
  roles: UserRole[]; // Mảng các vai trò được phép truy cập
}

// Dữ liệu gốc cho toàn bộ menu
const allMenuItems: MenuItemConfig[] = [
  { label: <Link href="/admin">Dashboard</Link>, key: '/admin', icon: <DashboardOutlined />, roles: ['ADMIN', 'CONTENT_MANAGER', 'SALES', 'OPS'] },
  { label: <Link href="/consignments">Quản lý Vận đơn</Link>, key: '/consignments', icon: <TruckOutlined />, roles: ['ADMIN', 'OPS'] },
  { label: <Link href="/quotes">Quản lý Báo giá</Link>, key: '/quotes', icon: <FormOutlined />, roles: ['ADMIN', 'SALES'] },
  {
    label: 'Quản lý Nội dung', key: 'cms', icon: <AppstoreOutlined />, roles: ['ADMIN', 'CONTENT_MANAGER'],
    children: [
      { label: <Link href="/services">Dịch vụ</Link>, key: '/services' },
      { label: <Link href="/news">Tin tức</Link>, key: '/news' },
    ],
  },
  { label: <Link href="/careers">Quản lý Tuyển dụng</Link>, key: '/careers', icon: <ReadOutlined />, roles: ['ADMIN', 'CONTENT_MANAGER'] },
  { label: <Link href="/users">Quản lý Người dùng</Link>, key: '/users', icon: <UserOutlined />, roles: ['ADMIN'] },
];


export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // --- LOGIC LỌC MENU THEO VAI TRÒ ---
  const accessibleMenuItems = useMemo(() => {
    if (!user?.role) return [];

    // Hàm đệ quy để lọc menu
    const filterMenu = (items: MenuItemConfig[]): NonNullableMenuItem[] => {
      const result: NonNullableMenuItem[] = [];
      for (const item of items) {
        // Kiểm tra xem vai trò của user có nằm trong danh sách roles của item không
        if (item.roles && item.roles.includes(user.role)) {
          // Nếu item có con, lọc tiếp các con của nó
          const children = item.children ? filterMenu(item.children as MenuItemConfig[]) : undefined;
          
          // Chỉ thêm SubMenu nếu nó còn ít nhất một con sau khi lọc
          if (children && children.length === 0) {
            continue;
          }

          result.push(getItem(item.label, item.key, item.icon, children));
        }
      }
      return result;
    };

    return filterMenu(allMenuItems);
  }, [user?.role]);


  const findParentMenuKey = (menuItems: NonNullableMenuItem[], currentPath: string): React.Key | undefined => {
    for (const item of menuItems) {
      if (item && 'children' in item && item.children) {
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
  
  const openKeys = findParentMenuKey(accessibleMenuItems, pathname);

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
        items={accessibleMenuItems} // <-- Sử dụng menu đã được lọc
      />
    </Sider>
  );
}