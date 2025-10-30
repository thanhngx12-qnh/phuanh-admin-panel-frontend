// src/app/(admin)/services/_components/ServiceFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BackendResponse } from '@/lib/axios';
import { Service, Translation } from '@/types';
import { ImageUpload } from '@/components/ImageUpload';
import { Editor } from '@/components/Editor';

interface ServiceFormDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceId?: number | null;
}

type ServiceFormData = Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'translations'> & {
  translations: {
    [key: string]: Partial<Translation>;
  };
};

type ApiData = Omit<ServiceFormData, 'translations'> & {
  translations: Partial<Translation>[];
};

const fetchServiceById = async (id: number): Promise<Service> => {
  const response = await api.get<BackendResponse<Service>>(`/admin/services/${id}`);
  return response.data.data;
};

const createService = async (data: ApiData): Promise<Service> => {
  const response = await api.post<BackendResponse<Service>>('/admin/services', data);
  return response.data.data;
};

const updateService = async ({ id, data }: { id: number; data: ApiData }): Promise<Service> => {
  const response = await api.patch<BackendResponse<Service>>(`/admin/services/${id}`, data);
  return response.data.data;
};

export function ServiceFormDrawer({ open, onClose, serviceId }: ServiceFormDrawerProps) {
  const [form] = Form.useForm<ServiceFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const isEditMode = !!serviceId;

  const languageTabs: TabsProps['items'] = [
    { key: 'vi', label: 'Tiếng Việt (VI)' },
    { key: 'en', label: 'Tiếng Anh (EN)' },
    { key: 'zh', label: 'Tiếng Trung (ZH)' },
  ];

  const { data: editingService, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => fetchServiceById(serviceId!),
    enabled: isEditMode,
  });

  // --- SỬA LỖI Ở ĐÂY: Viết đầy đủ các mutation ---
  const handleMutationSuccess = () => {
    notification.success({ message: `Lưu dịch vụ thành công!` });
    queryClient.invalidateQueries({ queryKey: ['services'] });
    onClose();
  };
  const handleMutationError = (error: Error) => {
    notification.error({ message: 'Lưu dịch vụ thất bại', description: error.message });
  };

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: updateService,
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });
  
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEditMode && editingService) {
      const translationsForForm: { [key: string]: Partial<Translation> } = {};
      editingService.translations.forEach(t => {
        translationsForForm[t.locale] = t;
      });
      form.setFieldsValue({
        ...editingService,
        translations: translationsForForm,
      });
    } else {
      form.resetFields();
    }
  }, [editingService, isEditMode, open, form]);

  const handleFinish = (values: ServiceFormData) => {
    const apiData: ApiData = {
      ...values,
      translations: Object.entries(values.translations)
        .map(([locale, trans]) => ({ ...trans, locale: locale as 'vi' | 'en' | 'zh' }))
        .filter(t => t.title && t.title.trim() !== ''),
    };
    
    if (isEditMode) {
      updateMutation.mutate({ id: serviceId!, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Chỉnh sửa Dịch vụ' : 'Tạo Dịch vụ mới'}
      width={900}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={ <Space> <Button onClick={onClose}>Hủy</Button> <Button onClick={form.submit} type="primary" loading={isPending}> Lưu </Button> </Space> }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item label="Mã Dịch vụ (Code)" name="code" rules={[{ required: true, message: 'Vui lòng nhập mã dịch vụ!' }]}>
            <Input placeholder="Mã không trùng lặp, ví dụ: sea_freight" disabled={isEditMode} />
          </Form.Item>
          <Form.Item label="Danh mục" name="category" rules={[{ required: true, message: 'Vui lòng nhập danh mục!' }]}>
            <Input placeholder="Ví dụ: Vận Tải" />
          </Form.Item>
          <Form.Item label="Nổi bật" name="featured" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item label="Ảnh bìa" name="coverImage" rules={[{ required: true, message: 'Vui lòng upload ảnh bìa!' }]}>
            <ImageUpload />
          </Form.Item>
          
          <Tabs defaultActiveKey="vi">
            {languageTabs.map(tab => (
              <Tabs.TabPane tab={tab.label} key={tab.key}>
                <Form.Item label="Tiêu đề" name={['translations', tab.key, 'title']} rules={tab.key === 'vi' ? [{ required: true, message: 'Tiêu đề tiếng Việt là bắt buộc!' }] : []}>
                  <Input />
                </Form.Item>
                <Form.Item label="Slug (URL)" name={['translations', tab.key, 'slug']} rules={tab.key === 'vi' ? [{ required: true, message: 'Slug tiếng Việt là bắt buộc!' }] : []}>
                  <Input placeholder="Ví dụ: van-tai-duong-bien" />
                </Form.Item>
                <Form.Item label="Mô tả ngắn" name={['translations', tab.key, 'shortDesc']}>
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item label="Nội dung chi tiết" name={['translations', tab.key, 'content']}>
                  <Editor />
                </Form.Item>
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Form>
      </Spin>
    </Drawer>
  );
}