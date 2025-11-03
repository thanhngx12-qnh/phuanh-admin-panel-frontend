// src/app/(admin)/admin/page.tsx
'use client';

import React from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { StatCards } from './_components/StatCards';
import { TimeSeriesChart } from './_components/TimeSeriesChart';
import { CategoricalChart } from './_components/CategoricalChart';
import { RecentActivities } from './_components/RecentActivities';

export default function DashboardPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={2}>Tổng quan</Typography.Title>
      
      {/* Hàng 1: Các thẻ thống kê KPI */}
      <StatCards />

      {/* Hàng 2: Biểu đồ */}
      <Row gutter={16}>
        <Col span={16}>
          <TimeSeriesChart />
        </Col>
        <Col span={8}>
          <CategoricalChart />
        </Col>
      </Row>

      {/* Hàng 3: Bảng hoạt động gần đây */}
      <RecentActivities />
    </Space>
  );
}