// src/app/(admin)/consignments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, Button, Card, Flex, Input, Space, Table, Tag } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import { PlusOutlined, HomeOutlined, TruckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce'; // Import hook use-debounce
import api, { BackendResponse } from '@/lib/axios';
import { Consignment, PaginatedResponse } from '@/types';

const columns: TableProps<Consignment>['columns'] = [
  { title: 'Mã Vận đơn (AWB)', dataIndex: 'awb', key: 'awb', render: (text) => <strong>{text}</strong> },
  { title: 'Điểm đi', dataIndex: 'origin', key: 'origin' },
  { title: 'Điểm đến', dataIndex: 'destination', key: 'destination' },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color="blue">{status?.toUpperCase()}</Tag> },
  { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm') },
  { title: 'Hành động', key: 'action', render: (_text, _record) => ( <Space size="middle"><a>Sửa</a><a>Xóa</a></Space>), },
];

// --- SỬA LẠI HÀM FETCH ĐỂ GỌI API THẬT ---
const fetchConsignments = async (
  page: number,
  limit: number,
  searchTerm: string
): Promise<PaginatedResponse<Consignment>> => {
  const response = await api.get<BackendResponse<PaginatedResponse<Consignment>>>('/admin/consignments', {
    params: { page, limit, q: searchTerm }, // Gửi thêm param 'q' cho tìm kiếm
  });
  return response.data.data;
};

export default function ConsignmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sử dụng useDebounce để trì hoãn việc gọi API khi người dùng đang gõ
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // 500ms delay

  const { data, isLoading, isError, error } = useQuery({
    // queryKey bây giờ sẽ bao gồm cả debouncedSearchTerm
    queryKey: ['consignments', currentPage, pageSize, debouncedSearchTerm],
    queryFn: () => fetchConsignments(currentPage, pageSize, debouncedSearchTerm),
  });
  
  // Reset về trang 1 mỗi khi người dùng thực hiện tìm kiếm mới
  useEffect(() => {
    if (debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);


  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };
  
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/admin', title: <HomeOutlined /> },
          { href: '/consignments', title: <><TruckOutlined /><span> Quản lý Vận đơn</span></> },
        ]}
      />
      <Card
        title="Danh sách Vận đơn"
        extra={ <Button type="primary" icon={<PlusOutlined />}> Tạo Vận đơn mới </Button> }
      >
        <Flex justify="flex-end" style={{ marginBottom: 16 }}>
           <Input.Search
             placeholder="Tìm kiếm theo mã AWB..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             style={{ width: 300 }}
             allowClear
           />
        </Flex>
        
        <Table
          columns={columns}
          rowKey="id"
          dataSource={data?.data}
          pagination={{
            current: data?.page || currentPage, // Ưu tiên page từ API trả về
            pageSize: pageSize,
            total: data?.total || 0,
          }}
          loading={isLoading}
          onChange={handleTableChange}
          bordered
          locale={{ emptyText: 'Không có vận đơn nào' }}
        />
        {isError && <p style={{ color: 'red' }}>Đã xảy ra lỗi: {error.message}</p>}
      </Card>
    </Space>
  );
}