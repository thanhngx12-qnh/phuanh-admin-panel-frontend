// src/app/(admin)/_components/AdminSidebar.tsx
'use client';

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { DashboardOutlined, TruckOutlined, FormOutlined, AppstoreOutlined, ReadOutlined, UserOutlined } from '@ant-design/icons';
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

// --- ĐỊNH NGHĨA CẤU TRÚC MENU ---
interface MenuItemConfig {
  label: React.ReactNode;
  key: React.Key;
  icon?: React.ReactNode;
  children?: MenuItemConfig[]; // Sửa lại type children cho đệ quy dễ hơn
  roles?: UserRole[]; // Mảng các vai trò được phép truy cập (Optional)
}

// Dữ liệu gốc cho toàn bộ menu
// Lưu ý: Với logic mới, 'ADMIN' không bắt buộc phải có trong mảng roles, 
// nhưng giữ lại để tường minh hoặc nếu sau này bỏ logic super-admin.
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
      { label: <Link href="/services">Dịch vụ</Link>, key: '/services' },
      { label: <Link href="/news">Tin tức</Link>, key: '/news' },
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
    roles: [] // Chỉ Admin thấy (do logic bên dưới xử lý)
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // --- LOGIC LỌC MENU THEO VAI TRÒ ---
  const accessibleMenuItems = useMemo(() => {
    if (!user?.role) return [];

    const isAdmin = user.role === 'ADMIN';

    // Hàm đệ quy để lọc menu
    const filterMenu = (items: MenuItemConfig[]): NonNullableMenuItem[] => {
      const result: NonNullableMenuItem[] = [];
      
      for (const item of items) {
        // LOGIC QUAN TRỌNG:
        // 1. Nếu là ADMIN -> Luôn cho phép (TRUE)
        // 2. Nếu item không quy định roles -> Cho phép (Public trong admin)
        // 3. Nếu item có roles -> Check xem user.role có nằm trong đó không
        const hasPermission = isAdmin || !item.roles || (item.roles && item.roles.includes(user.role));

        if (hasPermission) {
          // Xử lý children nếu có
          let children: NonNullableMenuItem[] | undefined = undefined;
          
          if (item.children) {
            children = filterMenu(item.children);
            // Nếu có children nhưng sau khi lọc lại rỗng (user không có quyền vào sub-menu nào)
            // thì ẩn luôn menu cha (trừ khi là Admin thì thường thấy hết)
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

  // Logic tìm key để mở submenu (OpenKeys)
  const findParentMenuKey = (menuItems: NonNullableMenuItem[], currentPath: string): string | undefined => {
    for (const item of menuItems) {
      // @ts-ignore - Antd Menu types hơi phức tạp khi truy cập children sâu
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
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0EA5E9' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
          {siteConfig.defaultTitle}
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