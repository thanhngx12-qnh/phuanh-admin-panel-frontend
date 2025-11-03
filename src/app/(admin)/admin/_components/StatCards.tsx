// src/app/(admin)/admin/_components/StatCards.tsx
'use client';

import React from 'react';
import { Card, Col, Row, Statistic, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
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
    return <Spin />;
  }

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card bordered={false}>
          <Statistic
            title="Báo giá mới"
            value={data?.newQuotesCount}
            valueStyle={{ color: '#3f8600' }}
            prefix={<ArrowUpOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false}>
          <Statistic
            title="Vận đơn đang xử lý"
            value={data?.processingConsignmentsCount}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ArrowDownOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false}>
          <Statistic title="Hồ sơ ứng tuyển" value={data?.pendingApplicationsCount} />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false}>
          <Statistic title="Bài viết đã đăng" value={data?.totalPublishedNews} />
        </Card>
      </Col>
    </Row>
  );
}