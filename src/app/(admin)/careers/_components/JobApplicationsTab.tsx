// src/app/(admin)/careers/_components/JobApplicationsTab.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Flex, Input, Popconfirm, Space, Table, Tooltip } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';
import api, { BackendResponse } from '@/lib/axios';
import { JobApplication, PaginatedResponse } from '@/types';

interface ApplicationsQuery {
  page: number;
  limit: number;
  q?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

type ApiParams = {
  page: number;
  limit: number;
  q?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

const fetchApplications = async (query: ApplicationsQuery): Promise<PaginatedResponse<JobApplication>> => {
  const params: ApiParams = {
    page: query.page,
    limit: query.limit,
    q: query.q,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
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

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<JobApplication> | SorterResult<JobApplication>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setQueryParams((prev: ApplicationsQuery) => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 10,
      sortBy: s.field?.toString(),
      sortOrder: s.order === 'ascend' ? 'ASC' : s.order === 'descend' ? 'DESC' : undefined,
    }));
  };

  // Hàm lấy phần mở rộng file từ URL
  const getFileExtension = (url: string): string => {
    try {
      // Lấy phần sau dấu chấm cuối cùng trước khi có query params
      const basePath = url.split('?')[0];
      const parts = basePath.split('.');
      if (parts.length > 1) {
        const extension = parts.pop()?.toLowerCase();
        // Chỉ trả về các extension hợp lệ
        if (extension && ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(extension)) {
          return extension;
        }
      }
    } catch (error) {
      console.error('Error getting file extension:', error);
    }
    return 'pdf'; // Mặc định là pdf
  };

  // Hàm tạo URL download cho Cloudinary
  const getCloudinaryDownloadUrl = (url: string, filename?: string): string => {
    if (!url.includes('cloudinary.com')) return url;
    
    try {
      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;
      
      // Tạo filename an toàn
      const safeFilename = filename 
        ? filename.replace(/[^a-zA-Z0-9_\-\u00C0-\u1EF9]/g, '_')
        : 'download';
      
      // Thêm transformation fl_attachment với filename
      // Định dạng: /upload/fl_attachment:filename/...
      return `${parts[0]}/upload/fl_attachment:${safeFilename}/${parts[1]}`;
    } catch (error) {
      console.error('Error generating download URL:', error);
      return url;
    }
  };

  // Hàm xử lý download file
  const handleDownload = (cvPath: string, record: JobApplication) => {
    if (!cvPath) {
      notification.warning({ message: 'Không có file CV để tải xuống' });
      return;
    }

    try {
      // Tạo tên file gợi ý
      const extension = getFileExtension(cvPath);
      const suggestedFilename = `CV_${record.applicantName.replace(/\s+/g, '_')}.${extension}`;
      
      // Tạo URL download
      const downloadUrl = getCloudinaryDownloadUrl(cvPath, suggestedFilename);
      
      console.log('Download URL:', downloadUrl); // Debug log
      
      // Tạo thẻ a ẩn để download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = suggestedFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Thêm vào DOM, click và xóa
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notification.success({ 
        message: 'Đang tải CV...', 
        description: `File ${suggestedFilename} đang được tải xuống` 
      });
    } catch (error) {
      console.error('Download error:', error);
      notification.error({ 
        message: 'Lỗi tải file', 
        description: 'Không thể tải file CV. Vui lòng thử lại.' 
      });
    }
  };

  const columns: TableProps<JobApplication>['columns'] = [
    { 
      title: 'Tên Ứng viên', 
      dataIndex: 'applicantName', 
      key: 'applicantName', 
      sorter: true 
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email', 
      sorter: true 
    },
    { 
      title: 'Số điện thoại', 
      dataIndex: 'phone', 
      key: 'phone' 
    },
    {
      title: 'Vị trí Ứng tuyển',
      dataIndex: 'jobPosting',
      key: 'jobPosting',
      render: (jobPosting) => jobPosting?.title || <span style={{ color: '#999' }}>Không rõ</span>,
    },
    {
      title: 'CV',
      dataIndex: 'cvPath',
      key: 'cvPath',
      render: (cvPath: string, record: JobApplication) => {
        if (!cvPath) {
          return <span style={{ color: '#999' }}>Không có CV</span>;
        }
        
        const extension = getFileExtension(cvPath);
        const displayExtension = extension.toUpperCase();
        
        return (
          <Space>
            <Tooltip title={`Tải CV (${displayExtension}) về máy`}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => handleDownload(cvPath, record)}
              >
                Tải CV
              </Button>
            </Tooltip>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {displayExtension}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      sorter: true,
      defaultSortOrder: 'descend',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Xóa hồ sơ"
            description="Bạn có chắc muốn xóa hồ sơ ứng tuyển này? Hành động này không thể hoàn tác."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
          value={queryParams.q || ''}
          onChange={(e) => setQueryParams((prev: ApplicationsQuery) => ({ ...prev, q: e.target.value, page: 1 }))}
          style={{ width: 350 }}
          allowClear
          enterButton
        />
        
        <div>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Tổng số: <strong>{data?.total || 0}</strong> hồ sơ
          </span>
        </div>
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
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} hồ sơ`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        loading={isLoading || deleteMutation.isPending}
        onChange={handleTableChange}
        bordered
        scroll={{ x: 1000 }}
        locale={{ 
          emptyText: 'Chưa có hồ sơ ứng tuyển nào' 
        }}
      />
    </>
  );
}