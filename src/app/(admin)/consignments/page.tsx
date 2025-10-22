// src/app/(admin)/consignments/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, Button, Card, Flex, Input, Space, Table, Tag } from 'antd';
// --- SỬA LỖI Ở ĐÂY: Import thêm các type cần thiết ---
import type { TableProps, TablePaginationConfig } from 'antd';
import { PlusOutlined, HomeOutlined, TruckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { BackendResponse } from '@/lib/axios';
import { Consignment, PaginatedResponse } from '@/types';

const columns: TableProps<Consignment>['columns'] = [
  {
    title: 'Mã Vận đơn (AWB)',
    dataIndex: 'awb',
    key: 'awb',
    render: (text) => <strong>{text}</strong>,
  },
  {
    title: 'Điểm đi',
    dataIndex: 'origin',
    key: 'origin',
  },
  {
    title: 'Điểm đến',
    dataIndex: 'destination',
    key: 'destination',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => <Tag color="blue">{status.toUpperCase()}</Tag>,
  },
  {
    title: 'Ngày tạo',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
  },
  {
    title: 'Hành động',
    key: 'action',
    // --- SỬA LỖI Ở ĐÂY: Thêm tiền tố _ cho biến không sử dụng ---
    // Chúng ta sẽ cần record sau này, nên giữ lại với tiền tố _
    render: (_text, _record) => (
      <Space size="middle">
        <a>Sửa</a>
        <a>Xóa</a>
      </Space>
    ),
  },
];

const fetchConsignments = async (page: number, limit: number): Promise<PaginatedResponse<Consignment>> => {
  // Giả định backend có endpoint /consignments trả về danh sách phân trang
  // Nếu không, chúng ta sẽ cần tạo nó ở backend
  // Tạm thời, để test, chúng ta có thể dùng một endpoint khác nếu có
  const response = await api.get<BackendResponse<PaginatedResponse<Consignment>>>('/consignments/all', {
    params: { page, limit },
  });
  return response.data.data;
};

export default function ConsignmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['consignments', currentPage, pageSize],
    queryFn: () => fetchConsignments(currentPage, pageSize),
  });

  // --- SỬA LỖI Ở ĐÂY: Gõ kiểu (type) cho tham số pagination ---
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };
  
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/admin', title: <HomeOutlined /> },
          { title: <><TruckOutlined /><span> Quản lý Vận đơn</span></> },
        ]}
      />
      <Card
        title="Danh sách Vận đơn"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Tạo Vận đơn mới
          </Button>
        }
      >
        <Flex justify="flex-end" style={{ marginBottom: 16 }}>
           <Input.Search placeholder="Tìm kiếm theo mã AWB..." style={{ width: 300 }} />
        </Flex>
        
        <Table
          columns={columns}
          rowKey="id"
          dataSource={data?.data}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.total || 0,
          }}
          loading={isLoading}
          onChange={handleTableChange}
          bordered
        />
        {isError && <p style={{ color: 'red' }}>Đã xảy ra lỗi: {error.message}</p>}
      </Card>
    </Space>
  );
}