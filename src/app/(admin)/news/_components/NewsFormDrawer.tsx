// dir: frontend/src/app/(admin)/news/_components/NewsFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, DatePicker, Drawer, Form, Input, Select, Space, Spin, Switch, Tabs, Typography, Tooltip } from 'antd';
import { MessageOutlined, ProfileOutlined } from '@ant-design/icons'; // Icon từ thư viện chuẩn AntD
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api, { BackendResponse } from '@/lib/axios';
import { News, Translation } from '@/types';
import { ImageUpload } from '@/components/ImageUpload';
import { Editor } from '@/components/Editor';

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

// --- HÀM CHUYỂN TIÊU ĐỀ THÀNH SLUG CHUẨN SEO ---
const toSlug = (str: string) => {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Bỏ dấu
  str = str.replace(/[đĐ]/g, 'd');
  str = str.replace(/([^0-9a-z-\s])/g, ''); // Bỏ ký tự đặc biệt
  str = str.replace(/(\s+)/g, '-'); // Thay khoảng trắng bằng gạch ngang
  str = str.replace(/-+/g, '-'); // Bỏ gạch ngang thừa
  str = str.replace(/^-+|-+$/g, ''); // Bỏ gạch ngang ở đầu/cuối
  return str;
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

  // --- HÀM XỬ LÝ TẠO SLUG TỰ ĐỘNG ---
  const handleAutoGenerateSlug = (locale: string) => {
    const title = form.getFieldValue(['translations', locale, 'title']);
    if (!title) {
      notification.warning({ message: 'Vui lòng nhập Tiêu đề trước khi tạo URL!' });
      return;
    }
    const slug = toSlug(title);
    form.setFieldValue(['translations', locale, 'slug'], slug);
    notification.info({ message: 'Đã tạo URL chuẩn SEO' });
  };

  const { data: editingNews, isLoading } = useQuery({
    queryKey: ['news', newsId],
    queryFn: () => fetchNewsById(newsId!),
    enabled: isEditMode && open,
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
    } else if (open) {
      form.resetFields();
    }
  }, [editingNews, isEditMode, open, form]);

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

  // --- CẤU HÌNH TABS (ITEMS) THEO CHUẨN MỚI ---
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
          label={<Typography.Text strong>Tiêu đề bài viết</Typography.Text>} 
          name={['translations', tab.key, 'title']} 
          rules={tab.key === 'vi' ? [{ required: true, message: 'Tiêu đề là bắt buộc!' }] : []}
        >
          <Input maxLength={70} showCount placeholder="Nhập tiêu đề (Tối ưu 50-60 ký tự)" />
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
              <Input placeholder="Ví dụ: tin-tuc-logistics-ta-lung" style={{ width: 'calc(100% - 120px)' }} />
            </Form.Item>
            <Tooltip title="Tạo URL tự động từ tiêu đề">
              <Button 
                icon={<MessageOutlined />} 
                onClick={() => handleAutoGenerateSlug(tab.key)}
                style={{ width: 120 }}
              >
                Tạo URL
              </Button>
            </Tooltip>
          </Space.Compact>
        </Form.Item>

        <Form.Item 
          label={<Typography.Text strong>Mô tả ngắn (Meta Description)</Typography.Text>} 
          name={['translations', tab.key, 'excerpt']}
        >
          <Input.TextArea rows={3} maxLength={160} showCount placeholder="Tóm tắt nội dung bài viết cho Google (150-160 ký tự)" />
        </Form.Item>

        <Form.Item label={<Typography.Text strong>Nội dung chi tiết</Typography.Text>} name={['translations', tab.key, 'content']}>
          <Editor />
        </Form.Item>
      </div>
    )
  }));

  return (
    <Drawer
      title={
        <Space>
          <ProfileOutlined style={{ color: '#003366' }} />
          <span>{isEditMode ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}</span>
        </Space>
      }
      width={1000} // Tăng nhẹ chiều rộng để viết bài thoải mái hơn
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={() => form.submit()} type="primary" loading={isPending}>
            {isEditMode ? 'Cập nhật' : 'Lưu bài viết'}
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Space size="large" style={{ marginBottom: 20 }}>
            <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} initialValue="DRAFT" style={{ minWidth: 150 }}>
              <Select>
                <Select.Option value="DRAFT">Bản nháp</Select.Option>
                <Select.Option value="PUBLISHED">Xuất bản</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Ngày xuất bản" name="publishedAt" style={{ minWidth: 200 }}>
              <DatePicker showTime format="DD/MM/YYYY HH:mm" />
            </Form.Item>
            <Form.Item label="Tin nổi bật" name="featured" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item
            label={<Typography.Text strong>Ảnh bìa</Typography.Text>}
            name="coverImage"
            rules={[{ required: true, message: 'Vui lòng upload ảnh bìa!' }]}
            validateTrigger="onBlur" 
          >
            <ImageUpload />
          </Form.Item>

          <Tabs defaultActiveKey="vi" items={tabItems} type="card" />
        </Form>
      </Spin>
    </Drawer>
  );
}