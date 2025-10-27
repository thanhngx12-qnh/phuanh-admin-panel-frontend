// src/app/(admin)/news/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Space, Table, Tag, Switch, Popconfirm } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, ReadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { News, PaginatedResponse, Translation } from '@/types';
import { NewsFormDrawer } from './_components/NewsFormDrawer';

interface NewsQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; filters?: Record<string, FilterValue | null>; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; status?: string; featured?: boolean; };

const getVietnameseTitle = (translations: Translation[]) => { return translations.find(t => t.locale === 'vi')?.title || 'Chưa có tiêu đề'; };

const fetchNews = async (query: NewsQuery): Promise<PaginatedResponse<News>> => {
  const params: ApiParams = { page: query.page, limit: query.limit, q: query.q, sortBy: query.sortBy, sortOrder: query.sortOrder };
  const statusFilter = query.filters?.status;
  if (statusFilter && Array.isArray(statusFilter) && statusFilter.length > 0) { params.status = statusFilter[statusFilter.length - 1] as string; }
  const featuredFilter = query.filters?.featured;
  if (featuredFilter && Array.isArray(featuredFilter) && featuredFilter.length > 0) { params.featured = featuredFilter[featuredFilter.length - 1] === 'true'; }
  const response = await api.get<BackendResponse<PaginatedResponse<News>>>('/admin/news', { params });
  return response.data.data;
};

const updateNewsFeaturedStatus = async ({ id, featured }: { id: number; featured: boolean }): Promise<News> => {
  const response = await api.patch<BackendResponse<News>>(`/admin/news/${id}`, { featured });
  return response.data.data;
};

const deleteNews = async (id: number): Promise<void> => {
  await api.delete(`/admin/news/${id}`);
};

export default function NewsPage() {
  const [queryParams, setQueryParams] = useState<NewsQuery>({ page: 1, limit: 10, q: '' });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['news', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchNews({ ...queryParams, q: debouncedSearchTerm }),
    placeholderData: (prevData) => prevData,
  });

  const updateFeaturedMutation = useMutation({
    mutationFn: updateNewsFeaturedStatus,
    onSuccess: (updatedNews) => {
      notification.success({ message: 'Cập nhật trạng thái thành công!' });
      queryClient.setQueryData(['news', { ...queryParams, q: debouncedSearchTerm }], (oldData: PaginatedResponse<News> | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, data: oldData.data.map(news => news.id === updatedNews.id ? updatedNews : news) };
      });
    },
    onError: (error: Error) => {
      notification.error({ message: 'Cập nhật thất bại', description: error.message });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  // --- Thêm Mutation cho Xóa ---
  const deleteMutation = useMutation({
    mutationFn: deleteNews,
    onSuccess: () => {
      notification.success({ message: 'Xóa bài viết thành công!' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (error: Error) => {
      notification.error({ message: 'Xóa thất bại', description: error.message });
    }
  });

  const openCreateDrawer = () => { setEditingNewsId(null); setDrawerOpen(true); };
  const openEditDrawer = (id: number) => { setEditingNewsId(id); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditingNewsId(null); };

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<News> | SorterResult<News>[]) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev: NewsQuery) => ({ ...prev, page: pagination.current || 1, limit: pagination.pageSize || 10, filters, sortBy: s.field?.toString(), sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined, }));
  };

  const columns: TableProps<News>['columns'] = [
    { title: 'Tiêu đề (Tiếng Việt)', dataIndex: 'translations', key: 'title', render: (translations: Translation[]) => <strong>{getVietnameseTitle(translations)}</strong> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', filters: [ { text: 'Bản nháp', value: 'DRAFT' }, { text: 'Đã xuất bản', value: 'PUBLISHED' }, ], render: (status: News['status']) => (<Tag color={status === 'PUBLISHED' ? 'green' : 'orange'}>{status}</Tag>), },
    { title: 'Nổi bật', dataIndex: 'featured', key: 'featured', filters: [ { text: 'Có', value: 'true' }, { text: 'Không', value: 'false' }, ], render: (featured: boolean, record: News) => ( <Switch checked={featured} loading={updateFeaturedMutation.isPending && updateFeaturedMutation.variables?.id === record.id} onChange={(checked) => { updateFeaturedMutation.mutate({ id: record.id, featured: checked }); }} /> ), },
    { title: 'Ngày xuất bản', dataIndex: 'publishedAt', key: 'publishedAt', sorter: true, render: (date: string | null) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-', },
    {
      title: 'Hành động', key: 'action',
      render: (_, record: News) => (
        <Space size="middle">
          <a onClick={() => openEditDrawer(record.id)}>Sửa</a>
          <Popconfirm
            title="Xóa bài viết"
            description={`Bạn có chắc muốn xóa bài viết "${getVietnameseTitle(record.translations)}"?`}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            disabled={deleteMutation.isPending}
          >
            <a style={{ color: 'red' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb items={[ { href: '/admin', title: <HomeOutlined /> }, { title: <><ReadOutlined /><span> Quản lý Tin tức</span></> }, ]} />
        <Card title="Danh sách Tin tức" extra={ <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}> Viết bài mới </Button> }>
          <Flex justify="flex-end" style={{ marginBottom: 16 }}>
            <Input.Search placeholder="Tìm theo tiêu đề..." value={queryParams.q} onChange={(e) => setQueryParams((prev: NewsQuery) => ({ ...prev, q: e.target.value, page: 1 }))} style={{ width: 300 }} allowClear />
          </Flex>
          <Table columns={columns} rowKey="id" dataSource={data?.data} pagination={{ current: data?.page || 1, pageSize: data?.limit || 10, total: data?.total || 0 }} loading={isLoading} onChange={handleTableChange} bordered locale={{ emptyText: 'Chưa có bài viết nào' }} />
        </Card>
      </Space>
      <NewsFormDrawer open={drawerOpen} onClose={closeDrawer} newsId={editingNewsId} />
    </>
  );
}