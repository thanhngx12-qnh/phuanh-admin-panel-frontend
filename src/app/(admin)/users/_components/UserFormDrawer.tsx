// src/app/(admin)/users/_components/UserFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space, Spin } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BackendResponse } from '@/lib/axios';
import { User } from '@/types';

interface UserFormDrawerProps { open: boolean; onClose: () => void; userId?: number | null; }
type UserFormData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

const fetchUserById = async (id: number): Promise<User> => {
  const response = await api.get<BackendResponse<User>>(`/admin/users/${id}`);
  return response.data.data;
};

const createUser = async (data: UserFormData): Promise<User> => {
  const response = await api.post<BackendResponse<User>>('/admin/users', data);
  return response.data.data;
};

const updateUser = async ({ id, data }: { id: number; data: Partial<UserFormData> }): Promise<User> => {
  const response = await api.patch<BackendResponse<User>>(`/admin/users/${id}`, data);
  return response.data.data;
};

export function UserFormDrawer({ open, onClose, userId }: UserFormDrawerProps) {
  const [form] = Form.useForm<UserFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const isEditMode = !!userId;

  const { data: editingUser, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId!),
    enabled: isEditMode,
  });

  // --- SỬA LỖI #1: Tách thành hai mutation riêng biệt ---
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      notification.success({ message: 'Tạo người dùng thành công!' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: Error) => { notification.error({ message: 'Tạo thất bại', description: error.message }); },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật người dùng thành công!' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: Error) => { notification.error({ message: 'Cập nhật thất bại', description: error.message }); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEditMode && editingUser) {
      form.setFieldsValue(editingUser);
    } else {
      form.resetFields();
    }
  }, [editingUser, isEditMode, open, form]);

  const handleFinish = (values: UserFormData) => {
    if (isEditMode) {
      const { email, ...updateData } = values;
      updateMutation.mutate({ id: userId!, data: updateData });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Chỉnh sửa Người dùng' : 'Tạo Người dùng mới'}
      width={480} onClose={onClose} open={open} destroyOnClose
      extra={ <Space> <Button onClick={onClose}>Hủy</Button> <Button onClick={form.submit} type="primary" loading={isPending}> Lưu </Button> </Space> }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
            <Input disabled={isEditMode} />
          </Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}>
            <Select placeholder="Chọn vai trò" disabled={userId === 1}>
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="CONTENT_MANAGER">Content Manager</Select.Option>
              <Select.Option value="SALES">Sales</Select.Option>
              <Select.Option value="OPS">Ops</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
}