// src/app/(admin)/quotes/_components/QuoteDetailModal.tsx
'use client';

import React, { useEffect } from 'react';
import { App, Button, Form, Input, Modal, Select, Space, Spin, Typography } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BackendResponse } from '@/lib/axios';
import { Quote } from '@/types';
import dayjs from 'dayjs';

interface QuoteDetailModalProps {
  open: boolean;
  onClose: () => void;
  quoteId: number | null;
}

const fetchQuoteById = async (id: number): Promise<Quote> => {
  const response = await api.get<BackendResponse<Quote>>(`/quotes/${id}`);
  return response.data.data;
};

const updateQuote = async ({ id, data }: { id: number; data: Partial<Quote> }): Promise<Quote> => {
  const response = await api.patch<BackendResponse<Quote>>(`/quotes/${id}`, data);
  return response.data.data;
};

export function QuoteDetailModal({ open, onClose, quoteId }: QuoteDetailModalProps) {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => fetchQuoteById(quoteId!),
    enabled: !!quoteId,
  });

  const updateMutation = useMutation({
    mutationFn: updateQuote,
    onSuccess: () => {
      notification.success({ message: 'Cập nhật báo giá thành công!' });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      onClose();
    },
    onError: (error) => {
      notification.error({ message: 'Cập nhật thất bại', description: error.message });
    },
  });

  useEffect(() => {
    if (quote) {
      form.setFieldsValue({
        status: quote.status,
        adminNotes: quote.adminNotes,
      });
    } else {
      form.resetFields();
    }
  }, [quote, form]);

  const handleFinish = (values: { status: string; adminNotes: string }) => {
    updateMutation.mutate({ id: quoteId!, data: values });
  };
  
  const getServiceTitle = (service: Quote['service'], locale = 'vi') => {
    return service?.translations?.find(t => t.locale === locale)?.title || 'Không rõ';
  }

  return (
    <Modal
      title={`Chi tiết Yêu cầu #${quoteId}`}
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="back" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="submit" type="primary" loading={updateMutation.isPending} onClick={() => form.submit()}>
          Lưu thay đổi
        </Button>,
      ]}
    >
      <Spin spinning={isLoading}>
        {quote && (
          <div>
            <Typography.Paragraph><strong>Tên khách hàng:</strong> {quote.customerName}</Typography.Paragraph>
            <Typography.Paragraph><strong>Email:</strong> {quote.email}</Typography.Paragraph>
            <Typography.Paragraph><strong>Số điện thoại:</strong> {quote.phone}</Typography.Paragraph>
            <Typography.Paragraph><strong>Dịch vụ quan tâm:</strong> {getServiceTitle(quote.service)}</Typography.Paragraph>
            <Typography.Paragraph><strong>Chi tiết:</strong> {quote.details}</Typography.Paragraph>
            <Typography.Paragraph><strong>Ngày gửi:</strong> {dayjs(quote.createdAt).format('DD/MM/YYYY HH:mm')}</Typography.Paragraph>
            <hr style={{ margin: '16px 0' }}/>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="PENDING">Chờ xử lý</Select.Option>
                  <Select.Option value="CONTACTED">Đã liên hệ</Select.Option>
                  <Select.Option value="APPROVED">Thành công</Select.Option>
                  <Select.Option value="REJECTED">Thất bại</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="adminNotes" label="Ghi chú của Admin">
                <Input.TextArea rows={4} placeholder="Thêm ghi chú nội bộ..."/>
              </Form.Item>
            </Form>
          </div>
        )}
      </Spin>
    </Modal>
  );
}