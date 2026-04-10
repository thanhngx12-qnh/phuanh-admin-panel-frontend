// dir: frontend/src/app/(admin)/services/_components/ServiceFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs, Typography, Tooltip } from 'antd';
import { MessageOutlined, AppstoreOutlined } from '@ant-design/icons';
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

// --- HÀM TẠO SLUG TỰ ĐỘNG ---
const toSlug = (str: string) => {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[đĐ]/g, 'd');
  str = str.replace(/([^0-9a-z-\s])/g, '');
  str = str.replace(/(\s+)/g, '-');
  str = str.replace(/-+/g, '-');
  str = str.replace(/^-+|-+$/g, '');
  return str;
};

const fetchServiceById = async (id: number): Promise<Service> => {
  const response = await api.get<BackendResponse<Service>>(`/admin/services/${id}`);
  return response.data.data;
};

type ApiData = Omit<ServiceFormData, 'translations'> & {
  translations: Partial<Translation>[];
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

  // --- LOGIC TẠO SLUG TỰ ĐỘNG ---
  const generateSlugForLocale = (locale: string) => {
    const title = form.getFieldValue(['translations', locale, 'title']);
    if (!title) {
      notification.warning({ message: 'Vui lòng nhập Tên dịch vụ trước khi tạo URL!' });
      return;
    }
    form.setFieldValue(['translations', locale, 'slug'], toSlug(title));
    notification.info({ message: 'Đã tạo URL chuẩn SEO cho ' + locale.toUpperCase() });
  };

  const { data: editingService, isLoading } = useQuery({
    queryKey: ['services', serviceId],
    queryFn: () => fetchServiceById(serviceId!),
    enabled: isEditMode && open,
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      notification.success({ message: 'Thêm dịch vụ thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (error: Error) => notification.error({ message: 'Lỗi', description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (error: Error) => notification.error({ message: 'Lỗi', description: error.message }),
  });

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
    } else if (open) {
      form.resetFields();
    }
  }, [editingService, isEditMode, open, form]);

  const handleFinish = (values: ServiceFormData) => {
    const { translations, ...restValues } = values;
    const apiData: ApiData = {
      ...restValues,
      translations: Object.entries(translations)
        .map(([locale, trans]) => ({ ...trans, locale: locale as 'vi' | 'en' | 'zh' }))
        .filter(t => t.title && t.title.trim() !== ''),
    };
    
    if (isEditMode) {
      updateMutation.mutate({ id: serviceId!, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  // --- CẤU HÌNH TABS HIỆN ĐẠI ---
  const tabItems = [
    { key: 'vi', label: 'Tiếng Việt (VI)' },
    { key: 'en', label: 'Tiếng Anh (EN)' },
    { key: 'zh', label: 'Tiếng Trung (ZH)' },
  ].map(tab => ({
    key: tab.key,
    label: tab.label,
    children: (
      <div style={{ padding: '16px 0' }}>
        <Form.Item 
          label={<Typography.Text strong>Tên Dịch vụ</Typography.Text>} 
          name={['translations', tab.key, 'title']} 
          rules={tab.key === 'vi' ? [{ required: true, message: 'Vui lòng nhập tên dịch vụ!' }] : []}
        >
          <Input maxLength={70} showCount placeholder="Ví dụ: Dịch vụ kho bãi tại Tà Lùng" />
        </Form.Item>

        <Form.Item 
          label={<Typography.Text strong>Đường dẫn (URL Slug)</Typography.Text>}
          required={tab.key === 'vi'}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              name={['translations', tab.key, 'slug']}
              noStyle
              rules={tab.key === 'vi' ? [{ required: true, message: 'URL không được để trống!' }] : []}
            >
              <Input placeholder="kho-bai-ta-lung" style={{ width: 'calc(100% - 120px)' }} />
            </Form.Item>
            <Tooltip title="Tạo tự động từ tên dịch vụ">
              <Button icon={<MessageOutlined />} onClick={() => generateSlugForLocale(tab.key)} style={{ width: 120 }}>
                Tạo URL
              </Button>
            </Tooltip>
          </Space.Compact>
        </Form.Item>

        <Form.Item 
          label={<Typography.Text strong>Mô tả ngắn (Meta Description)</Typography.Text>} 
          name={['translations', tab.key, 'shortDesc']}
        >
          <Input.TextArea rows={3} maxLength={160} showCount placeholder="Mô tả ngắn gọn để hiển thị trên Google..." />
        </Form.Item>

        <Form.Item label={<Typography.Text strong>Nội dung chi tiết (Trang đích)</Typography.Text>} name={['translations', tab.key, 'content']}>
          <Editor />
        </Form.Item>
      </div>
    )
  }));

  return (
    <Drawer
      title={
        <Space>
          <AppstoreOutlined style={{ color: '#003366' }} />
          <span>{isEditMode ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới'}</span>
        </Space>
      }
      width={1000}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={() => form.submit()} type="primary" loading={createMutation.isPending || updateMutation.isPending}>
            {isEditMode ? 'Cập nhật dịch vụ' : 'Lưu dịch vụ'}
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Space size="large" style={{ marginBottom: 24 }}>
            <Form.Item label="Mã Dịch vụ (Code)" name="code" rules={[{ required: true }]} initialValue="">
              <Input placeholder="VD: warehouse_01" style={{ minWidth: 200 }} />
            </Form.Item>
            <Form.Item label="Danh mục" name="category" rules={[{ required: true }]} initialValue="Kho bãi">
               <Input placeholder="VD: Kho bãi, Vận tải..." style={{ minWidth: 200 }} />
            </Form.Item>
            <Form.Item label="Dịch vụ nổi bật" name="featured" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item
            label={<Typography.Text strong>Ảnh bìa dịch vụ</Typography.Text>}
            name="coverImage"
            rules={[{ required: true, message: 'Vui lòng upload ảnh bìa!' }]}
          >
            <ImageUpload />
          </Form.Item>

          <Tabs defaultActiveKey="vi" items={tabItems} type="card" />
        </Form>
      </Spin>
    </Drawer>
  );
}