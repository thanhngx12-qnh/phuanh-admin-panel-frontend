// src/app/(auth)/login/_components/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Card, Form, Input, Button, Checkbox, Typography } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';
import { siteConfig } from '@/configs/site';
import api, { BackendResponse } from '@/lib/axios';

type LoginFormData = {
  email: string;
  password: string;
  remember: boolean;
};

// --- SỬA LỖI Ở ĐÂY ---
// Sửa lại type để khớp với response của backend
type LoginResponse = {
  access_token: string; // <-- Đã sửa thành snake_case
};

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { notification } = App.useApp();

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      // 1. Lấy token
      const loginRes = await api.post<BackendResponse<LoginResponse>>('/auth/login', {
        email: values.email,
        password: values.password,
      });
      
      // --- SỬA LỖI Ở ĐÂY ---
      // Đọc đúng key 'access_token' từ response
      const { access_token } = loginRes.data.data;

      // 2. Cập nhật token vào store
      useAuthStore.setState({ token: access_token });

      // 3. Lấy thông tin user, truyền header thủ công
      const profileRes = await api.get<BackendResponse<User>>('/auth/profile', {
        headers: {
          Authorization: `Bearer ${access_token}`, // <-- Sử dụng biến đã sửa
        },
      });
      const userProfile = profileRes.data.data;

      // 4. Cập nhật thông tin user vào store
      setUser(userProfile);

      notification.success({
        message: 'Đăng nhập thành công',
        description: `Chào mừng ${userProfile.fullName} quay trở lại!`,
        placement: 'topRight',
      });
      
      router.push('/admin');

    } catch (error: unknown) {
      let errorMessage = 'Email hoặc mật khẩu không chính xác.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      useAuthStore.getState().logout();
      notification.error({
        message: 'Đăng nhập thất bại',
        description: errorMessage,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // JSX không thay đổi
  return (
    <Card title={<Typography.Title level={3} style={{ textAlign: 'center', margin: 0 }}>{siteConfig.defaultTitle}</Typography.Title>} style={{ width: 400 }}>
      <Form name="admin_login" initialValues={{ remember: true }} onFinish={onFinish} size="large">
        <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
        </Form.Item>
        <Form.Item>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}