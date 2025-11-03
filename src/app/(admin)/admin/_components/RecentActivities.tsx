// src/app/(admin)/admin/_components/RecentActivities.tsx
'use client';

import React from 'react';
import { Card, Col, Row, Spin, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api, { BackendResponse } from '@/lib/axios';
import { Quote, Consignment } from '@/types';

dayjs.extend(relativeTime);

type RecentActivitiesData = {
  recentQuotes: Quote[];
  recentConsignments: Consignment[];
};

const fetchRecentActivities = async (): Promise<RecentActivitiesData> => {
  const response = await api.get<BackendResponse<RecentActivitiesData>>('/stats/recent-activities');
  return response.data.data;
};

export function RecentActivities() {
  const { data, isLoading } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: fetchRecentActivities,
  });

  const quoteColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      render: (text: string, record: Quote) => <Link href={`/quotes`}>{text}</Link>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: string) => <Tag color="orange">{status}</Tag>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      render: (date: string) => dayjs(date).fromNow(),
    },
  ];

  const consignmentColumns = [
    {
      title: 'Mã Vận đơn (AWB)',
      dataIndex: 'awb',
      render: (text: string, record: Consignment) => <Link href={`/consignments`}>{text}</Link>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      render: (date: string) => dayjs(date).fromNow(),
    },
  ];

  return (
    <Spin spinning={isLoading}>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Yêu cầu Báo giá Mới nhất">
            <Table
              columns={quoteColumns}
              dataSource={data?.recentQuotes}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Vận đơn Cập nhật Gần đây">
            <Table
              columns={consignmentColumns}
              dataSource={data?.recentConsignments}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}