'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Space, Table, Tag, Switch, Popconfirm, Avatar, Typography } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, ReadOutlined, FolderOpenOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { News, PaginatedResponse, Translation, Category } from '@/types';
import { NewsFormDrawer } from './_components/NewsFormDrawer';

// --- Các hàm gọi API ---
interface NewsQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; filters?: Record<string, FilterValue | null>; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; status?: string; featured?: boolean; categoryId?: number; };

const getVietnameseTitle = (translations: Translation[]) => { return translations.find(t => t.locale === 'vi')?.title || 'Chưa có tiêu đề'; };

const fetchNews = async (query: NewsQuery): Promise<PaginatedResponse<News>> => {
  const params: ApiParams = { 
    page: query.page, 
    limit: query.limit, 
    q: query.q, 
    sortBy: query.sortBy, 
    sortOrder: query.sortOrder 
  };
  
  // Xử lý Filter Trạng thái
  if (query.filters?.status?.[0]) {
    params.status = query.filters.status[0] as string;
  }
  
  // Xử lý Filter Nổi bật
  if (query.filters?.featured?.[0]) {
    params.featured = query.filters.featured[0] === 'true';
  }

  // Xử lý Filter Danh mục
  if (query.filters?.categoryId?.[0]) {
    params.categoryId = Number(query.filters.categoryId[0]);
  }

  const response = await api.get<BackendResponse<PaginatedResponse<News>>>('/admin/news', { params });
  return response.data.data;
};

// Lấy danh sách danh mục để làm bộ lọc
const fetchCategories = async (): Promise<Category[]> => {
  const response = await api.get<BackendResponse<Category[] | {data: Category[]}>>('/admin/categories?type=NEWS');
  const result = response.data.data;
  return Array.isArray(result) ? result : (result as any)?.data || [];
};

const updateNewsFeaturedStatus = async ({ id, featured }: { id: number; featured: boolean }): Promise<News> => {
  const response = await api.patch<BackendResponse<News>>(`/admin/news/${id}`, { featured });
  return response.data.data;
};

const deleteNews = async (id: number): Promise<void> => {
  await api.delete(`/admin/news/${id}`);
};

// --- Component Chính ---
export default function NewsPage() {
  const [queryParams, setQueryParams] = useState<NewsQuery>({ page: 1, limit: 10, q: '' });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  // Query lấy danh sách tin tức
  const { data, isLoading } = useQuery({
    queryKey: ['news', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchNews({ ...queryParams, q: debouncedSearchTerm }),
    placeholderData: (prevData) => prevData,
  });

  // Query lấy danh sách danh mục (NEWS) cho bộ lọc
  const { data: categories } = useQuery({
    queryKey: ['categories', 'NEWS'],
    queryFn: fetchCategories,
  });

  // --- SỬA LỖI TẠI ĐÂY: Tìm tên tiếng Việt để làm label filter ---
  const categoryFilters = useMemo(() => {
    return categories?.map(cat => ({ 
      text: cat.translations?.find(t => t.locale === 'vi')?.name || 'N/A', 
      value: cat.id 
    })) || [];
  }, [categories]);

  const updateFeaturedMutation = useMutation({
    mutationFn: updateNewsFeaturedStatus,
    onSuccess: (updatedNews) => {
      notification.success({ message: 'Cập nhật trạng thái nổi bật thành công!' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (error: Error) => notification.error({ message: 'Lỗi', description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNews,
    onSuccess: () => {
      notification.success({ message: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (error: Error) => notification.error({ message: 'Xóa thất bại', description: error.message })
  });

  const openCreateDrawer = () => { setEditingNewsId(null); setDrawerOpen(true); };
  const openEditDrawer = (id: number) => { setEditingNewsId(id); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditingNewsId(null); };

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<News> | SorterResult<News>[]) => {
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

  const columns: TableProps<News>['columns'] = [
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
      title: 'Tiêu đề bài viết (VI)', 
      dataIndex: 'translations', 
      key: 'title', 
      render: (translations: Translation[]) => (
        <div style={{ maxWidth: 400 }}>
          <Typography.Text strong>{getVietnameseTitle(translations)}</Typography.Text>
        </div>
      )
    },
    { 
      title: 'Danh mục', 
      dataIndex: 'categoryId', 
      key: 'categoryId',
      filters: categoryFilters,
      filterMultiple: false,
      // --- SỬA LỖI TẠI ĐÂY: Tìm tên tiếng Việt của danh mục ---
      render: (_, record) => record.category ? (
        <Tag icon={<FolderOpenOutlined />} color="blue">
          {record.category.translations?.find(t => t.locale === 'vi')?.name || 'N/A'}
        </Tag>
      ) : '-'
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status', 
      filters: [ { text: 'Bản nháp', value: 'DRAFT' }, { text: 'Đã xuất bản', value: 'PUBLISHED' } ],
      filterMultiple: false,
      render: (status: string) => (
        <Tag color={status === 'PUBLISHED' ? 'green' : 'orange'}>
          {status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}
        </Tag>
      ), 
    },
    { 
      title: 'Nổi bật', 
      dataIndex: 'featured', 
      key: 'featured', 
      filters: [ { text: 'Có', value: 'true' }, { text: 'Không', value: 'false' } ],
      filterMultiple: false,
      render: (featured: boolean, record: News) => ( 
        <Switch 
          checked={featured} 
          loading={updateFeaturedMutation.isPending && updateFeaturedMutation.variables?.id === record.id} 
          onChange={(checked) => updateFeaturedMutation.mutate({ id: record.id, featured: checked })} 
        /> 
      ), 
    },
    { 
      title: 'Ngày đăng', 
      dataIndex: 'publishedAt', 
      key: 'publishedAt', 
      sorter: true, 
      render: (date: string | null) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-', 
    },
    {
      title: 'Hành động', 
      key: 'action',
      width: 120,
      render: (_, record: News) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => openEditDrawer(record.id)}>Sửa</Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Dữ liệu bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống."
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
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb items={[ { href: '/admin', title: <HomeOutlined /> }, { title: <Space><ReadOutlined /> Quản lý Tin tức</Space> }, ]} />
        
        <Card 
          title={<Space><ReadOutlined style={{ color: '#003366' }} />Danh sách Bài viết</Space>} 
          extra={ <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer} style={{ background: '#003366' }}> Viết bài mới </Button> }
        >
          <Flex justify="flex-end" style={{ marginBottom: 20 }}>
            <Input.Search 
              placeholder="Tìm theo tiêu đề bài viết..." 
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
              showTotal: (total) => `Tổng cộng ${total} bài viết`
            }} 
            loading={isLoading} 
            onChange={handleTableChange} 
            bordered 
            size="middle"
          />
        </Card>
      </Space>

      <NewsFormDrawer open={drawerOpen} onClose={closeDrawer} newsId={editingNewsId} />
    </>
  );
}