import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'antd';

interface ClusterMetrics {
  totalNodes: number;
  activeNodes: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
}

interface Node {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  pods: number;
  zone: string;
}

export const ClusterDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ClusterMetrics>({
    totalNodes: 12,
    activeNodes: 12,
    cpuUsage: 65,
    memoryUsage: 72,
    diskUsage: 45,
    networkIn: 1250000,
    networkOut: 2500000,
  });

  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', name: 'node-1', status: 'healthy', cpu: 65, memory: 72, pods: 45, zone: 'us-east-1a' },
    { id: '2', name: 'node-2', status: 'healthy', cpu: 58, memory: 68, pods: 42, zone: 'us-east-1b' },
    { id: '3', name: 'node-3', status: 'healthy', cpu: 72, memory: 75, pods: 48, zone: 'us-east-1c' },
    { id: '4', name: 'node-4', status: 'warning', cpu: 85, memory: 88, pods: 52, zone: 'us-east-1a' },
    { id: '5', name: 'node-5', status: 'healthy', cpu: 45, memory: 55, pods: 38, zone: 'us-east-1b' },
    { id: '6', name: 'node-6', status: 'healthy', cpu: 62, memory: 70, pods: 44, zone: 'us-east-1c' },
  ]);

  const columns = [
    {
      title: 'Node',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'healthy' ? 'green' : status === 'warning' ? 'orange' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu: number) => <Progress percent={cpu} size="small" status={cpu > 80 ? 'exception' : 'active'} />,
    },
    {
      title: 'Memory',
      dataIndex: 'memory',
      key: 'memory',
      render: (memory: number) => <Progress percent={memory} size="small" status={memory > 80 ? 'exception' : 'active'} />,
    },
    {
      title: 'Pods',
      dataIndex: 'pods',
      key: 'pods',
    },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
    },
  ];

  return (
    <div className="cluster-dashboard">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Nodes"
              value={metrics.totalNodes}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>/ {metrics.activeNodes} active</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={metrics.cpuUsage}
              suffix="%"
              valueStyle={{ color: metrics.cpuUsage > 80 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={metrics.memoryUsage}
              suffix="%"
              valueStyle={{ color: metrics.memoryUsage > 80 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Disk Usage"
              value={metrics.diskUsage}
              suffix="%"
              valueStyle={{ color: metrics.diskUsage > 80 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Node Health">
            <Table
              dataSource={nodes}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Network Traffic">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Network In"
                  value={metrics.networkIn}
                  precision={2}
                  suffix="MB/s"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Network Out"
                  value={metrics.networkOut}
                  precision={2}
                  suffix="MB/s"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClusterDashboard;
