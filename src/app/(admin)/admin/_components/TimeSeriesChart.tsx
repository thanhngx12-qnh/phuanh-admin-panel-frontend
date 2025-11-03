// src/app/(admin)/admin/_components/TimeSeriesChart.tsx
'use client';

import React, { useState } from 'react';
import { Card, Radio, Spin,Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Line } from '@ant-design/charts';
import api, { BackendResponse } from '@/lib/axios';

type TimeSeriesDataPoint = {
  date: string;
  count: number;
};

const fetchTimeSeriesData = async (metric: 'quotes' | 'consignments', range: 'last_7_days' | 'last_30_days'): Promise<TimeSeriesDataPoint[]> => {
  const response = await api.get<BackendResponse<TimeSeriesDataPoint[]>>('/stats/timeseries', {
    params: { metric, range },
  });
  return response.data.data;
};

export function TimeSeriesChart() {
  const [range, setRange] = useState<'last_7_days' | 'last_30_days'>('last_7_days');
  const [metric, setMetric] = useState<'quotes' | 'consignments'>('quotes');

  const { data, isLoading } = useQuery({
    queryKey: ['timeSeries', metric, range],
    queryFn: () => fetchTimeSeriesData(metric, range),
  });

  const config = {
    data: data || [],
    xField: 'date',
    yField: 'count',
    point: { size: 5, shape: 'diamond' },
    label: { style: { fill: '#aaa' } },
    tooltip: {
      formatter: (datum: any) => ({
        name: metric === 'quotes' ? 'Báo giá mới' : 'Vận đơn mới',
        value: `${datum.count} mục`,
      }),
    },
  };

  return (
    <Card
      title="Hoạt động theo thời gian"
      extra={
        <Space>
          <Radio.Group value={metric} onChange={(e) => setMetric(e.target.value)}>
            <Radio.Button value="quotes">Báo giá</Radio.Button>
            <Radio.Button value="consignments">Vận đơn</Radio.Button>
          </Radio.Group>
          <Radio.Group value={range} onChange={(e) => setRange(e.target.value)}>
            <Radio.Button value="last_7_days">7 ngày</Radio.Button>
            <Radio.Button value="last_30_days">30 ngày</Radio.Button>
          </Radio.Group>
        </Space>
      }
    >
      {isLoading ? <Spin /> : <Line {...config} />}
    </Card>
  );
}