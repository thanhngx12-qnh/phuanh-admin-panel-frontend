// dir: frontend/src/app/(admin)/news/_components/NewsFormDrawer.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { App, Button, DatePicker, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs, Typography, Tooltip, Card, Flex, Collapse } from 'antd';
import { MessageOutlined, ProfileOutlined, GlobalOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api, { BackendResponse } from '@/lib/axios';
import { News, Translation, Category } from '@/types';
import { ImageUpload } from '@/components/ImageUpload';
import { Editor } from '@/components/Editor';
import { pinyin } from 'pinyin-pro';

// --- Helper functions ---
interface NewsFormDrawerProps { open: boolean; onClose: () => void; newsId?: number | null; }
type NewsFormData = Omit<News, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'translations'> & { 
  publishedAt?: dayjs.Dayjs | null; 
  translations: Record<string, Partial<Translation>>; 
};

const toSlug = (str: string, locale: string) => {
  if (!str) return '';
  let result = str;
  if (locale === 'zh') {
    result = pinyin(str, { toneType: 'none', nonPinyin: 'removed', v: true });
  }
  result = result.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^0-9a-z-\s])/g, '').replace(/(\s+)/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return result;
};

const fetchNewsById = async (id: number): Promise<News> => {
  const response = await api.get<BackendResponse<News>>(`/admin/news/${id}`);
  return response.data.data;
};

const fetchNewsCategories = async (): Promise<Category[]> => {
  const response = await api.get<BackendResponse<Category[] | {data: Category[]}>>('/admin/categories?type=NEWS');
  const result = response.data.data;
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data)) return (result as any).data;
  return [];
};

export function NewsFormDrawer({ open, onClose, newsId }: NewsFormDrawerProps) {
  const [form] = Form.useForm<NewsFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const isEditMode = !!newsId;
  const [isFullWidth, setIsFullWidth] = useState(false);

  // --- FIX LỖI CIRCULAR REFERENCE TẠI ĐÂY ---
  const handleAutoGenerateSlug = (locale: string) => {
    const translations = form.getFieldValue('translations') || {};
    const title = translations[locale]?.title;
    
    if (!title) {
      notification.warning({ message: 'Vui lòng nhập Tiêu đề trước!' });
      return;
    }

    const slug = toSlug(title, locale);
    
    // Thay vì setFieldValue từng phần, ta cập nhật lại cả object translations
    form.setFieldsValue({
      translations: {
        ...translations,
        [locale]: {
          ...translations[locale],
          slug: slug
        }
      }
    });
    
    notification.info({ message: `Đã tạo URL bản nháp (${locale.toUpperCase()})` });
  };

  const { data: editingNews, isLoading: isLoadingNews } = useQuery({ 
    queryKey: ['news', newsId], 
    queryFn: () => fetchNewsById(newsId!), 
    enabled: isEditMode && open 
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({ 
    queryKey: ['categories', 'list', { type: 'NEWS' }],
    queryFn: fetchNewsCategories,
    enabled: open 
  });

  const isDataLoading = isLoadingNews || isLoadingCategories;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/news', data),
    onSuccess: () => {
      notification.success({ message: 'Tạo thành công!' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      onClose();
    },
    onError: (error: Error) => notification.error({ message: 'Thất bại', description: error.message })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/admin/news/${id}`, data),
    onSuccess: () => {
      notification.success({ message: 'Cập nhật thành công!' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      onClose();
    },
    onError: (error: Error) => notification.error({ message: 'Thất bại', description: error.message })
  });

  useEffect(() => {
    if (isEditMode && editingNews) {
      const translationsForForm: Record<string, Partial<Translation>> = {};
      editingNews.translations.forEach(t => { translationsForForm[t.locale] = t; });
      form.setFieldsValue({
        status: editingNews.status,
        featured: editingNews.featured,
        coverImage: editingNews.coverImage,
        categoryId: editingNews.categoryId,
        publishedAt: editingNews.publishedAt ? dayjs(editingNews.publishedAt) : null,
        translations: translationsForForm,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [editingNews, isEditMode, open, form]);

  const handleFinish = (values: NewsFormData) => {
    const { publishedAt, translations, ...restValues } = values;
    const apiData = {
      ...restValues,
      publishedAt: publishedAt ? publishedAt.toISOString() : undefined,
      translations: Object.entries(translations || {})
        .map(([locale, trans]) => ({ ...trans, locale }))
        .filter(t => t.title && t.title.trim() !== ''),
    };
    if (isEditMode) updateMutation.mutate({ id: newsId!, data: apiData });
    else createMutation.mutate(apiData);
  };

  const contentTabItems = ['vi', 'en', 'zh'].map(lang => ({
    key: lang,
    label: lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'Tiếng Anh' : 'Tiếng Trung',
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label={<Typography.Text strong>Tiêu đề bài viết</Typography.Text>} name={['translations', lang, 'title']} rules={lang === 'vi' ? [{ required: true }] : []}>
          <Input maxLength={70} showCount placeholder="Nhập tiêu đề..." />
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Đường dẫn (URL Slug)</Typography.Text>} required={lang === 'vi'}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name={['translations', lang, 'slug']} noStyle rules={lang === 'vi' ? [{ required: true }] : []}>
              <Input placeholder="duong-dan-bai-viet" />
            </Form.Item>
            <Tooltip title={lang === 'zh' ? "Tạo Pinyin tự động" : "Tạo tự động từ tiêu đề"}>
              <Button icon={<MessageOutlined />} onClick={() => handleAutoGenerateSlug(lang)}>Tạo URL</Button>
            </Tooltip>
          </Space.Compact>
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Đoạn trích (Mô tả ngắn)</Typography.Text>} name={['translations', lang, 'excerpt']}><Input.TextArea rows={3} maxLength={160} showCount /></Form.Item>
        <Form.Item label={<Typography.Text strong>Nội dung chi tiết</Typography.Text>} name={['translations', lang, 'content']}><Editor /></Form.Item>
      </Space>
    )
  }));
  
  const seoTabItems = ['vi', 'en', 'zh'].map(lang => ({
    key: lang,
    label: `SEO - ${lang.toUpperCase()}`,
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label="SEO Title" name={['translations', lang, 'metaTitle']}><Input maxLength={70} showCount /></Form.Item>
        <Form.Item label="Meta Description" name={['translations', lang, 'metaDescription']}><Input.TextArea rows={3} maxLength={160} showCount /></Form.Item>
        <Form.Item label="Meta Keywords" name={['translations', lang, 'metaKeywords']}><Input placeholder="tag1, tag2..." /></Form.Item>
        <Form.Item label="Ảnh Share (OG Image)" name={['translations', lang, 'ogImage']}><ImageUpload /></Form.Item>
      </Space>
    )
  }));

  return (
    <Drawer
      title={<Flex justify="space-between" align="center"><Space><ProfileOutlined /><span>{isEditMode ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}</span></Space><Tooltip title={isFullWidth ? 'Thu nhỏ' : 'Mở toàn màn hình'}><Button type="text" icon={isFullWidth ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => setIsFullWidth(!isFullWidth)} /></Tooltip></Flex>}
      width={isFullWidth ? '100%' : 1000}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={<Space><Button onClick={onClose}>Hủy</Button><Button onClick={() => form.submit()} type="primary" loading={isEditMode ? updateMutation.isPending : createMutation.isPending}>Lưu</Button></Space>}
    >
      <Spin spinning={isDataLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Card title="Thông tin cơ bản" size="small" style={{ marginBottom: 20 }}>
            <Space wrap size="large">
              <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} initialValue="DRAFT" style={{ minWidth: 150 }}><Select><Select.Option value="DRAFT">Bản nháp</Select.Option><Select.Option value="PUBLISHED">Xuất bản</Select.Option></Select></Form.Item>
              <Form.Item label="Danh mục" name="categoryId" style={{ minWidth: 200 }}>
                <Select placeholder="Chọn danh mục" allowClear options={categories?.map(c => ({ label: c.translations?.find(t => t.locale === 'vi')?.name || 'N/A', value: c.id }))} />
              </Form.Item>
              <Form.Item label="Ngày xuất bản" name="publishedAt" style={{ minWidth: 200 }}><DatePicker showTime format="DD/MM/YYYY HH:mm" /></Form.Item>
              <Form.Item label="Tin nổi bật" name="featured" valuePropName="checked"><Switch /></Form.Item>
            </Space>
            <Form.Item label={<Typography.Text strong>Ảnh bìa chính</Typography.Text>} name="coverImage" rules={[{ required: true }]}><ImageUpload /></Form.Item>
          </Card>
          <Collapse ghost items={[{ key: 'seo', label: <Space><GlobalOutlined style={{ color: '#003366' }} /><Typography.Text strong>Tối ưu SEO & Mạng xã hội (Tùy chọn)</Typography.Text></Space>, children: <Tabs defaultActiveKey="vi" items={seoTabItems} type="line" /> }]} style={{ marginBottom: 20, backgroundColor: '#fff', border: '1px solid #f0f0f0' }} />
          <Card title={<Space><ProfileOutlined />Nội dung bài viết</Space>} size="small"><Tabs defaultActiveKey="vi" items={contentTabItems} type="card" /></Card>
        </Form>
      </Spin>
    </Drawer>
  );
}