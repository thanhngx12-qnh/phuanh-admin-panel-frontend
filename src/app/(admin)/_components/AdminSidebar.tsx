// dir: src/app/(admin)/_components/AdminSidebar.tsx
'use client';

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { 
  DashboardOutlined, 
  FormOutlined, 
  AppstoreOutlined, 
  ReadOutlined, 
  UserOutlined,
  FolderOpenOutlined // Thêm icon cho Danh mục
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/configs/site';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

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

interface MenuItemConfig {
  label: React.ReactNode;
  key: React.Key;
  icon?: React.ReactNode;
  children?: MenuItemConfig[];
  roles?: UserRole[];
}

const allMenuItems: MenuItemConfig[] = [
  { 
    label: <Link href="/admin">Dashboard</Link>, 
    key: '/admin', 
    icon: <DashboardOutlined />, 
    roles: ['CONTENT_MANAGER', 'SALES'] 
  },
  { 
    label: <Link href="/quotes">Quản lý Báo giá</Link>, 
    key: '/quotes', 
    icon: <FormOutlined />, 
    roles: ['SALES'] 
  },
  {
    label: 'Quản lý Nội dung', 
    key: 'cms', 
    icon: <AppstoreOutlined />, 
    roles: ['CONTENT_MANAGER'],
    children: [
      { label: <Link href="/services">Dịch vụ</Link>, key: '/services', icon: <AppstoreOutlined /> },
      { label: <Link href="/news">Tin tức</Link>, key: '/news', icon: <ReadOutlined /> },
      // THÊM MỤC QUẢN LÝ DANH MỤC VÀO ĐÂY
      { label: <Link href="/categories">Danh mục</Link>, key: '/categories', icon: <FolderOpenOutlined /> },
    ],
  },
  { 
    label: <Link href="/careers">Quản lý Tuyển dụng</Link>, 
    key: '/careers', 
    icon: <ReadOutlined />, 
    roles: ['CONTENT_MANAGER'] 
  },
  { 
    label: <Link href="/users">Quản lý Người dùng</Link>, 
    key: '/users', 
    icon: <UserOutlined />, 
    roles: [] 
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const accessibleMenuItems = useMemo(() => {
    if (!user?.role) return [];

    const isAdmin = user.role === 'ADMIN';

    const filterMenu = (items: MenuItemConfig[]): NonNullableMenuItem[] => {
      const result: NonNullableMenuItem[] = [];
      
      for (const item of items) {
        const hasPermission = isAdmin || !item.roles || (item.roles && item.roles.includes(user.role));

        if (hasPermission) {
          let children: NonNullableMenuItem[] | undefined = undefined;
          
          if (item.children) {
            children = filterMenu(item.children);
            if (children.length === 0 && !isAdmin) {
              continue; 
            }
          }

          result.push(getItem(item.label, item.key, item.icon, children));
        }
      }
      return result;
    };

    return filterMenu(allMenuItems);
  }, [user?.role]);

  const findParentMenuKey = (menuItems: NonNullableMenuItem[], currentPath: string): string | undefined => {
    for (const item of menuItems) {
      // @ts-ignore
      if (item && item.children) {
        // @ts-ignore
        const hasActiveChild = item.children.some((child: any) => child && child.key === currentPath);
        if (hasActiveChild) {
          return item.key as string;
        }
      }
    }
    return undefined;
  };
  
  const openKey = findParentMenuKey(accessibleMenuItems, pathname);

  return (
    <Sider width={280} theme="light" collapsible breakpoint="lg" collapsedWidth="0">
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#003366' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          TÀ LÙNG LOGISTICS
        </h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={openKey ? [openKey] : []}
        style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        items={accessibleMenuItems}
      />
    </Sider>
  );
}