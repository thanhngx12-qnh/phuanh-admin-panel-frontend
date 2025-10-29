// src/app/(admin)/users/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Breadcrumb, Button, Card, Flex, Input, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { PlusOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { User, PaginatedResponse } from '@/types';
import { UserFormDrawer } from './_components/UserFormDrawer';
import { ResetPasswordModal } from './_components/ResetPasswordModal';

interface UsersQuery { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; filters?: Record<string, FilterValue | null>; }
type ApiParams = { page: number; limit: number; q?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; role?: string; };

const fetchUsers = async (query: UsersQuery): Promise<PaginatedResponse<User>> => {
  const params: ApiParams = { page: query.page, limit: query.limit, q: query.q, sortBy: query.sortBy, sortOrder: query.sortOrder };
  const roleFilter = query.filters?.role;
  if (roleFilter && Array.isArray(roleFilter)) { params.role = roleFilter.join(','); }
  const response = await api.get<BackendResponse<PaginatedResponse<User>>>('/admin/users', { params });
  return response.data.data;
};

const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

export default function UsersPage() {
  const [queryParams, setQueryParams] = useState<UsersQuery>({ page: 1, limit: 10, q: '' });
  const [debouncedSearchTerm] = useDebounce(queryParams.q, 500);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { ...queryParams, q: debouncedSearchTerm }],
    queryFn: () => fetchUsers({ ...queryParams, q: debouncedSearchTerm }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { notification.success({ message: 'Xóa người dùng thành công!' }); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (error: Error) => notification.error({ message: 'Xóa thất bại', description: error.message }),
  });

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<User> | SorterResult<User>[],) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev: UsersQuery) => ({ ...prev, page: pagination.current || 1, limit: pagination.pageSize || 10, filters, sortBy: s.field?.toString(), sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined, }));
  };

  const openDrawer = (id?: number) => { setEditingUserId(id || null); setIsDrawerOpen(true); };
  const closeDrawer = () => { setIsDrawerOpen(false); setEditingUserId(null); };

  const openModal = (user: User) => { setSelectedUser(user); setIsModalOpen(true); };
  // --- SỬA LỖI #2: Sửa thành setIsModalOpen(false) ---
  const closeModal = () => { setIsModalOpen(false); setSelectedUser(null); };
  
  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'ADMIN': return 'red'; case 'CONTENT_MANAGER': return 'purple';
      case 'SALES': return 'green'; case 'OPS': return 'blue';
      default: return 'default';
    }
  };

  const columns: TableProps<User>['columns'] = [
    { title: 'Họ và tên', dataIndex: 'fullName', key: 'fullName', sorter: true },
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
    {
      title: 'Vai trò', dataIndex: 'role', key: 'role', sorter: true,
      filters: [ { text: 'Admin', value: 'ADMIN' }, { text: 'Content Manager', value: 'CONTENT_MANAGER' }, { text: 'Sales', value: 'SALES' }, { text: 'Ops', value: 'OPS' }, ],
      render: (role: User['role']) => <Tag color={getRoleColor(role)}>{role}</Tag>
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', sorter: true, defaultSortOrder: 'descend', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    {
      title: 'Hành động', key: 'action',
      render: (_, record: User) => (
        <Space size="middle">
          <a onClick={() => openDrawer(record.id)}>Sửa</a>
          <Popconfirm title="Xóa người dùng" description={`Bạn có chắc muốn xóa ${record.fullName}?`} onConfirm={() => deleteMutation.mutate(record.id)} disabled={record.id === 1} okText="Xóa" cancelText="Hủy">
            <a style={{ color: record.id === 1 ? 'grey' : 'red', cursor: record.id === 1 ? 'not-allowed' : 'pointer' }}>Xóa</a>
          </Popconfirm>
          {/* --- SỬA LỖI #3: Gỡ bỏ 'disabled' và xử lý logic trong onClick --- */}
          <a
            onClick={() => { if (record.id !== 1) openModal(record); }}
            style={{ color: record.id === 1 ? 'grey' : undefined, cursor: record.id === 1 ? 'not-allowed' : 'pointer' }}
          >
            Reset Mật khẩu
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb items={[ { href: '/admin', title: <HomeOutlined /> }, { href: '/users', title: <><UserOutlined /><span> Quản lý Người dùng</span></> }, ]} />
        <Card title="Danh sách Người dùng" extra={ <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}> Thêm Người dùng </Button> }>
          <Flex justify="flex-end" style={{ marginBottom: 16 }}>
            <Input.Search placeholder="Tìm theo tên hoặc email..." value={queryParams.q} onChange={(e) => setQueryParams((prev: UsersQuery) => ({ ...prev, q: e.target.value, page: 1 }))} style={{ width: 300 }} allowClear />
          </Flex>
          <Table columns={columns} rowKey="id" dataSource={data?.data} pagination={{ current: data?.page || 1, pageSize: data?.limit || 10, total: data?.total || 0 }} loading={isLoading} onChange={handleTableChange} bordered locale={{ emptyText: 'Không có người dùng nào' }} />
        </Card>
      </Space>
      <UserFormDrawer open={isDrawerOpen} onClose={closeDrawer} userId={editingUserId} />
      <ResetPasswordModal open={isModalOpen} onClose={closeModal} user={selectedUser} />
    </>
  );
}