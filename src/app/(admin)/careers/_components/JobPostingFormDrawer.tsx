// src/app/(admin)/careers/_components/JobPostingFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space, Spin } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BackendResponse } from '@/lib/axios';
import { JobPosting } from '@/types';
import { Editor } from '@/components/Editor';

interface JobPostingFormDrawerProps { open: boolean; onClose: () => void; jobPostingId?: number | null; }
type JobPostingFormData = Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>;

const fetchJobPostingById = async (id: number): Promise<JobPosting> => {
  const response = await api.get<BackendResponse<JobPosting>>(`/careers/postings/${id}`);
  return response.data.data;
};

const createJobPosting = async (data: JobPostingFormData): Promise<JobPosting> => {
  const response = await api.post<BackendResponse<JobPosting>>('/careers/postings', data);
  return response.data.data;
};

const updateJobPosting = async ({ id, data }: { id: number; data: Partial<JobPostingFormData> }): Promise<JobPosting> => {
  const response = await api.patch<BackendResponse<JobPosting>>(`/careers/postings/${id}`, data);
  return response.data.data;
};

export function JobPostingFormDrawer({ open, onClose, jobPostingId }: JobPostingFormDrawerProps) {
  const [form] = Form.useForm<JobPostingFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const isEditMode = !!jobPostingId;

  const { data: editingData, isLoading } = useQuery({
    queryKey: ['jobPosting', jobPostingId],
    queryFn: () => fetchJobPostingById(jobPostingId!),
    enabled: isEditMode,
  });

  // --- SỬA LỖI #1: Tách thành hai mutation riêng biệt ---
  const createMutation = useMutation({
    mutationFn: createJobPosting,
    onSuccess: () => {
      notification.success({ message: 'Tạo tin tuyển dụng thành công!' });
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      onClose();
    },
    onError: (error: Error) => { notification.error({ message: 'Tạo thất bại', description: error.message }); },
  });

  const updateMutation = useMutation({
    mutationFn: updateJobPosting,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật tin tuyển dụng thành công!' });
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      onClose();
    },
    onError: (error: Error) => { notification.error({ message: 'Cập nhật thất bại', description: error.message }); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editingData) {
      form.setFieldsValue(editingData);
    } else {
      form.resetFields();
    }
  }, [editingData, open, form]);

  const handleFinish = (values: JobPostingFormData) => {
    if (isEditMode) {
      updateMutation.mutate({ id: jobPostingId!, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Chỉnh sửa Tin tuyển dụng' : 'Tạo Tin tuyển dụng mới'}
      width={720} onClose={onClose} open={open} destroyOnClose
      extra={ <Space> <Button onClick={onClose}>Hủy</Button> <Button onClick={form.submit} type="primary" loading={isPending}> Lưu </Button> </Space> }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item label="Vị trí tuyển dụng" name="title" rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Địa điểm" name="location" rules={[{ required: true, message: 'Vui lòng nhập địa điểm!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} initialValue="OPEN">
            <Select>
              <Select.Option value="OPEN">Đang tuyển</Select.Option>
              <Select.Option value="CLOSED">Đã đóng</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Mô tả công việc" name="description" rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}>
            <Editor />
          </Form.Item>
          <Form.Item label="Yêu cầu ứng viên" name="requirements" rules={[{ required: true, message: 'Vui lòng nhập yêu cầu!' }]}>
            <Editor />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
}