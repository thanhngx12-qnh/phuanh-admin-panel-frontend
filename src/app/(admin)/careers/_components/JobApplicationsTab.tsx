// src/app/(admin)/careers/_components/JobApplicationsTab.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Flex, Input, Popconfirm, Space, Table, Tooltip } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { DownloadOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { JobApplication, PaginatedResponse } from '@/types';

interface ApplicationsQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; };

const fetchApplications = async (query: ApplicationsQuery): Promise<PaginatedResponse<JobApplication>> => {
  const params: ApiParams = { page: query.page, limit: query.limit, q: query.q, sortBy: query.sortBy, sortOrder: query.sortOrder };
  const response = await api.get<BackendResponse<PaginatedResponse<JobApplication>>>('/careers/applications', { params });
  return response.data.data;
};

const deleteApplication = async (id: number): Promise<void> => {
  await api.delete(`/careers/applications/${id}`);
};

export function JobApplicationsTab() {
  const [queryParams, setQueryParams] = useState<ApplicationsQuery>({ page: 1, limit: 10, q: '' });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);
  
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['jobApplications', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchApplications({ ...queryParams, q: debouncedSearchTerm }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      notification.success({ message: 'Xóa hồ sơ thành công!' });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
    onError: (error: Error) => notification.error({ message: 'Xóa thất bại', description: error.message }),
  });

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<JobApplication> | SorterResult<JobApplication>[]) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev) => ({ ...prev, page: pagination.current || 1, limit: pagination.pageSize || 10, filters, sortBy: s.field?.toString(), sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined, }));
  };

  const columns: TableProps<JobApplication>['columns'] = [
    { title: 'Tên Ứng viên', dataIndex: 'applicantName', key: 'applicantName', sorter: true },
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Vị trí Ứng tuyển',
      dataIndex: 'jobPosting',
      key: 'jobPosting',
      render: (jobPosting) => jobPosting?.title || <span style={{ color: 'grey' }}>Không rõ</span>,
    },
    {
      title: 'CV',
      dataIndex: 'cvPath',
      key: 'cvPath',
      render: (cvPath: string) => (
        <Tooltip title="Tải CV">
          <Button
            icon={<DownloadOutlined />}
            onClick={() => window.open(cvPath, '_blank')}
          />
        </Tooltip>
      ),
    },
    { title: 'Ngày nộp', dataIndex: 'appliedAt', key: 'appliedAt', sorter: true, defaultSortOrder: 'descend', render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {/* Có thể thêm nút xem chi tiết (Modal) ở đây nếu cần */}
          <Popconfirm title="Xóa hồ sơ" description="Bạn có chắc muốn xóa hồ sơ này?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy">
            <a style={{ color: 'red' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Tìm theo tên hoặc email..." value={queryParams.q || ''} onChange={(e) => setQueryParams(prev => ({ ...prev, q: e.target.value, page: 1 }))} style={{ width: 300 }} allowClear />
        {/* Có thể thêm nút Filter theo Vị trí tuyển dụng ở đây */}
      </Flex>
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data?.data}
        pagination={{ current: data?.page || 1, pageSize: data?.limit || 10, total: data?.total || 0 }}
        loading={isLoading}
        onChange={handleTableChange}
        bordered
        locale={{ emptyText: 'Chưa có hồ sơ ứng tuyển nào' }}
      />
    </>
  );
}