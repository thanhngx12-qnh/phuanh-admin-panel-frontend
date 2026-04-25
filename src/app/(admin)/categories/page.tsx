// --- File: admin-panel-frontend/src/app/%28admin%29/categories/page.tsx ---
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

// --- Hàm hỗ trợ tạo Slug tự động ---
const slugify = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD") // Chuyển về dạng tổ hợp để loại bỏ dấu
    .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu sau khi normalize
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "") // Xóa ký tự đặc biệt
    .replace(/(\s+)/g, "-") // Thay khoảng trắng bằng -
    .replace(/-+/g, "-") // Loại bỏ nhiều dấu - liên tiếp
    .replace(/^-+|-+$/g, ""); // Cắt - ở đầu và cuối
};

// --- Interface cho Query ---
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
    return response.data.data.data || [];
  } catch (error) {
    console.error("Fetch categories failed:", error);
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

  // --- QUERY DỮ LIỆU ---
  const { data: categories, isFetching, isLoading } = useQuery({
    queryKey: ['categories', 'list', { ...queryParams, q: debouncedSearch }],
    queryFn: () => fetchCategories({ ...queryParams, q: debouncedSearch }),
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingCategory) return api.patch(`/admin/categories/${editingCategory.id}`, values);
      return api.post('/admin/categories', values);
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

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Category> | SorterResult<Category>[]
  ) => {
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
      form.setFieldsValue({
        type: record.type,
        parentId: record.parentId,
        translations: record.translations
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
      form.setFieldsValue({
        translations: [
          { locale: 'vi', name: '', slug: '' },
          { locale: 'en', name: '', slug: '' },
          { locale: 'zh', name: '', slug: '' }
        ]
      });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  };

  // --- Logic tạo Slug tự động khi gõ tên ---
  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.translations) {
      // Tìm xem bản dịch ở ngôn ngữ nào vừa thay đổi tên
      const changedIndex = changedValues.translations.findIndex((item: any) => item && item.name !== undefined);
      
      if (changedIndex !== -1) {
        const nameValue = changedValues.translations[changedIndex].name;
        const currentTranslations = [...allValues.translations];
        
        // Cập nhật slug tương ứng cho index đó
        currentTranslations[changedIndex] = {
          ...currentTranslations[changedIndex],
          slug: slugify(nameValue)
        };

        form.setFieldsValue({ translations: currentTranslations });
      }
    }
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
      title: 'Loại bài viết', 
      dataIndex: 'type', 
      key: 'type',
      filters: [
        { text: 'Tin tức', value: 'NEWS' },
        { text: 'Dịch vụ', value: 'SERVICE' },
      ],
      filterMultiple: false,
      render: (type: CategoryType) => (
        <Tag color={type === 'NEWS' ? 'blue' : 'green'}>
          {type === 'NEWS' ? 'TIN TỨC' : 'DỊCH VỤ'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => openDrawer(record)}>Sửa</Button>
          <Popconfirm 
            title="Xóa danh mục" 
            onConfirm={() => deleteMutation.mutate(record.id)} 
            okText="Xóa" 
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderTranslationFields = (index: number, label: string) => (
    <div key={index}>
        <Form.Item name={['translations', index, 'locale']} hidden><Input /></Form.Item>
        <Form.Item 
            label={`Tên danh mục (${label})`} 
            name={['translations', index, 'name']} 
            rules={[{ required: index === 0, message: 'Tên Tiếng Việt là bắt buộc' }]}
        >
            <Input placeholder={`Nhập tên bằng ${label}`} />
        </Form.Item>
        <Form.Item 
            label={`Slug / Đường dẫn (${label})`} 
            name={['translations', index, 'slug']} 
            rules={[{ required: index === 0, message: 'Slug Tiếng Việt là bắt buộc' }]}
        >
            <Input placeholder="Tự động tạo khi nhập tên..." />
        </Form.Item>
        <Form.Item label={`Mô tả (${label})`} name={['translations', index, 'description']}>
            <Input.TextArea rows={2} />
        </Form.Item>
    </div>
  );

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
        width={550}
        extra={
          <Space>
            <Button onClick={closeDrawer}>Hủy</Button>
            <Button type="primary" onClick={() => form.submit()} loading={mutation.isPending} style={{ background: '#003366' }}>
              Xác nhận lưu
            </Button>
          </Space>
        }
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={(v) => mutation.mutate(v)}
          onValuesChange={handleValuesChange} // <-- Gắn logic tạo slug
        >
          <Form.Item 
            label={<Typography.Text strong>Loại áp dụng</Typography.Text>} 
            name="type" 
            rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
          >
            <Select placeholder="Chọn mục đích sử dụng">
              <Select.Option value="SERVICE">Dành cho Dịch vụ</Select.Option>
              <Select.Option value="NEWS">Dành cho Tin tức</Select.Option>
            </Select>
          </Form.Item>

          <Typography.Title level={5} style={{ marginTop: 20 }}>
            <GlobalOutlined /> Nội dung đa ngôn ngữ
          </Typography.Title>
          
          <Tabs defaultActiveKey="vi" items={[
            { key: 'vi', label: 'Tiếng Việt', children: renderTranslationFields(0, 'Tiếng Việt') },
            { key: 'en', label: 'English', children: renderTranslationFields(1, 'English') },
            { key: 'zh', label: 'Chinese', children: renderTranslationFields(2, 'Chinese') },
          ]} />
        </Form>
      </Drawer>
    </Space>
  );
}