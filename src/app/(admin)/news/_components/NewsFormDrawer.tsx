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

// --- Helper functions ---
interface NewsFormDrawerProps { open: boolean; onClose: () => void; newsId?: number | null; }
type NewsFormData = Omit<News, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'translations'> & { publishedAt?: dayjs.Dayjs | null; translations: { [key: string]: Partial<Translation>; }; };
const toSlug = (str: string) => { if (!str) return ''; str = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^0-9a-z-\s])/g, '').replace(/(\s+)/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''); return str; };
const fetchNewsById = async (id: number): Promise<News> => { const response = await api.get<BackendResponse<News>>(`/admin/news/${id}`); return response.data.data; };
type ApiData = Omit<NewsFormData, 'publishedAt' | 'translations'> & { publishedAt?: string; translations: Partial<Translation>[]; };
const createNews = async (data: ApiData): Promise<News> => { const response = await api.post<BackendResponse<News>>('/admin/news', data); return response.data.data; };
const updateNews = async ({ id, data }: { id: number; data: ApiData }): Promise<News> => { const response = await api.patch<BackendResponse<News>>(`/admin/news/${id}`, data); return response.data.data; };
const fetchNewsCategories = async (): Promise<Category[]> => { const response = await api.get<BackendResponse<Category[] | {data: Category[]}>>('/admin/categories?type=NEWS'); const result = response.data.data; if (Array.isArray(result)) return result; if (result && 'data' in result && Array.isArray((result as any).data)) return (result as any).data; return []; };

export function NewsFormDrawer({ open, onClose, newsId }: NewsFormDrawerProps) {
  const [form] = Form.useForm<NewsFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const isEditMode = !!newsId;
  const [isFullWidth, setIsFullWidth] = useState(false);

  const handleAutoGenerateSlug = (locale: string) => {
    const title = form.getFieldValue(['translations', locale, 'title']);
    if (!title) { notification.warning({ message: 'Vui lòng nhập Tiêu đề trước!' }); return; }
    form.setFieldValue(['translations', locale, 'slug'], toSlug(title));
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

  const createMutation = useMutation({ mutationFn: createNews, onSuccess: () => { notification.success({ message: 'Tạo thành công!' }); queryClient.invalidateQueries({ queryKey: ['news'] }); onClose(); }, onError: (error: Error) => notification.error({ message: 'Thất bại', description: error.message }) });
  const updateMutation = useMutation({ mutationFn: updateNews, onSuccess: () => { notification.success({ message: 'Cập nhật thành công!' }); queryClient.invalidateQueries({ queryKey: ['news'] }); onClose(); }, onError: (error: Error) => notification.error({ message: 'Thất bại', description: error.message }) });
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = isLoadingNews || isLoadingCategories;

  useEffect(() => {
    if (isEditMode && editingNews) {
      const translationsForForm: { [key: string]: Partial<Translation> } = {};
      editingNews.translations.forEach(t => { translationsForForm[t.locale] = t; });
      form.setFieldsValue({
        ...editingNews,
        publishedAt: editingNews.publishedAt ? dayjs(editingNews.publishedAt) : null,
        translations: translationsForForm,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [editingNews, isEditMode, open, form]);

  const handleFinish = (values: NewsFormData) => {
    const { publishedAt, translations, ...restValues } = values;
    const apiData: ApiData = {
      ...restValues,
      publishedAt: publishedAt ? publishedAt.toISOString() : undefined,
      translations: Object.entries(translations).map(([locale, trans]) => ({ ...trans, locale: locale as string })).filter(t => t.title && t.title.trim() !== ''),
    };
    if (isEditMode) updateMutation.mutate({ id: newsId!, data: apiData });
    else createMutation.mutate(apiData);
  };

  // --- Tab Nội dung chính ---
  const contentTabItems = [
    { key: 'vi', label: 'Tiếng Việt (VI)' }, { key: 'en', label: 'Tiếng Anh (EN)' }, { key: 'zh', label: 'Tiếng Trung (ZH)' },
  ].map(tab => ({
    key: tab.key,
    label: tab.label,
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label={<Typography.Text strong>Tiêu đề bài viết</Typography.Text>} name={['translations', tab.key, 'title']} rules={tab.key === 'vi' ? [{ required: true }] : []}>
          <Input maxLength={70} showCount placeholder="Nhập tiêu đề..." />
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Đường dẫn (URL Slug)</Typography.Text>} required={tab.key === 'vi'}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name={['translations', tab.key, 'slug']} noStyle rules={tab.key === 'vi' ? [{ required: true }] : []}>
              <Input placeholder="vi-du-duong-dan" />
            </Form.Item>
            <Tooltip title="Tạo tự động từ tiêu đề">
              <Button icon={<MessageOutlined />} onClick={() => handleAutoGenerateSlug(tab.key)}>Tạo URL</Button>
            </Tooltip>
          </Space.Compact>
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Đoạn trích (Mô tả ngắn)</Typography.Text>} name={['translations', tab.key, 'excerpt']}>
          <Input.TextArea rows={3} maxLength={160} showCount placeholder="Tóm tắt ngắn gọn bài viết..." />
        </Form.Item>
        <Form.Item label={<Typography.Text strong>Nội dung chi tiết</Typography.Text>} name={['translations', tab.key, 'content']}>
          <Editor />
        </Form.Item>
      </Space>
    )
  }));
  
  // --- Tab SEO ---
  const seoTabItems = [
    { key: 'vi', label: 'SEO - VI' }, { key: 'en', label: 'SEO - EN' }, { key: 'zh', label: 'SEO - ZH' },
  ].map(tab => ({
    key: tab.key,
    label: tab.label,
    children: (
      <Space direction="vertical" size="middle" style={{ width: '100%', padding: '16px 0' }}>
        <Form.Item label="SEO Title" name={['translations', tab.key, 'metaTitle']} extra="Bỏ trống sẽ tự lấy Tiêu đề bài viết.">
          <Input maxLength={70} showCount />
        </Form.Item>
        <Form.Item label="Meta Description" name={['translations', tab.key, 'metaDescription']} extra="Bỏ trống sẽ tự lấy Mô tả ngắn.">
          <Input.TextArea rows={3} maxLength={160} showCount />
        </Form.Item>
        <Form.Item label="Meta Keywords" name={['translations', tab.key, 'metaKeywords']} extra="Các từ khóa cách nhau bằng dấu phẩy.">
          <Input placeholder="logistics, tà lùng, vận tải..." />
        </Form.Item>
        <Form.Item label="Ảnh Share (OG Image)" name={['translations', tab.key, 'ogImage']} extra="Ảnh hiển thị khi share Facebook/Zalo. Bỏ trống sẽ lấy Ảnh bìa.">
          <ImageUpload />
        </Form.Item>
      </Space>
    )
  }));

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center">
          <Space><ProfileOutlined /><span>{isEditMode ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}</span></Space>
          <Tooltip title={isFullWidth ? 'Thu nhỏ' : 'Mở toàn màn hình'}>
            <Button type="text" icon={isFullWidth ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => setIsFullWidth(!isFullWidth)} />
          </Tooltip>
        </Flex>
      }
      width={isFullWidth ? '100%' : 1000}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={<Space><Button onClick={onClose}>Hủy</Button><Button onClick={() => form.submit()} type="primary" loading={isPending}>{isEditMode ? 'Cập nhật' : 'Lưu'}</Button></Space>}
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          {/* 1. THÔNG TIN CHUNG */}
          <Card title="Thông tin cơ bản" size="small" style={{ marginBottom: 20 }}>
            <Space wrap size="large">
              <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} initialValue="DRAFT" style={{ minWidth: 150 }}>
                <Select><Select.Option value="DRAFT">Bản nháp</Select.Option><Select.Option value="PUBLISHED">Xuất bản</Select.Option></Select>
              </Form.Item>
              <Form.Item label="Danh mục" name="categoryId" style={{ minWidth: 200 }}>
                <Select 
                  placeholder="Chọn danh mục" 
                  allowClear 
                  options={categories?.map(c => ({ 
                    // SỬA TẠI ĐÂY: Tìm tên tiếng Việt trong mảng translations
                    label: c.translations?.find(t => t.locale === 'vi')?.name || 'N/A', 
                    value: c.id 
                  }))} 
                />
              </Form.Item>
              <Form.Item label="Ngày xuất bản" name="publishedAt" style={{ minWidth: 200 }}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>
              <Form.Item label="Tin nổi bật" name="featured" valuePropName="checked"><Switch /></Form.Item>
            </Space>
            <Form.Item label={<Typography.Text strong>Ảnh bìa chính</Typography.Text>} name="coverImage" rules={[{ required: true }]}>
              <ImageUpload />
            </Form.Item>
          </Card>
          
          {/* 2. SEO & SOCIAL */}
          <Collapse 
            defaultActiveKey={[]} 
            style={{ marginBottom: 20, backgroundColor: '#fff', border: '1px solid #f0f0f0' }}
          >
            <Collapse.Panel 
              key="seo" 
              header={<Space><GlobalOutlined style={{ color: '#003366' }} /><Typography.Text strong>Tối ưu SEO & Mạng xã hội (Tùy chọn)</Typography.Text></Space>}
            >
              <Tabs defaultActiveKey="vi" items={seoTabItems} type="line" />
            </Collapse.Panel>
          </Collapse>
          
          {/* 3. NỘI DUNG CHI TIẾT */}
          <Card title={<Space><ProfileOutlined />Nội dung bài viết</Space>} size="small">
            <Tabs defaultActiveKey="vi" items={contentTabItems} type="card" />
          </Card>
        </Form>
      </Spin>
    </Drawer>
  );
}