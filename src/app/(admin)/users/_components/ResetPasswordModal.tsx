// src/app/(admin)/users/_components/ResetPasswordModal.tsx
'use client';

import React from 'react';
import { App, Button, Form, Input, Modal } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { User } from '@/types';

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const resetPassword = async ({ id, newPassword }: { id: number; newPassword: string }): Promise<void> => {
  await api.post(`/admin/users/${id}/reset-password`, { newPassword });
};

export function ResetPasswordModal({ open, onClose, user }: ResetPasswordModalProps) {
  const [form] = Form.useForm();
  const { notification } = App.useApp();

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      notification.success({ message: `Reset mật khẩu cho ${user?.fullName} thành công!` });
      onClose();
      form.resetFields();
    },
    onError: (error: Error) => {
      notification.error({ message: 'Reset mật khẩu thất bại', description: error.message });
    },
  });

  const handleFinish = (values: { newPassword: string }) => {
    if (user) {
      mutation.mutate({ id: user.id, ...values });
    }
  };

  return (
    <Modal
      title={`Reset Mật khẩu cho ${user?.fullName}`}
      open={open}
      onCancel={onClose}
      destroyOnClose
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={mutation.isPending} onClick={form.submit}>
          Lưu Mật khẩu mới
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }, { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự.' }]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Xác nhận Mật khẩu mới"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Hai mật khẩu không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
}