// src/app/(admin)/consignments/_components/ConsignmentFormDrawer.tsx
'use client';

import React, { useEffect } from 'react';
// --- SỬA LỖI Ở ĐÂY: Import thêm Typography ---
import { Button, Drawer, Form, Input, Select, Space, Spin, App, Typography } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import api, { BackendResponse } from '@/lib/axios';
import { Consignment, TrackingEvent } from '@/types';

interface ConsignmentFormDrawerProps {
  open: boolean;
  onClose: () => void;
  consignmentId?: number | null;
}

type ConsignmentFormData = Omit<Consignment, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> & { // <-- Loại bỏ metadata khỏi kiểu form
  events: Partial<TrackingEvent>[];
};

const fetchConsignmentById = async (id: number): Promise<Consignment> => {
  const response = await api.get<BackendResponse<Consignment>>(`/admin/consignments/${id}`);
  return response.data.data;
};

const createConsignment = async (data: ConsignmentFormData): Promise<Consignment> => {
  const response = await api.post<BackendResponse<Consignment>>('/admin/consignments', data);
  return response.data.data;
};

const updateConsignment = async ({ id, data }: { id: number; data: ConsignmentFormData }): Promise<Consignment> => {
  const response = await api.patch<BackendResponse<Consignment>>(`/admin/consignments/${id}`, data);
  return response.data.data;
};


export function ConsignmentFormDrawer({ open, onClose, consignmentId }: ConsignmentFormDrawerProps) {
  const [form] = Form.useForm<ConsignmentFormData>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  const isEditMode = !!consignmentId;

  const { data: editingConsignment, isLoading } = useQuery({
    queryKey: ['consignment', consignmentId],
    queryFn: () => fetchConsignmentById(consignmentId!),
    enabled: isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: createConsignment,
    onSuccess: () => {
      notification.success({ message: 'Tạo vận đơn thành công!' });
      queryClient.invalidateQueries({ queryKey: ['consignments'] });
      onClose();
    },
    onError: (error) => {
      notification.error({ message: 'Tạo vận đơn thất bại', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateConsignment,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật vận đơn thành công!' });
      queryClient.invalidateQueries({ queryKey: ['consignments'] });
      queryClient.invalidateQueries({ queryKey: ['consignment', consignmentId] });
      onClose();
    },
    onError: (error) => {
      notification.error({ message: 'Cập nhật vận đơn thất bại', description: error.message });
    },
  });

  // --- SỬA LỖI Ở ĐÂY ---
  useEffect(() => {
    if (isEditMode && editingConsignment) {
      // Tạo một bản sao của object và loại bỏ trường metadata trước khi set vào form
      const { metadata, ...formData } = editingConsignment;
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
      form.setFieldsValue({ events: [{ status: '', location: '' }] });
    }
  }, [editingConsignment, isEditMode, form]);

  const handleFinish = (values: ConsignmentFormData) => {
    if (isEditMode) {
      updateMutation.mutate({ id: consignmentId!, data: values });
    } else {
      createMutation.mutate(values);
    }
  };


  return (
    <Drawer
      title={isEditMode ? 'Chỉnh sửa Vận đơn' : 'Tạo Vận đơn mới'}
      width={720}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={() => form.submit()} type="primary" loading={createMutation.isPending || updateMutation.isPending}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="awb" label="Mã Vận đơn (AWB)" rules={[{ required: true, message: 'Vui lòng nhập mã AWB!' }]}>
            <Input placeholder="Ví dụ: QMSB123456" />
          </Form.Item>
          <Form.Item name="origin" label="Điểm đi" rules={[{ required: true, message: 'Vui lòng nhập điểm đi!' }]}>
            <Input placeholder="Ví dụ: Hà Nội" />
          </Form.Item>
          <Form.Item name="destination" label="Điểm đến" rules={[{ required: true, message: 'Vui lòng nhập điểm đến!' }]}>
            <Input placeholder="Ví dụ: Bằng Tường" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}>
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="PENDING">Chờ xử lý</Select.Option>
              <Select.Option value="IN_TRANSIT">Đang vận chuyển</Select.Option>
              <Select.Option value="DELIVERED">Đã giao</Select.Option>
              <Select.Option value="CANCELLED">Đã hủy</Select.Option>
            </Select>
          </Form.Item>

          <Typography.Title level={5} style={{ marginTop: 32 }}>Sự kiện Tracking</Typography.Title>
          <Form.List name="events">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }} align="baseline">
                    <Form.Item {...restField} name={[name, 'status']} rules={[{ required: true, message: 'Thiếu trạng thái!' }]}>
                      <Input placeholder="Trạng thái" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'location']} rules={[{ required: true, message: 'Thiếu vị trí!' }]}>
                      <Input placeholder="Vị trí" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 8 }}/>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm sự kiện
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Spin>
    </Drawer>
  );
}