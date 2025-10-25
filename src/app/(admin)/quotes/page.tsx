// src/app/(admin)/quotes/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
// Bỏ import các type không cần thiết cho server-side sorting/filtering
// import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { HomeOutlined, FormOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { BackendResponse } from '@/lib/axios';
import { Quote } from '@/types'; // Vẫn dùng interface Quote
import { QuoteDetailModal } from './_components/QuoteDetailModal';

// --- SỬA LẠI HÀM FETCH ---
// API trả về một mảng Quote trực tiếp, không có phân trang
const fetchQuotes = async (): Promise<Quote[]> => {
  // Gọi đến endpoint GET /quotes
  const response = await api.get<BackendResponse<Quote[]>>('/quotes');
  return response.data.data;
};

const deleteQuote = async (id: number): Promise<void> => {
  // Giả định endpoint xóa vẫn là /quotes/:id hoặc cần sửa thành /quotes/:id
  // Tạm thời giữ nguyên, nếu có lỗi 404 khi xóa, chúng ta sẽ sửa lại đây
  await api.delete(`/quotes/${id}`);
};

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['quotes'], // queryKey đơn giản hơn vì không có params
    queryFn: fetchQuotes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      notification.success({ message: 'Xóa báo giá thành công!' });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error) => notification.error({ message: 'Xóa thất bại', description: error.message }),
  });
  
  const handleOpenModal = (id: number) => {
    setSelectedQuoteId(id);
    setIsModalOpen(true);
  };
  
  // --- LỌC DỮ LIỆU Ở CLIENT-SIDE ---
  const filteredData = quotesData?.filter(quote => 
    quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const columns: TableProps<Quote>['columns'] = [
    { title: 'Tên Khách hàng', dataIndex: 'customerName', key: 'customerName', sorter: (a, b) => a.customerName.localeCompare(b.customerName) },
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => a.email.localeCompare(b.email) },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      filters: [
        { text: 'Chờ xử lý', value: 'PENDING' }, { text: 'Đã liên hệ', value: 'CONTACTED' },
        { text: 'Thành công', value: 'APPROVED' }, { text: 'Thất bại', value: 'REJECTED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => <Tag color={status === 'PENDING' ? 'orange' : status === 'APPROVED' ? 'green' : 'blue'}>{status?.toUpperCase()}</Tag>
    },
    { title: 'Ngày gửi', dataIndex: 'createdAt', key: 'createdAt', sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(), defaultSortOrder: 'descend', render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleOpenModal(record.id)}>Xem / Sửa</a>
          <Popconfirm title="Xóa báo giá" description="Bạn có chắc muốn xóa yêu cầu này?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy">
            <a>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb items={[ { href: '', title: <HomeOutlined /> }, { href: '/quotes', title: <><FormOutlined /><span> Quản lý Báo giá</span></> }, ]} />
      <Card title="Danh sách Yêu cầu Báo giá">
        <Flex justify="flex-end" style={{ marginBottom: 16 }}>
          <Input.Search placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 300 }} allowClear />
        </Flex>
        <Table
          columns={columns}
          rowKey="id"
          dataSource={filteredData} // <-- Sử dụng dữ liệu đã được lọc ở client
          // Phân trang sẽ do Ant Design tự xử lý ở client-side
          pagination={{ pageSize: 10 }}
          loading={isLoading}
          // onChange không cần thiết cho việc fetch lại dữ liệu
          bordered
          locale={{ emptyText: 'Không có yêu cầu báo giá nào' }}
        />
      </Card>
      <QuoteDetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} quoteId={selectedQuoteId} />
    </Space>
  );
}