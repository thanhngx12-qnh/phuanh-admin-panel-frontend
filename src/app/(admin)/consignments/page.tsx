// src/app/(admin)/consignments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, TruckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { Consignment, PaginatedResponse } from '@/types';
import { ConsignmentFormDrawer } from './_components/ConsignmentFormDrawer';

// --- ĐỊNH NGHĨA CÁC PARAMS CHO QUERY ---
interface ConsignmentsQuery {
  page: number;
  limit: number;
  q?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, FilterValue | null>;
}

// --- SỬA LỖI Ở ĐÂY: Định nghĩa kiểu cho params của Axios ---
// Sử dụng kiểu Record<string, any> là chấp nhận được cho params, nhưng chúng ta có thể làm tốt hơn
type ApiParams = {
  page: number;
  limit: number;
  q?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  origin?: string;
  destination?: string;
};

const fetchConsignments = async (query: ConsignmentsQuery): Promise<PaginatedResponse<Consignment>> => {
  const params: ApiParams = {
    page: query.page,
    limit: query.limit,
    q: query.q,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };

  if (query.filters) {
    const statusFilter = query.filters.status;
    if (statusFilter && Array.isArray(statusFilter)) {
      params.status = statusFilter.join(',');
    }
  }

  const response = await api.get<BackendResponse<PaginatedResponse<Consignment>>>('/admin/consignments', { params });
  return response.data.data;
};

const deleteConsignment = async (id: number): Promise<void> => {
  await api.delete(`/admin/consignments/${id}`);
};

export default function ConsignmentsPage() {
  const [queryParams, setQueryParams] = useState<ConsignmentsQuery>({
    page: 1,
    limit: 10,
    q: '',
  });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['consignments', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchConsignments({ ...queryParams, q: debouncedSearchTerm }),
    placeholderData: (previousData) => previousData, // Giữ lại dữ liệu cũ khi đang fetch dữ liệu mới
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConsignment,
    onSuccess: () => {
      notification.success({ message: 'Xóa vận đơn thành công!' });
      queryClient.invalidateQueries({ queryKey: ['consignments'] });
    },
    onError: (error) => {
      notification.error({ message: 'Xóa vận đơn thất bại', description: error.message });
    },
  });

  // Tối ưu useEffect để chỉ chạy khi cần
  useEffect(() => {
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, queryParams.filters]);

  const handleOpenDrawer = (id?: number) => {
    setEditingConsignmentId(id || null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setEditingConsignmentId(null);
    setIsDrawerOpen(false);
  };
  
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Consignment> | SorterResult<Consignment>[],
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    
    setQueryParams(prev => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 10,
      filters,
      sortBy: singleSorter.field?.toString(),
      sortOrder: singleSorter.order === 'ascend' ? 'ASC' : singleSorter.order === 'descend' ? 'DESC' : undefined,
    }));
  };

  const columns: TableProps<Consignment>['columns'] = [
    { title: 'Mã Vận đơn (AWB)', dataIndex: 'awb', key: 'awb', sorter: true, render: (text) => <strong>{text}</strong> },
    { title: 'Điểm đi', dataIndex: 'origin', key: 'origin', sorter: true },
    { title: 'Điểm đến', dataIndex: 'destination', key: 'destination', sorter: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      filters: [
        { text: 'Chờ xử lý', value: 'PENDING' },
        { text: 'Đang vận chuyển', value: 'IN_TRANSIT' },
        { text: 'Đã giao', value: 'DELIVERED' },
        { text: 'Đã hủy', value: 'CANCELLED' },
      ],
      // Lọc ở phía client (nếu cần, nhưng chúng ta đang lọc ở server)
      // onFilter: (value, record) => record.status.indexOf(value as string) === 0,
      render: (status: string) => <Tag color="blue">{status?.toUpperCase()}</Tag>
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'), defaultSortOrder: 'descend' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleOpenDrawer(record.id)}>Sửa</a>
          <Popconfirm
            title="Xóa vận đơn"
            description={`Bạn có chắc muốn xóa vận đơn ${record.awb}?`}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa" cancelText="Hủy"
          >
            <a>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb items={[ { href: '/admin', title: <HomeOutlined /> }, { href: '/consignments', title: <><TruckOutlined /><span> Quản lý Vận đơn</span></> }, ]} />
      <Card
        title="Danh sách Vận đơn"
        extra={ <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}> Tạo Vận đơn mới </Button> }
      >
        <Flex justify="flex-end" style={{ marginBottom: 16 }}>
           <Input.Search
             placeholder="Tìm kiếm theo mã AWB..."
             value={queryParams.q || ''}
             onChange={(e) => setQueryParams(prev => ({ ...prev, q: e.target.value }))}
             style={{ width: 300 }}
             allowClear
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
          }}
          loading={isLoading}
          onChange={handleTableChange}
          bordered
          locale={{ emptyText: 'Không có vận đơn nào' }}
        />
        {isError && <p style={{ color: 'red' }}>Đã xảy ra lỗi: {error.message}</p>}
      </Card>

      <ConsignmentFormDrawer open={isDrawerOpen} onClose={handleCloseDrawer} consignmentId={editingConsignmentId} />
    </Space>
  );
}