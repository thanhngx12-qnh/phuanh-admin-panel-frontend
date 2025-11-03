// src/app/(admin)/careers/_components/JobPostingsTab.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Flex, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { JobPosting, PaginatedResponse } from '@/types';
import { JobPostingFormDrawer } from './JobPostingFormDrawer';

interface JobPostingsQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; filters?: Record<string, FilterValue | null>; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; status?: string; };

const fetchJobPostings = async (query: JobPostingsQuery): Promise<PaginatedResponse<JobPosting>> => {
  const params: ApiParams = { page: query.page, limit: query.limit, q: query.q, sortBy: query.sortBy, sortOrder: query.sortOrder };
  const statusFilter = query.filters?.status;
  if (statusFilter && Array.isArray(statusFilter)) { params.status = statusFilter.join(','); }
  const response = await api.get<BackendResponse<PaginatedResponse<JobPosting>>>('/careers/postingss', { params });
  return response.data.data;
};

const deleteJobPosting = async (id: number): Promise<void> => {
  await api.delete(`/careers/postings/${id}`);
};

export function JobPostingsTab() {
  const [queryParams, setQueryParams] = useState<JobPostingsQuery>({ page: 1, limit: 10, q: '' });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['jobPostings', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchJobPostings({ ...queryParams, q: debouncedSearchTerm }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobPosting,
    onSuccess: () => {
      notification.success({ message: 'Xóa tin tuyển dụng thành công!' });
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
    },
    onError: (error: Error) => notification.error({ message: 'Xóa thất bại', description: error.message }),
  });

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<JobPosting> | SorterResult<JobPosting>[]) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev: JobPostingsQuery) => ({ ...prev, page: pagination.current || 1, limit: pagination.pageSize || 10, filters, sortBy: s.field?.toString(), sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined, }));
  };

  const openDrawer = (id?: number) => { setEditingId(id || null); setIsDrawerOpen(true); };
  const closeDrawer = () => { setIsDrawerOpen(false); setEditingId(null); };

  const columns: TableProps<JobPosting>['columns'] = [
    { title: 'Vị trí tuyển dụng', dataIndex: 'title', key: 'title', sorter: true },
    { title: 'Địa điểm', dataIndex: 'location', key: 'location', sorter: true },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      filters: [ { text: 'Đang tuyển', value: 'OPEN' }, { text: 'Đã đóng', value: 'CLOSED' } ],
      render: (status) => <Tag color={status === 'OPEN' ? 'green' : 'red'}>{status}</Tag>,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', sorter: true, defaultSortOrder: 'descend', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => openDrawer(record.id)}>Sửa</a>
          <Popconfirm title="Xóa tin tuyển dụng" description="Bạn có chắc muốn xóa tin này?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy">
            <a style={{ color: 'red' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Tìm theo vị trí..." value={queryParams.q || ''} onChange={(e) => setQueryParams((prev: JobPostingsQuery) => ({ ...prev, q: e.target.value, page: 1 }))} style={{ width: 300 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}> Đăng tin mới </Button>
      </Flex>
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data?.data}
        pagination={{ current: data?.page || 1, pageSize: data?.limit || 10, total: data?.total || 0 }}
        loading={isLoading}
        onChange={handleTableChange}
        bordered
        locale={{ emptyText: 'Chưa có tin tuyển dụng nào' }}
      />
      <JobPostingFormDrawer open={isDrawerOpen} onClose={closeDrawer} jobPostingId={editingId} />
    </>
  );
}