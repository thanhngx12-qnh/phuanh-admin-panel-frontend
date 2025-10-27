// src/app/(admin)/news/_components/NewsFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, DatePicker, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api, { BackendResponse } from '@/lib/axios';
import { News, Translation } from '@/types';

interface NewsFormDrawerProps {
  open: boolean;
  onClose: () => void;
  newsId?: number | null;
}

type NewsFormData = Omit<News, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'translations'> & {
  publishedAt?: dayjs.Dayjs | null;
  translations: {
    [key: string]: Partial<Translation>;
  };
};

const fetchNewsById = async (id: number): Promise<News> => {
  const response = await api.get<BackendResponse<News>>(`/admin/news/${id}`);
  return response.data.data;
};

type ApiData = Omit<NewsFormData, 'publishedAt' | 'translations'> & {
  publishedAt?: string;
  translations: Partial<Translation>[];
};

const createNews = async (data: ApiData): Promise<News> => {
  const response = await api.post<BackendResponse<News>>('/admin/news', data);
  return response.data.data;
};

const updateNews = async ({ id, data }: { id: number; data: ApiData }): Promise<News> => {
  const response = await api.patch<BackendResponse<News>>(`/admin/news/${id}`, data);
  return response.data.data;
};

export function NewsFormDrawer({ open, onClose, newsId }: NewsFormDrawerProps) {
  const [form] = Form.useForm<NewsFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  const isEditMode = !!newsId;

  const languageTabs: TabsProps['items'] = [
    { key: 'vi', label: 'Tiếng Việt (VI)' },
    { key: 'en', label: 'Tiếng Anh (EN)' },
    { key: 'zh', label: 'Tiếng Trung (ZH)' },
  ];

  const { data: editingNews, isLoading } = useQuery({
    queryKey: ['news', newsId],
    queryFn: () => fetchNewsById(newsId!),
    enabled: isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: createNews,
    onSuccess: () => {
      notification.success({ message: 'Tạo bài viết thành công!' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      onClose();
    },
    onError: (error: Error) => {
      notification.error({ message: 'Tạo bài viết thất bại', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateNews,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật bài viết thành công!' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      onClose();
    },
    onError: (error: Error) => {
      notification.error({ message: 'Cập nhật thất bại', description: error.message });
    },
  });
  
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEditMode && editingNews) {
      const translationsForForm: { [key: string]: Partial<Translation> } = {};
      editingNews.translations.forEach(t => {
        translationsForForm[t.locale] = t;
      });
      form.setFieldsValue({
        ...editingNews,
        publishedAt: editingNews.publishedAt ? dayjs(editingNews.publishedAt) : null,
        translations: translationsForForm,
      });
    } else {
      form.resetFields();
    }
  }, [editingNews, isEditMode, open]); // Thêm `open` vào dependency array để reset form khi mở lại drawer

  const handleFinish = (values: NewsFormData) => {
    const { publishedAt, translations, ...restValues } = values;

    const apiData: ApiData = {
      ...restValues,
      publishedAt: publishedAt ? publishedAt.toISOString() : undefined,
      translations: Object.entries(translations)
        .map(([locale, trans]) => ({ ...trans, locale: locale as 'vi' | 'en' | 'zh' }))
        .filter(t => t.title && t.title.trim() !== ''),
    };
    
    if (isEditMode) {
      updateMutation.mutate({ id: newsId!, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}
      width={900}
      onClose={onClose}
      open={open}
      destroyOnClose // Reset form state khi đóng
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={form.submit} type="primary" loading={isPending}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} initialValue="DRAFT">
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="DRAFT">Bản nháp</Select.Option>
              <Select.Option value="PUBLISHED">Xuất bản</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Nổi bật" name="featured" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item label="Ngày xuất bản" name="publishedAt">
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }}/>
          </Form.Item>
          <Form.Item label="Ảnh bìa">
            <Typography.Text type="secondary">Chức năng upload sẽ được thêm ở bước sau.</Typography.Text>
          </Form.Item>
          
          <Tabs defaultActiveKey="vi">
            {languageTabs.map(tab => (
              <Tabs.TabPane tab={tab.label} key={tab.key}>
                <Form.Item label="Tiêu đề" name={['translations', tab.key, 'title']} rules={tab.key === 'vi' ? [{ required: true, message: 'Tiêu đề tiếng Việt là bắt buộc!' }] : []}>
                  <Input />
                </Form.Item>
                <Form.Item label="Slug (URL)" name={['translations', tab.key, 'slug']}>
                  <Input placeholder="Để trống để tự động tạo"/>
                </Form.Item>
                <Form.Item label="Đoạn trích (Excerpt)" name={['translations', tab.key, 'excerpt']}>
                  <Input.TextArea rows={3} />
                </Form.Item>
                {/* --- SỬA LỖI Ở ĐÂY: Thêm 'name' cho Form.Item --- */}
                <Form.Item label="Nội dung chi tiết" name={['translations', tab.key, 'content']}>
                  <Input.TextArea rows={10} placeholder="Trình soạn thảo sẽ được thêm ở bước sau."/>
                </Form.Item>
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Form>
      </Spin>
    </Drawer>
  );
}