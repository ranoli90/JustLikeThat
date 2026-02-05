import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Timeline, Badge, Progress, List, Typography } from 'antd';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: string;
  latency: number;
  requestsPerSecond: number;
  errorRate: number;
  instances: number;
  lastChecked: Date;
}

interface HealthEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  service: string;
}

export const ServiceHealth: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>([
    {
      name: 'api-gateway',
      status: 'healthy',
      uptime: '99.99%',
      latency: 25,
      requestsPerSecond: 1250,
      errorRate: 0.01,
      instances: 3,
      lastChecked: new Date(),
    },
    {
      name: 'user-service',
      status: 'healthy',
      uptime: '99.95%',
      latency: 45,
      requestsPerSecond: 850,
      errorRate: 0.05,
      instances: 2,
      lastChecked: new Date(),
    },
    {
      name: 'application-service',
      status: 'degraded',
      uptime: '99.80%',
      latency: 120,
      requestsPerSecond: 450,
      errorRate: 0.15,
      instances: 2,
      lastChecked: new Date(),
    },
    {
      name: 'auth-service',
      status: 'healthy',
      uptime: '99.99%',
      latency: 15,
      requestsPerSecond: 2100,
      errorRate: 0.01,
      instances: 2,
      lastChecked: new Date(),
    },
    {
      name: 'notification-service',
      status: 'healthy',
      uptime: '99.90%',
      latency: 35,
      requestsPerSecond: 320,
      errorRate: 0.02,
      instances: 2,
      lastChecked: new Date(),
    },
  ]);

  const [events, setEvents] = useState<HealthEvent[]>([
    { id: '1', type: 'success', message: 'api-gateway scaled up to 3 replicas', timestamp: new Date(Date.now() - 300000), service: 'api-gateway' },
    { id: '2', type: 'warning', message: 'application-service high latency detected', timestamp: new Date(Date.now() - 600000), service: 'application-service' },
    { id: '3', type: 'info', message: 'Database failover completed', timestamp: new Date(Date.now() - 1800000), service: 'database' },
    { id: '4', type: 'error', message: 'Kafka broker offline: broker-2', timestamp: new Date(Date.now() - 3600000), service: 'kafka' },
    { id: '5', type: 'success', message: 'Kafka broker-2 recovered', timestamp: new Date(Date.now() - 3500000), service: 'kafka' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'orange';
      case 'unhealthy': return 'red';
      default: return 'default';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success': return <Badge status="success" />;
      case 'warning': return <Badge status="warning" />;
      case 'error': return <Badge status="error" />;
      default: return <Badge status="processing" />;
    }
  };

  return (
    <div className="service-health">
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Service Health Overview" size="small">
            <List
              dataSource={services}
              renderItem={(service) => (
                <List.Item>
                  <Row style={{ width: '100%' }} align="middle">
                    <Col span={4}>
                      <Typography.Text strong>{service.name}</Typography.Text>
                    </Col>
                    <Col span={3}>
                      <Tag color={getStatusColor(service.status)}>{service.status.toUpperCase()}</Tag>
                    </Col>
                    <Col span={3}>
                      <Typography.Text type="secondary">Uptime: {service.uptime}</Typography.Text>
                    </Col>
                    <Col span={3}>
                      <Typography.Text type="secondary">Latency: {service.latency}ms</Typography.Text>
                    </Col>
                    <Col span={3}>
                      <Typography.Text type="secondary">RPS: {service.requestsPerSecond}</Typography.Text>
                    </Col>
                    <Col span={3}>
                      <Typography.Text type="secondary">Instances: {service.instances}</Typography.Text>
                    </Col>
                    <Col span={5}>
                      <Progress
                        percent={service.errorRate * 100}
                        size="small"
                        format={() => `${(service.errorRate * 100).toFixed(2)}%`}
                        status={service.errorRate > 0.1 ? 'exception' : 'normal'}
                      />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Health Events" size="small">
            <Timeline
              mode="left"
              items={events.map((event) => ({
                dot: getEventIcon(event.type),
                children: (
                  <>
                    <Typography.Text strong>{event.service}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">{event.message}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {event.timestamp.toLocaleString()}
                    </Typography.Text>
                  </>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Typography.Title level={4}>Overall Health</Typography.Title>
            <Progress
              type="dashboard"
              percent={95}
              strokeColor={{
                '0%': '#52c41a',
                '100%': '#faad14',
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Typography.Title level={4}>Average Latency</Typography.Title>
            <Progress
              type="dashboard"
              percent={70}
              format={() => '45ms'}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Typography.Title level={4}>Error Rate</Typography.Title>
            <Progress
              type="dashboard"
              percent={2}
              format={() => '0.05%'}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ServiceHealth;
