// dir: frontend/src/app/(admin)/services/_components/ServiceFormDrawer.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs, Typography, Tooltip, Card, Flex, Collapse } from 'antd';
import { MessageOutlined, AppstoreOutlined, GlobalOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BackendResponse } from '@/lib/axios';
import { Service, Translation, Category } from '@/types';
import { ImageUpload } from '@/components/ImageUpload';
import { Editor } from '@/components/Editor';
import { pinyin } from 'pinyin-pro'; // Đảm bảo đã chạy npm install pinyin-pro

interface ServiceFormDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceId?: number | null;
}

type ServiceFormData = Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'translations'> & {
  translations: Record<string, Partial<Translation>>;
};

// --- HÀM TẠO SLUG THÔNG MINH ---
const toSlug = (str: string, locale: string) => {
  if (!str) return '';
  let result = str;
  if (locale === 'zh') {
    result = pinyin(str, { toneType: 'none', nonPinyin: 'removed', v: true });
  }
  result = result.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  result = result.replace(/[đĐ]/g, 'd');
  result = result.replace(/([^0-9a-z-\s])/g, '');
  result = result.replace(/(\s+)/g, '-');
  result = result.replace(/-+/g, '-');
  result = result.replace(/^-+|-+$/g, '');
  return result;
};

const fetchServiceById = async (id: number): Promise<Service> => {
  const response = await api.get<BackendResponse<Service>>(`/admin/services/${id}`);
  return response.data.data;
};

const fetchServiceCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<BackendResponse<Category[] | {data: Category[]}>>('/admin/categories?type=SERVICE');
    const result = response.data.data;
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) {
      return (result as any).data;
    }
    return [];
  } catch (error) { return []; }
};

export function ServiceFormDrawer({ open, onClose, serviceId }: ServiceFormDrawerProps) {
  const [form] = Form.useForm<ServiceFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const isEditMode = !!serviceId;
  const [isFullWidth, setIsFullWidth] = useState(false);

  // --- TỰ ĐỘNG TẠO SLUG (KHÔNG GÂY LỖI CIRCULAR) ---
  const handleAutoGenerateSlug = (locale: string) => {
    const translations = form.getFieldValue('translations') || {};
    const title = translations[locale]?.title;
    if (!title) {
      notification.warning({ message: 'Vui lòng nhập Tên dịch vụ trước!' });
      return;
    }
    const slug = toSlug(title, locale);
    form.setFieldsValue({
      translations: {
        ...translations,
        [locale]: { ...translations[locale], slug: slug }
      }
    });
    notification.info({ message: `Đã tạo URL bản nháp (${locale.toUpperCase()})` });
  };

  const { data: editingService, isLoading: isLoadingService } = useQuery({
    queryKey: ['services', serviceId],
    queryFn: () => fetchServiceById(serviceId!),
    enabled: isEditMode && open,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', 'list', { type: 'SERVICE' }],
    queryFn: fetchServiceCategories,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/services', data),
    onSuccess: () => {
      notification.success({ message: 'Thêm dịch vụ thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (error: any) => notification.error({ message: 'Lỗi', description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/admin/services/${id}`, data),
    onSuccess: () => {
      notification.success({ message: 'Cập nhật thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    },
    onError: (error: any) => notification.error({ message: 'Lỗi', description: error.message }),
  });

  useEffect(() => {
    if (isEditMode && editingService) {
      const translationsForForm: Record<string, Partial<Translation>> = {};
      editingService.translations.forEach(t => { translationsForForm[t.locale] = t; });
      form.setFieldsValue({
        code: editingService.code,
        featured: editingService.featured,
        coverImage: editingService.coverImage,
        categoryId: editingService.categoryId, 
        translations: translationsForForm,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [editingService, isEditMode, open, form]);

  const handleFinish = (values: any) => {
    const { translations, ...restValues } = values;
    const apiData = {
      ...restValues,
      categoryId: restValues.categoryId ? Number(restValues.categoryId) : null,
      translations: Object.entries(translations || {})
        .map(([locale, trans]: [string, any]) => ({ ...trans, locale }))
        .filter(t => t.title && t.title.trim() !== ''),
    };
    if (isEditMode) updateMutation.mutate({ id: serviceId!, data: apiData });
    else createMutation.mutate(apiData);
  };

  // --- UI COMPONENTS ---
  const contentTabItems = ['vi', 'en', 'zh'].map(lang => ({
    key: lang,
    label: lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'Tiếng Anh' : 'Tiếng Trung',
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label="Tên dịch vụ" name={['translations', lang, 'title']} rules={lang === 'vi' ? [{ required: true }] : []}>
          <Input maxLength={70} showCount />
        </Form.Item>
        <Form.Item label="Đường dẫn (Slug)" required={lang === 'vi'}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name={['translations', lang, 'slug']} noStyle rules={lang === 'vi' ? [{ required: true }] : []}>
              <Input placeholder="kho-bai-ta-lung" />
            </Form.Item>
            <Tooltip title={lang === 'zh' ? "Tạo Pinyin tự động" : "Tạo tự động"}>
              <Button icon={<MessageOutlined />} onClick={() => handleAutoGenerateSlug(lang)}>Tạo URL</Button>
            </Tooltip>
          </Space.Compact>
        </Form.Item>
        <Form.Item label="Mô tả ngắn" name={['translations', lang, 'shortDesc']}><Input.TextArea rows={3} maxLength={160} showCount /></Form.Item>
        <Form.Item label="Nội dung chi tiết" name={['translations', lang, 'content']}><Editor /></Form.Item>
      </Space>
    )
  }));

  const seoTabItems = ['vi', 'en', 'zh'].map(lang => ({
    key: lang,
    label: `SEO - ${lang.toUpperCase()}`,
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label="SEO Title" name={['translations', lang, 'metaTitle']} extra="Bỏ trống sẽ tự lấy Tên dịch vụ."><Input maxLength={70} showCount /></Form.Item>
        <Form.Item label="Meta Description" name={['translations', lang, 'metaDescription']} extra="Bỏ trống sẽ tự lấy Mô tả ngắn."><Input.TextArea rows={3} maxLength={160} showCount /></Form.Item>
        <Form.Item label="Meta Keywords" name={['translations', lang, 'metaKeywords']}><Input placeholder="tag1, tag2..." /></Form.Item>
        <Form.Item label="Ảnh Share (OG Image)" name={['translations', lang, 'ogImage']} extra="Ảnh riêng khi share MXH. Bỏ trống sẽ lấy Ảnh bìa."><ImageUpload /></Form.Item>
      </Space>
    )
  }));

  return (
    <Drawer
      title={<Flex justify="space-between" align="center"><Space><AppstoreOutlined /><span>{isEditMode ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới'}</span></Space><Button type="text" icon={isFullWidth ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => setIsFullWidth(!isFullWidth)} /></Flex>}
      width={isFullWidth ? '100%' : 1000}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={<Space><Button onClick={onClose}>Hủy</Button><Button onClick={() => form.submit()} type="primary" loading={isEditMode ? updateMutation.isPending : createMutation.isPending} style={{ background: '#003366' }}>Lưu dịch vụ</Button></Space>}
    >
      <Spin spinning={isLoadingService || isLoadingCategories}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Card title="Thông tin cơ bản" size="small" style={{ marginBottom: 20 }}>
            <Space wrap size="large">
              <Form.Item label="Mã Dịch vụ" name="code" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item label="Danh mục" name="categoryId" style={{ minWidth: 200 }}>
                <Select 
                  placeholder="Chọn danh mục" 
                  allowClear 
                  options={categories?.map(c => ({ 
                    label: c.translations?.find(t => t.locale === 'vi')?.name || c.translations?.[0]?.name || 'N/A', 
                    value: c.id 
                  }))} 
                />
              </Form.Item>
              <Form.Item label="Dịch vụ nổi bật" name="featured" valuePropName="checked"><Switch /></Form.Item>
            </Space>
            <Form.Item label="Ảnh bìa chính" name="coverImage" rules={[{ required: true }]}><ImageUpload /></Form.Item>
          </Card>
          
          <Collapse ghost items={[{ key: 'seo', label: <Typography.Text strong><GlobalOutlined style={{ color: '#003366' }} /> Tối ưu SEO & Mạng xã hội (Tùy chọn)</Typography.Text>, children: <Tabs items={seoTabItems} type="line" /> }]} style={{ marginBottom: 20, backgroundColor: '#fff', border: '1px solid #f0f0f0' }} />
          
          <Card title="Nội dung dịch vụ" size="small"><Tabs items={contentTabItems} type="card" /></Card>
        </Form>
      </Spin>
    </Drawer>
  );
}