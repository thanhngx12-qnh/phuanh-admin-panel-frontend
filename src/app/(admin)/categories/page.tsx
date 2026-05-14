// dir: admin-panel-frontend/src/app/(admin)/categories/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Table, Tag, Drawer, Form, Select, Input, Space, Popconfirm, Flex, Typography, Tabs } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, FolderOpenOutlined, GlobalOutlined } from '@ant-design/icons';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { Category, CategoryType } from '@/types';
import { pinyin } from 'pinyin-pro'; // Import thư viện pinyin

// --- Hàm hỗ trợ tạo Slug tự động Đa ngôn ngữ ---
const slugify = (str: string, locale: string) => {
  if (!str) return '';
  let result = str;

  // Xử lý riêng tiếng Trung
  if (locale === 'zh') {
    result = pinyin(str, { toneType: 'none', nonPinyin: 'removed', v: true });
  }

  return result
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

interface CategoriesQuery {
  q?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  type?: string;
}

const fetchCategories = async (query: CategoriesQuery): Promise<Category[]> => {
  try {
    const params: any = {
      q: query.q || undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      type: query.type
    };
    
    const response = await api.get<BackendResponse<{ data: Category[] }>>('/admin/categories', { params });
    const result = response.data.data;
    
    // Xử lý các định dạng API trả về
    if (Array.isArray(result)) return result;
    if (result && 'data' in result && Array.isArray((result as any).data)) return (result as any).data;
    return [];
  } catch (error) {
    return [];
  }
};

export default function CategoriesPage() {
  const [queryParams, setQueryParams] = useState<CategoriesQuery>({ q: '' });
  const [debouncedSearch] = useDebounce(queryParams.q, 500);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data: categories, isFetching, isLoading } = useQuery({
    queryKey: ['categories', 'list', { ...queryParams, q: debouncedSearch }],
    queryFn: () => fetchCategories({ ...queryParams, q: debouncedSearch }),
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      // Dọn dẹp object translations về mảng
      const translationsArray = Object.entries(values.translations)
        .map(([locale, data]: [string, any]) => ({ ...data, locale }))
        .filter(t => t.name && t.name.trim() !== '');

      const payload = {
        type: values.type,
        translations: translationsArray
      };

      if (editingCategory) return api.patch(`/admin/categories/${editingCategory.id}`, payload);
      return api.post('/admin/categories', payload);
    },
    onSuccess: () => {
      notification.success({ message: editingCategory ? 'Cập nhật thành công' : 'Thêm mới thành công' });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      closeDrawer();
    },
    onError: (error: any) => notification.error({ message: 'Lỗi', description: error.message })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      notification.success({ message: 'Đã xóa danh mục' });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<Category> | SorterResult<Category>[]) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams(prev => ({
      ...prev,
      type: filters.type ? (filters.type[0] as string) : undefined,
      sortBy: s.field?.toString(),
      sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined,
    }));
  };

  const openDrawer = (record?: Category) => {
    if (record) {
      setEditingCategory(record);
      // Chuyển mảng array về object để Form dễ map dữ liệu vào từng Tab
      const transObj: Record<string, any> = {};
      record.translations?.forEach(t => { transObj[t.locale] = t; });

      form.setFieldsValue({
        type: record.type,
        translations: transObj
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  };

  const handleAutoGenerateSlug = (locale: string) => {
    const name = form.getFieldValue(['translations', locale, 'name']);
    if (!name) return;
    form.setFieldValue(['translations', locale, 'slug'], slugify(name, locale));
  };

  const columns: TableProps<Category>['columns'] = [
    { 
      title: 'Tên danh mục (VI)', 
      key: 'name', 
      render: (_, record) => {
        const vi = record.translations?.find(t => t.locale === 'vi');
        return <Typography.Text strong>{vi?.name || 'Chưa dịch'}</Typography.Text>;
      }
    },
    { 
      title: 'Slug (VI)', 
      key: 'slug',
      render: (_, record) => record.translations?.find(t => t.locale === 'vi')?.slug || '-'
    },
    { 
      title: 'Ngôn ngữ', 
      key: 'locales',
      render: (_, record) => (
        <Space size={4}>
          {record.translations?.map(t => (
            <Tag key={t.locale} color="default">{t.locale.toUpperCase()}</Tag>
          ))}
        </Space>
      )
    },
    { 
      title: 'Phân loại', 
      dataIndex: 'type', 
      key: 'type',
      filters: [{ text: 'Tin tức', value: 'NEWS' }, { text: 'Dịch vụ', value: 'SERVICE' }],
      filterMultiple: false,
      render: (type: CategoryType) => (
        <Tag color={type === 'NEWS' ? 'blue' : 'green'}>{type === 'NEWS' ? 'TIN TỨC' : 'DỊCH VỤ'}</Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => openDrawer(record)}>Sửa</Button>
          <Popconfirm title="Xóa danh mục" onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button type="link" danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'vi', label: 'Tiếng Việt' },
    { key: 'en', label: 'English' },
    { key: 'zh', label: 'Chinese' },
  ].map(lang => ({
    key: lang.key,
    label: lang.label,
    children: (
      <div style={{ padding: '16px 0' }}>
        <Form.Item label={`Tên danh mục`} name={['translations', lang.key, 'name']} rules={lang.key === 'vi' ? [{ required: true, message: 'Bắt buộc nhập!' }] : []}>
          <Input placeholder="VD: Vận tải quốc tế" onChange={() => handleAutoGenerateSlug(lang.key)} />
        </Form.Item>
        <Form.Item label={`Đường dẫn (Slug)`} name={['translations', lang.key, 'slug']} rules={lang.key === 'vi' ? [{ required: true }] : []}>
          <Input placeholder="van-tai-quoc-te" />
        </Form.Item>
        <Form.Item label={`Mô tả ngắn`} name={['translations', lang.key, 'description']}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </div>
    )
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb items={[{ href: '/admin', title: <HomeOutlined /> }, { title: 'Quản lý danh mục' }]} />
      
      <Card 
        title={<Space><FolderOpenOutlined style={{ color: '#003366' }} />Phân loại nội dung đa ngôn ngữ</Space>} 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()} style={{ background: '#003366' }}>Thêm danh mục</Button>}
      >
        <Flex justify="flex-end" style={{ marginBottom: 20 }}>
          <Input.Search 
            placeholder="Tìm kiếm..." 
            allowClear
            enterButton
            style={{ width: 350 }} 
            value={queryParams.q}
            onChange={(e) => setQueryParams(prev => ({ ...prev, q: e.target.value }))}
            loading={isFetching}
          />
        </Flex>

        <Table 
          columns={columns} 
          dataSource={categories || []} 
          rowKey="id" 
          loading={isLoading} 
          bordered 
          onChange={handleTableChange}
          size="middle"
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} danh mục` }}
        />
      </Card>

      <Drawer
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={isDrawerOpen}
        onClose={closeDrawer}
        width={500}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeDrawer}>Hủy</Button>
            <Button type="primary" onClick={() => form.submit()} loading={mutation.isPending} style={{ background: '#003366' }}>
              Xác nhận lưu
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item 
            label={<Typography.Text strong>Loại áp dụng</Typography.Text>} 
            name="type" 
            rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
            initialValue="NEWS"
          >
            <Select>
              <Select.Option value="SERVICE">Dành cho Dịch vụ</Select.Option>
              <Select.Option value="NEWS">Dành cho Tin tức</Select.Option>
            </Select>
          </Form.Item>

          <Card title={<Space><GlobalOutlined />Nội dung đa ngôn ngữ</Space>} size="small" style={{ marginTop: 20 }}>
            <Tabs defaultActiveKey="vi" items={tabItems} type="card" />
          </Card>
        </Form>
      </Drawer>
    </Space>
  );
}