'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Popconfirm, Space, Table, Switch, Avatar, Typography, Tag } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, AppstoreOutlined, FolderOpenOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { Service, PaginatedResponse, Translation, Category } from '@/types';
import { ServiceFormDrawer } from './_components/ServiceFormDrawer';

interface ServicesQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; filters?: Record<string, FilterValue | null>; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; categoryId?: number; featured?: boolean; };

const getVietnameseTitle = (translations: Translation[]) => { return translations.find(t => t.locale === 'vi')?.title || 'Chưa có tiêu đề'; };

const fetchServices = async (query: ServicesQuery): Promise<PaginatedResponse<Service>> => {
  const params: ApiParams = { 
    page: query.page, 
    limit: query.limit, 
    q: query.q, 
    sortBy: query.sortBy, 
    sortOrder: query.sortOrder 
  };
  
  // Xử lý Filter Danh mục
  if (query.filters?.categoryId?.[0]) {
    params.categoryId = Number(query.filters.categoryId[0]);
  }

  // Xử lý Filter Nổi bật
  if (query.filters?.featured?.[0]) {
    params.featured = query.filters.featured[0] === 'true';
  }

  const response = await api.get<BackendResponse<PaginatedResponse<Service>>>('/admin/services', { params });
  return response.data.data;
};

// Lấy danh sách danh mục Dịch vụ cho bộ lọc
const fetchCategories = async (): Promise<Category[]> => {
  const response = await api.get<BackendResponse<Category[] | {data: Category[]}>>('/admin/categories?type=SERVICE');
  const result = response.data.data;
  return Array.isArray(result) ? result : (result as any)?.data || [];
};

const deleteService = async (id: number): Promise<void> => {
  await api.delete(`/admin/services/${id}`);
};

const updateServiceFeaturedStatus = async ({ id, featured }: { id: number; featured: boolean }): Promise<Service> => {
  const response = await api.patch<BackendResponse<Service>>(`/admin/services/${id}`, { featured });
  return response.data.data;
};

export default function ServicesPage() {
  const [queryParams, setQueryParams] = useState<ServicesQuery>({ page: 1, limit: 10, q: '' });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  // Query lấy danh sách dịch vụ
  const { data, isLoading } = useQuery({
    queryKey: ['services', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchServices({ ...queryParams, q: debouncedSearchTerm }),
  });

  // Query lấy danh mục để làm bộ lọc trên cột
  const { data: categories } = useQuery({
    queryKey: ['categories', 'SERVICE'],
    queryFn: fetchCategories,
  });

  // --- SỬA LỖI TẠI ĐÂY: Lấy tên tiếng Việt của danh mục làm text filter ---
  const categoryFilters = useMemo(() => {
    return categories?.map(cat => ({ 
        text: cat.translations?.find(t => t.locale === 'vi')?.name || 'N/A', 
        value: cat.id 
    })) || [];
  }, [categories]);

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      notification.success({ message: 'Xóa dịch vụ thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: Error) => notification.error({ message: 'Xóa thất bại', description: error.message }),
  });

  const updateFeaturedMutation = useMutation({
    mutationFn: updateServiceFeaturedStatus,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật trạng thái thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: Error) => notification.error({ message: 'Thất bại', description: error.message }),
  });

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<Service> | SorterResult<Service>[],) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev) => ({ 
      ...prev, 
      page: pagination.current || 1, 
      limit: pagination.pageSize || 10, 
      filters, 
      sortBy: s.field?.toString(), 
      sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined, 
    }));
  };
  
  const openDrawer = (id?: number) => { setEditingServiceId(id || null); setIsDrawerOpen(true); };
  const closeDrawer = () => { setIsDrawerOpen(false); setEditingServiceId(null); };

  const columns: TableProps<Service>['columns'] = [
    {
      title: 'Ảnh',
      dataIndex: 'coverImage',
      key: 'image',
      width: 80,
      render: (url: string) => url ? (
        <Avatar shape="square" size={48} src={url} />
      ) : (
        <Avatar shape="square" size={48} icon={<PictureOutlined />} />
      ),
    },
    { 
      title: 'Tên Dịch vụ (VI)', 
      dataIndex: 'translations', 
      key: 'title', 
      render: (translations: Translation[]) => (
        <Typography.Text strong>{getVietnameseTitle(translations)}</Typography.Text>
      )
    },
    { 
      title: 'Danh mục', 
      dataIndex: 'categoryId', 
      key: 'categoryId', 
      filters: categoryFilters,
      filterMultiple: false,
      render: (categoryId: number) => {
        // SỬA TẠI ĐÂY: Dò trong list 'categories' đã fetch ở trên
        const categoryInfo = categories?.find(cat => cat.id === categoryId);
        const viName = categoryInfo?.translations?.find(t => t.locale === 'vi')?.name;

        return categoryId ? (
          <Tag icon={<FolderOpenOutlined />} color="blue">
            {viName || 'N/A'}
          </Tag>
        ) : '-';
      }
    },
    {
      title: 'Nổi bật', 
      dataIndex: 'featured', 
      key: 'featured',
      filters: [ { text: 'Có', value: 'true' }, { text: 'Không', value: 'false' } ],
      filterMultiple: false,
      render: (featured: boolean, record: Service) => (
        <Switch
          checked={featured}
          loading={updateFeaturedMutation.isPending && updateFeaturedMutation.variables?.id === record.id}
          onChange={(checked) => updateFeaturedMutation.mutate({ id: record.id, featured: checked })}
        />
      ),
    },
    { 
      title: 'Ngày tạo', 
      dataIndex: 'createdAt', 
      key: 'createdAt', 
      sorter: true, 
      render: (date: string) => dayjs(date).format('DD/MM/YYYY') 
    },
    {
      title: 'Hành động', 
      key: 'action',
      width: 120,
      render: (_, record: Service) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => openDrawer(record.id)}>Sửa</Button>
          <Popconfirm title="Xóa dịch vụ" description="Lưu ý: Hành động này không thể hoàn tác." onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button type="link" danger size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb items={[ { href: '/admin', title: <HomeOutlined /> }, { title: <Space><AppstoreOutlined /> Quản lý Dịch vụ</Space> }, ]} />
        
        <Card
          title={<Space><AppstoreOutlined style={{ color: '#003366' }} />Danh sách Dịch vụ</Space>}
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()} style={{ background: '#003366' }}> Thêm Dịch vụ mới </Button>}
        >
          <Flex justify="flex-end" style={{ marginBottom: 20 }}>
            <Input.Search 
              placeholder="Tìm kiếm dịch vụ..." 
              value={queryParams.q} 
              onChange={(e) => setQueryParams((prev) => ({ ...prev, q: e.target.value, page: 1 }))} 
              style={{ width: 350 }} 
              allowClear 
              enterButton
            />
          </Flex>

          <Table
            columns={columns}
            rowKey="id"
            dataSource={data?.data}
            pagination={{ 
              current: data?.page || 1, 
              pageSize: data?.limit || 10, 
              total: data?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} dịch vụ`
            }}
            loading={isLoading}
            onChange={handleTableChange}
            bordered
            size="middle"
          />
        </Card>
      </Space>
      <ServiceFormDrawer open={isDrawerOpen} onClose={closeDrawer} serviceId={editingServiceId} />
    </>
  );
}