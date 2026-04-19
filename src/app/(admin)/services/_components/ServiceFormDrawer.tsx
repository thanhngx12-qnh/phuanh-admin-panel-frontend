// dir: frontend/src/app/(admin)/services/_components/ServiceFormDrawer.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs, Typography, Tooltip, Card, Flex, Collapse } from 'antd';
import { MessageOutlined, AppstoreOutlined, GlobalOutlined, FullscreenOutlined, FullscreenExitOutlined, DownOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BackendResponse } from '@/lib/axios';
import { Service, Translation, Category } from '@/types';
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

const toSlug = (str: string) => {
  if (!str) return '';
  str = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^0-9a-z-\s])/g, '').replace(/(\s+)/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return str;
};

const fetchServiceById = async (id: number): Promise<Service> => {
  const response = await api.get<BackendResponse<Service>>(`/admin/services/${id}`);
  return response.data.data;
};

// --- HÀM LẤY DANH MỤC DỊCH VỤ (Đã fix lỗi map) ---
const fetchServiceCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<BackendResponse<Category[] | {data: Category[]}>>('/admin/categories?type=SERVICE');
    const result = response.data.data;
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) {
      return (result as any).data;
    }
    return [];
  } catch (error) {
    console.error("Fetch categories failed:", error);
    return [];
  }
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
  const [isFullWidth, setIsFullWidth] = useState(false);

  const handleAutoGenerateSlug = (locale: string) => {
    const title = form.getFieldValue(['translations', locale, 'title']);
    if (!title) {
      notification.warning({ message: 'Vui lòng nhập Tên dịch vụ trước!' });
      return;
    }
    form.setFieldValue(['translations', locale, 'slug'], toSlug(title));
    notification.info({ message: 'Đã tạo URL chuẩn SEO' });
  };

  const { data: editingService, isLoading: isLoadingService } = useQuery({
    queryKey: ['services', serviceId],
    queryFn: () => fetchServiceById(serviceId!),
    enabled: isEditMode && open,
  });

  // --- ĐỒNG BỘ QUERY KEY VỚI TRANG DANH MỤC ---
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', 'list', { type: 'SERVICE' }],
    queryFn: fetchServiceCategories,
    enabled: open,
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
      editingService.translations.forEach(t => { translationsForForm[t.locale] = t; });
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
    if (isEditMode) updateMutation.mutate({ id: serviceId!, data: apiData });
    else createMutation.mutate(apiData);
  };

  const contentTabItems = [
    { key: 'vi', label: 'Tiếng Việt (VI)' }, { key: 'en', label: 'Tiếng Anh (EN)' }, { key: 'zh', label: 'Tiếng Trung (ZH)' },
  ].map(tab => ({
    key: tab.key,
    label: tab.label,
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label={<Typography.Text strong>Tên dịch vụ</Typography.Text>} name={['translations', tab.key, 'title']} rules={tab.key === 'vi' ? [{ required: true }] : []}>
          <Input maxLength={70} showCount placeholder="VD: Dịch vụ kho bãi tại Tà Lùng" />
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Đường dẫn (URL Slug)</Typography.Text>} required={tab.key === 'vi'}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name={['translations', tab.key, 'slug']} noStyle rules={tab.key === 'vi' ? [{ required: true }] : []}>
              <Input placeholder="kho-bai-ta-lung" />
            </Form.Item>
            <Tooltip title="Tạo tự động từ tên dịch vụ"><Button icon={<MessageOutlined />} onClick={() => handleAutoGenerateSlug(tab.key)}>Tạo URL</Button></Tooltip>
          </Space.Compact>
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Mô tả ngắn (Hiển thị ở trang danh sách)</Typography.Text>} name={['translations', tab.key, 'shortDesc']}>
          <Input.TextArea rows={3} maxLength={160} showCount />
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Nội dung chi tiết (Landing Page)</Typography.Text>} name={['translations', tab.key, 'content']}>
          <Editor />
        </Form.Item>
      </Space>
    )
  }));

  const seoTabItems = [
    { key: 'vi', label: 'SEO - VI' }, { key: 'en', label: 'SEO - EN' }, { key: 'zh', label: 'SEO - ZH' },
  ].map(tab => ({
    key: tab.key,
    label: tab.label,
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label="SEO Title" name={['translations', tab.key, 'metaTitle']} extra="Bỏ trống sẽ tự lấy Tên dịch vụ. Tối ưu: 60-70 ký tự.">
          <Input maxLength={70} showCount />
        </Form.Item>
        <Form.Item label="Meta Description" name={['translations', tab.key, 'metaDescription']} extra="Bỏ trống sẽ tự lấy Mô tả ngắn. Tối ưu: 150-160 ký tự.">
          <Input.TextArea rows={3} maxLength={160} showCount />
        </Form.Item>
        <Form.Item label="Meta Keywords" name={['translations', tab.key, 'metaKeywords']}>
          <Input placeholder="kho bai, van tai, ta lung..." />
        </Form.Item>
        <Form.Item label="Ảnh Share (OG Image)" name={['translations', tab.key, 'ogImage']} extra="Ảnh riêng khi share MXH. Bỏ trống sẽ lấy Ảnh bìa.">
          <ImageUpload />
        </Form.Item>
      </Space>
    )
  }));

  const collapseItems = [
    {
      key: 'seo',
      label: <Space><GlobalOutlined style={{ color: '#003366' }} /><Typography.Text strong>Tối ưu SEO & Mạng xã hội (Tùy chọn)</Typography.Text></Space>,
      children: <Tabs defaultActiveKey="vi" items={seoTabItems} type="line" />,
    },
  ];

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center">
          <Space><AppstoreOutlined style={{ color: '#003366' }} /><span>{isEditMode ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới'}</span></Space>
          <Tooltip title={isFullWidth ? 'Thu nhỏ' : 'Mở toàn màn hình'}>
            <Button type="text" icon={isFullWidth ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => setIsFullWidth(!isFullWidth)} />
          </Tooltip>
        </Flex>
      }
      width={isFullWidth ? '100%' : 1000}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={<Space><Button onClick={onClose}>Hủy</Button><Button onClick={() => form.submit()} type="primary" loading={createMutation.isPending || updateMutation.isPending} style={{ background: '#003366' }}>{isEditMode ? 'Cập nhật' : 'Lưu dịch vụ'}</Button></Space>}
    >
      <Spin spinning={isLoadingService || isLoadingCategories}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          {/* THÔNG TIN CƠ BẢN */}
          <Card title="Thông tin cơ bản" size="small" style={{ marginBottom: 20 }}>
            <Space wrap size="large">
              <Form.Item label="Mã Dịch vụ (Code)" name="code" rules={[{ required: true }]}><Input placeholder="VD: warehouse_01" /></Form.Item>
              <Form.Item label="Danh mục" name="categoryId" style={{ minWidth: 200 }}>
                <Select placeholder="Chọn danh mục" allowClear options={categories?.map(c => ({ label: c.name, value: c.id }))} />
              </Form.Item>a
              <Form.Item label="Dịch vụ nổi bật" name="featured" valuePropName="checked"><Switch /></Form.Item>
            </Space>
            <Form.Item label={<Typography.Text strong>Ảnh bìa chính</Typography.Text>} name="coverImage" rules={[{ required: true }]}>
              <ImageUpload />
            </Form.Item>
          </Card>
          
          <Collapse ghost items={collapseItems} style={{ marginBottom: 20, backgroundColor: '#fff', border: '1px solid #f0f0f0' }} />
          
          <Card title={<Space><AppstoreOutlined />Nội dung chi tiết</Space>} size="small">
            <Tabs defaultActiveKey="vi" items={contentTabItems} type="card" />
          </Card>
        </Form>
      </Spin>
    </Drawer>
  );
}