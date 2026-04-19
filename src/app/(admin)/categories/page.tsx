// dir: src/app/(admin)/categories/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Table, Tag, Drawer, Form, Select, Input, Space, Popconfirm, Flex, Spin, Typography } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { Category, CategoryType } from '@/types';

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
    
    const response = await api.get<BackendResponse<Category[] | { data: Category[] }>>('/admin/categories', { params });
    const result = response.data.data;

    // Logic bóc tách dữ liệu linh hoạt
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

export default function CategoriesPage() {
  const [queryParams, setQueryParams] = useState<CategoriesQuery>({ q: '' });
  const [debouncedSearch] = useDebounce(queryParams.q, 500);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  // --- QUERY DỮ LIỆU (ĐÃ FIX LỖI LOAD LẦN ĐẦU) ---
  const { data: categories, isFetching, isLoading } = useQuery({
    queryKey: ['categories', 'list', { ...queryParams, q: debouncedSearch }], // Cấu trúc phân cấp
    queryFn: () => fetchCategories({ ...queryParams, q: debouncedSearch }),
    placeholderData: (previousData) => previousData,
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingCategory) return api.patch(`/admin/categories/${editingCategory.id}`, values);
      return api.post('/admin/categories', values);
    },
    onSuccess: () => {
      notification.success({ message: editingCategory ? 'Cập nhật thành công' : 'Thêm mới thành công' });
      
      // SỬA LẠI: Invalidate toàn bộ những gì bắt đầu bằng 'categories'
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      
      closeDrawer();
    },
    onError: (error: any) => notification.error({ message: 'Lỗi', description: error.message })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      notification.success({ message: 'Đã xóa danh mục' });
      
      // SỬA LẠI: Đồng bộ xóa cache
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
      form.setFieldsValue(record);
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

  

  const columns: TableProps<Category>['columns'] = [
    { 
      title: 'Tên danh mục', 
      dataIndex: 'name', 
      key: 'name', 
      sorter: true,
      render: (text) => <Typography.Text strong>{text}</Typography.Text> 
    },
    { 
      title: 'Slug', 
      dataIndex: 'slug', 
      key: 'slug',
      sorter: true,
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb items={[{ href: '/admin', title: <HomeOutlined /> }, { title: 'Quản lý danh mục' }]} />
      
      <Card 
        title={<Space><FolderOpenOutlined style={{ color: '#003366' }} />Phân loại nội dung</Space>} 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()} style={{ background: '#003366' }}>Thêm danh mục</Button>}
      >
        <Flex justify="flex-end" style={{ marginBottom: 20 }}>
          <Input.Search 
            placeholder="Tìm tên danh mục..." 
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
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng cộng ${total} danh mục`
          }}
        />
      </Card>

      <Drawer
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={isDrawerOpen}
        onClose={closeDrawer}
        width={450}
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
            label={<Typography.Text strong>Tên danh mục</Typography.Text>} 
            name="name" 
            rules={[{ required: true, message: 'Không được để trống tên!' }]}
          >
            <Input placeholder="Ví dụ: Vận tải quốc tế" />
          </Form.Item>
          <Form.Item 
            label={<Typography.Text strong>Slug (Đường dẫn)</Typography.Text>} 
            name="slug" 
            rules={[{ required: true, message: 'Vui lòng nhập slug!' }]}
          >
            <Input placeholder="logistics-quoc-te" />
          </Form.Item>
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
        </Form>
      </Drawer>
    </Space>
  );
}