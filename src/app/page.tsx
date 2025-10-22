// src/app/(admin)/page.tsx
'use client';

import { Typography } from 'antd';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <Typography.Title level={2}>Chào mừng đến với Dashboard</Typography.Title>
      <Typography.Paragraph>
        Xin chào, <strong>{user?.fullName || 'Quản trị viên'}</strong>!
      </Typography.Paragraph>
      <Typography.Paragraph>
        Đây là trang quản trị của hệ thống. Bạn có thể bắt đầu bằng cách chọn một mục từ thanh điều hướng bên trái.
      </Typography.Paragraph>
    </div>
  );
}