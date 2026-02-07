import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker, AreaChart, BarChart } from 'antd';
import moment, { Moment } from 'moment';

const { RangePicker } = DatePicker;

interface MetricData {
  timestamp: string;
  value: number;
}

interface ResourceMetrics {
  cpu: MetricData[];
  memory: MetricData[];
  disk: MetricData[];
  network: MetricData[];
}

export const ResourceMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [metrics, setMetrics] = useState<ResourceMetrics>({
    cpu: generateMockData(60, 60, 80),
    memory: generateMockData(60, 70, 90),
    disk: generateMockData(60, 40, 50),
    network: generateMockData(60, 1000, 5000),
  });

  function generateMockData(points: number, min: number, max: number): MetricData[] {
    const data: MetricData[] = [];
    const now = Date.now();
    for (let i = points; i >= 0; i--) {
      data.push({
        timestamp: new Date(now - i * 60000).toISOString(),
        value: Math.floor(Math.random() * (max - min) + min),
      });
    }
    return data;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k**i).toFixed(2))  } ${  sizes[i]}`;
  };

  const chartData = metrics.cpu.map((item, index) => ({
    time: moment(item.timestamp).format('HH:mm'),
    cpu: item.value,
    memory: metrics.memory[index]?.value || 0,
    disk: metrics.disk[index]?.value || 0,
  }));

  return (
    <div className="resource-metrics">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <RangePicker
            showTime
            style={{ width: '100%' }}
            defaultValue={[moment().subtract(1, 'hour'), moment()]}
          />
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { value: '15m', label: 'Last 15 minutes' },
              { value: '1h', label: 'Last 1 hour' },
              { value: '6h', label: 'Last 6 hours' },
              { value: '24h', label: 'Last 24 hours' },
              { value: '7d', label: 'Last 7 days' },
            ]}
          />
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            defaultValue="all"
            options={[
              { value: 'all', label: 'All Resources' },
              { value: 'cpu', label: 'CPU Only' },
              { value: 'memory', label: 'Memory Only' },
              { value: 'disk', label: 'Disk Only' },
              { value: 'network', label: 'Network Only' },
            ]}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="CPU Usage (Current)"
              value={metrics.cpu[metrics.cpu.length - 1]?.value || 0}
              suffix="%"
              valueStyle={{
                color: (metrics.cpu[metrics.cpu.length - 1]?.value || 0) > 80 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Memory Usage (Current)"
              value={metrics.memory[metrics.memory.length - 1]?.value || 0}
              suffix="%"
              valueStyle={{
                color: (metrics.memory[metrics.memory.length - 1]?.value || 0) > 80 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Disk Usage (Current)"
              value={metrics.disk[metrics.disk.length - 1]?.value || 0}
              suffix="%"
              valueStyle={{
                color: (metrics.disk[metrics.disk.length - 1]?.value || 0) > 80 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Network In (Current)"
              value={metrics.network[metrics.network.length - 1]?.value || 0}
              suffix="KB/s"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Resource Utilization Over Time">
            <div style={{ height: 300 }}>
              <AreaChart
                data={chartData}
                xField="time"
                yField="cpu"
                seriesFields={['cpu', 'memory', 'disk']}
                smooth
                legend={{
                  position: 'top',
                }}
                xAxis={{
                  label: {
                    formatter: (value: string) => value,
                  },
                }}
                yAxis={{
                  label: {
                    formatter: (value: string) => `${value}%`,
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Resource Distribution by Node Pool">
            <BarChart
              data={[
                { pool: 'General', cpu: 65, memory: 72, disk: 45 },
                { pool: 'Compute', cpu: 85, memory: 78, disk: 30 },
                { pool: 'Memory', cpu: 45, memory: 88, disk: 25 },
                { pool: 'Spot', cpu: 35, memory: 50, disk: 20 },
              ]}
              xField="pool"
              yField="cpu"
              seriesField="pool"
              legend={{
                position: 'top',
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Pod Resource Requests vs Limits">
            <div style={{ height: 300 }}>
              <AreaChart
                data={[
                  { type: 'Requests', value: 65 },
                  { type: 'Limits', value: 80 },
                ]}
                xField="type"
                yField="value"
                smooth
                xAxis={{
                  label: {
                    formatter: (value: string) => value,
                  },
                }}
                yAxis={{
                  label: {
                    formatter: (value: string) => `${value}%`,
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ResourceMetrics;
