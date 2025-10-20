// src/app/(admin)/login/_components/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, Button, Checkbox, Typography, notification } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore, User } from '@/stores/authStore';
import { siteConfig } from '@/configs/site';
import api, { BackendResponse } from '@/lib/axios'; // Import BackendResponse

type LoginFormData = {
  email: string;
  password: string;
  remember: boolean;
};

type LoginResponse = {
  accessToken: string;
};

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      // --- SỬA LẠI CÁCH GỌI API ---
      // 1. Gọi API login. `api.post` trả về `Promise<AxiosResponse<BackendResponse<LoginResponse>>>`
      const loginResponse = await api.post<BackendResponse<LoginResponse>>('/auth/login', {
        email: values.email,
        password: values.password,
      });
      // 2. "Bóc" dữ liệu một cách an toàn
      const { accessToken } = loginResponse.data.data;

      // 3. Gọi API profile. `api.get` trả về `Promise<AxiosResponse<BackendResponse<User>>>`
      const profileResponse = await api.get<BackendResponse<User>>('/auth/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // 4. "Bóc" dữ liệu user
      const userProfile = profileResponse.data.data;

      // Bây giờ mọi thứ đã đúng kiểu 100%
      loginAction(userProfile, accessToken);

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
      notification.error({
        message: 'Đăng nhập thất bại',
        description: errorMessage,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Giao diện JSX không thay đổi
  return (
    <Card title={<Typography.Title level={3} style={{ textAlign: 'center', margin: 0 }}>{siteConfig.defaultTitle}</Typography.Title>} style={{ width: 400 }}>
      <Form
        name="admin_login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
        >
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