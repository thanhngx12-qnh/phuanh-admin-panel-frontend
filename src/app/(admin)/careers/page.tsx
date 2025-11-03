// src/app/(admin)/careers/page.tsx
'use client';

import React from 'react';
import { Breadcrumb, Card, Space, Tabs } from 'antd';
import { HomeOutlined, ReadOutlined } from '@ant-design/icons';
import { JobPostingsTab } from './_components/JobPostingsTab';
import { JobApplicationsTab } from './_components/JobApplicationsTab';

export default function CareersPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/admin', title: <HomeOutlined /> },
          { href: '/careers', title: <><ReadOutlined /><span> Quản lý Tuyển dụng</span></> },
        ]}
      />
      <Card>
        <Tabs defaultActiveKey="postings">
          <Tabs.TabPane tab="Tin Tuyển dụng" key="postings">
            <JobPostingsTab />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Hồ sơ Ứng tuyển" key="applications">
            <JobApplicationsTab />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </Space>
  );
}