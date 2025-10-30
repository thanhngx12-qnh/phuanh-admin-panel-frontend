// src/app/(admin)/services/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Popconfirm, Space, Table, Switch } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { Service, PaginatedResponse, Translation } from '@/types';
import { ServiceFormDrawer } from './_components/ServiceFormDrawer';

interface ServicesQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; filters?: Record<string, FilterValue | null>; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; category?: string; featured?: boolean; };
const getVietnameseTitle = (translations: Translation[]) => { return translations.find(t => t.locale === 'vi')?.title || 'Chưa có tiêu đề'; };

const fetchServices = async (query: ServicesQuery): Promise<PaginatedResponse<Service>> => {
  const params: ApiParams = { page: query.page, limit: query.limit, q: query.q, sortBy: query.sortBy, sortOrder: query.sortOrder };
  if (query.filters?.category && Array.isArray(query.filters.category)) { params.category = query.filters.category.join(','); }
  if (query.filters?.featured && Array.isArray(query.filters.featured)) { params.featured = query.filters.featured[0] === 'true'; }
  const response = await api.get<BackendResponse<PaginatedResponse<Service>>>('/admin/services', { params });
  return response.data.data;
};

const deleteService = async (id: number): Promise<void> => {
  await api.delete(`/admin/services/${id}`);
};

// --- HÀM MỚI ĐỂ CẬP NHẬT TRẠNG THÁI NỔI BẬT ---
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

  const { data, isLoading } = useQuery({
    queryKey: ['services', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchServices({ ...queryParams, q: debouncedSearchTerm }),
  });

  const categoryFilters = useMemo(() => {
    if (!data?.data) return [];
    const categories = [...new Set(data.data.map(service => service.category))];
    return categories.map(cat => ({ text: cat, value: cat }));
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      notification.success({ message: 'Xóa dịch vụ thành công!' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: Error) => notification.error({ message: 'Xóa thất bại', description: error.message }),
  });

  // --- MUTATION MỚI CHO VIỆC BẬT/TẮT NỔI BẬT ---
  const updateFeaturedMutation = useMutation({
    mutationFn: updateServiceFeaturedStatus,
    onSuccess: (updatedService) => {
      notification.success({ message: 'Cập nhật trạng thái thành công!' });
      // Tối ưu: Cập nhật cache trực tiếp
      queryClient.setQueryData(['services', { ...queryParams, q: debouncedSearchTerm }], (oldData: PaginatedResponse<Service> | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map(service => service.id === updatedService.id ? updatedService : service),
        };
      });
    },
    onError: (error: Error) => {
      notification.error({ message: 'Cập nhật thất bại', description: error.message });
      queryClient.invalidateQueries({ queryKey: ['services'] }); // Rollback UI
    },
  });

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<Service> | SorterResult<Service>[],) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev: ServicesQuery) => ({ ...prev, page: pagination.current || 1, limit: pagination.pageSize || 10, filters, sortBy: s.field?.toString(), sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined, }));
  };
  
  const openDrawer = (id?: number) => { setEditingServiceId(id || null); setIsDrawerOpen(true); };
  const closeDrawer = () => { setIsDrawerOpen(false); setEditingServiceId(null); };

  const columns: TableProps<Service>['columns'] = [
    { title: 'Tên Dịch vụ (Tiếng Việt)', dataIndex: 'translations', key: 'title', render: (translations: Translation[]) => <strong>{getVietnameseTitle(translations)}</strong> },
    { title: 'Danh mục', dataIndex: 'category', key: 'category', sorter: true, filters: categoryFilters, },
    {
      title: 'Nổi bật', dataIndex: 'featured', key: 'featured',
      filters: [ { text: 'Có', value: 'true' }, { text: 'Không', value: 'false' } ],
      // --- SỬA LỖI Ở ĐÂY: Bỏ disabled và thêm onChange ---
      render: (featured: boolean, record: Service) => (
        <Switch
          checked={featured}
          loading={updateFeaturedMutation.isPending && updateFeaturedMutation.variables?.id === record.id}
          onChange={(checked) => {
            updateFeaturedMutation.mutate({ id: record.id, featured: checked });
          }}
        />
      ),
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', sorter: true, defaultSortOrder: 'descend', render: (date: string) => dayjs(date).format('DD/MM/YYYY') },
    {
      title: 'Hành động', key: 'action',
      render: (_, record: Service) => (
        <Space size="middle">
          <a onClick={() => openDrawer(record.id)}>Sửa</a>
          <Popconfirm title="Xóa dịch vụ" description="Bạn có chắc muốn xóa dịch vụ này?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy">
            <a style={{ color: 'red' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb items={[ { href: '/admin', title: <HomeOutlined /> }, { href: '/services', title: <><AppstoreOutlined /><span> Quản lý Dịch vụ</span></> }, ]} />
        <Card
          title="Danh sách Dịch vụ"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}> Thêm Dịch vụ mới </Button>}
        >
          <Flex justify="flex-end" style={{ marginBottom: 16 }}>
            <Input.Search placeholder="Tìm kiếm dịch vụ..." value={queryParams.q} onChange={(e) => setQueryParams((prev: ServicesQuery) => ({ ...prev, q: e.target.value, page: 1 }))} style={{ width: 300 }} allowClear />
          </Flex>
          <Table
            columns={columns}
            rowKey="id"
            dataSource={data?.data}
            pagination={{ current: data?.page || 1, pageSize: data?.limit || 10, total: data?.total || 0, }}
            loading={isLoading}
            onChange={handleTableChange}
            bordered
            locale={{ emptyText: 'Chưa có dịch vụ nào' }}
          />
        </Card>
      </Space>
      <ServiceFormDrawer open={isDrawerOpen} onClose={closeDrawer} serviceId={editingServiceId} />
    </>
  );
}