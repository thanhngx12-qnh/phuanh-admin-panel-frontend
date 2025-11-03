// src/app/(admin)/admin/_components/CategoricalChart.tsx
'use client';

import React from 'react';
import { Card, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Pie } from '@ant-design/charts';
import api, { BackendResponse } from '@/lib/axios';

type CategoricalDataPoint = {
  category: string;
  value: number;
};

const fetchCategoricalData = async (metric: 'consignment_status' | 'quote_status'): Promise<CategoricalDataPoint[]> => {
  const response = await api.get<BackendResponse<CategoricalDataPoint[]>>('/stats/categorical', {
    params: { metric },
  });
  return response.data.data;
};

export function CategoricalChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['categorical', 'consignment_status'],
    queryFn: () => fetchCategoricalData('consignment_status'),
  });

  const config = {
    appendPadding: 10,
    data: data || [],
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    label: {
      type: 'inner',
      offset: '-50%',
      // --- SỬA LỖI Ở ĐÂY: Sử dụng hàm callback thay vì string ---
      content: (data: any) => {
        // Kiểm tra xem data và data.value có tồn tại không
        if (data && typeof data.value === 'number') {
          return `${data.value}`;
        }
        return ''; // Trả về chuỗi rỗng nếu không có dữ liệu
      },
      style: {
        textAlign: 'center',
        fontSize: 14,
        fill: '#fff',
      },
    },
    interactions: [{ type: 'element-active' }],
    legend: {
      position: 'right' as const,
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.category,
        value: `${datum.value} vận đơn`,
      }),
    },
  };

  return (
    <Card title="Phân loại Trạng thái Vận đơn" style={{ height: '100%' }}>
      {isLoading ? <Spin /> : <Pie {...config} />}
    </Card>
  );
}