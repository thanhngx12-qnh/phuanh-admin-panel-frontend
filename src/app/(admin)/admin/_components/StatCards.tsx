// dir: src/app/(admin)/admin/_components/StatCards.tsx
'use client';

import React from 'react';
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { 
  FileSearchOutlined, 
  TruckOutlined, 
  UsergroupAddOutlined, 
  ReadOutlined 
} from '@ant-design/icons';
import api, { BackendResponse } from '@/lib/axios';

type SummaryStats = {
  newQuotesCount: number;
  processingConsignmentsCount: number;
  pendingApplicationsCount: number;
  totalPublishedNews: number;
};

const fetchSummaryStats = async (): Promise<SummaryStats> => {
  const response = await api.get<BackendResponse<SummaryStats>>('/stats/summary');
  return response.data.data;
};

export function StatCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['statsSummary'],
    queryFn: fetchSummaryStats,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  // --- Cấu hình các thẻ thống kê ---
  const statsConfig = [
    {
      title: 'Báo giá mới',
      value: data?.newQuotesCount || 0,
      icon: <FileSearchOutlined style={{ color: '#E60000' }} />, // Đỏ thương hiệu
      suffix: 'yêu cầu',
      color: '#E60000',
    },
    {
      title: 'Vận đơn đang xử lý',
      value: data?.processingConsignmentsCount || 0,
      icon: <TruckOutlined style={{ color: '#003366' }} />, // Xanh thương hiệu
      suffix: 'đơn',
      color: '#003366',
    },
    {
      title: 'Hồ sơ ứng tuyển',
      value: data?.pendingApplicationsCount || 0,
      icon: <UsergroupAddOutlined style={{ color: '#1890ff' }} />,
      suffix: 'hồ sơ',
      color: '#1890ff',
    },
    {
      title: 'Bài viết đã đăng',
      value: data?.totalPublishedNews || 0,
      icon: <ReadOutlined style={{ color: '#52c41a' }} />,
      suffix: 'bài',
      color: '#52c41a',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {statsConfig.map((item, index) => (
        <Col xs={24} sm={12} md={6} key={index}>
          <Card 
            // SỬA LỖI TẠI ĐÂY: Thay bordered={false} bằng variant="borderless"
            variant="borderless" 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderRadius: '12px'
            }}
          >
            <Statistic
              title={
                <Typography.Text type="secondary" strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>
                  {item.title}
                </Typography.Text>
              }
              value={item.value}
              valueStyle={{ color: item.color, fontWeight: 800, fontSize: '28px' }}
              prefix={item.icon}
              suffix={<span style={{ fontSize: '14px', marginLeft: '4px' }}>{item.suffix}</span>}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}