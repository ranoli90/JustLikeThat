// ============ ENTERPRISE INTEGRATIONS DASHBOARD ============

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Form, Select, Alert, Progress, Tabs, Tab } from '../ui';
import { ERPConnector } from './ERPConnector';
import { CRMConnector } from './CRMConnector';
import { LMSConnector } from './LMSConnector';
import { TalentSyncManager } from './TalentSyncManager';
import { APIGatewayConfig } from './APIGatewayConfig';
import { LegacySystemManager } from './LegacySystemManager';
import { SyncMonitor } from './SyncMonitor';

interface Connection {
  id: string;
  type: 'erp' | 'crm' | 'lms' | 'talent' | 'gateway' | 'legacy';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
}

interface DashboardStats {
  totalConnections: number;
  activeConnections: number;
  syncedToday: number;
  errorsToday: number;
}

export const ConnectionDashboard: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalConnections: 0,
    activeConnections: 0,
    syncedToday: 0,
    errorsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/v1/enterprise-integrations/sync/logs');
      const data = await response.json();
      // Process and set connections
      setConnections(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      setLoading(false);
    }
  };

  const handleConnect = async (type: string, config: any) => {
    try {
      const endpoint = `/api/v1/enterprise-integrations/${type}/connect`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const result = await response.json();
      if (result.success) {
        fetchConnections();
        setShowConnectModal(false);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleSync = async (connectionId: string, type: string) => {
    try {
      const response = await fetch(`/api/v1/enterprise-integrations/${type}/${connectionId}/sync`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        fetchConnections();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      inactive: 'default',
      error: 'danger',
      syncing: 'processing',
    };
    return <Badge color={colors[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="enterprise-integrations-dashboard">
      <div className="dashboard-header">
        <h1>Enterprise Integrations</h1>
        <Button type="primary" onClick={() => setShowConnectModal(true)}>
          New Connection
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <Card className="stat-card">
          <h3>Total Connections</h3>
          <p className="stat-value">{stats.totalConnections}</p>
        </Card>
        <Card className="stat-card">
          <h3>Active</h3>
          <p className="stat-value">{stats.activeConnections}</p>
        </Card>
        <Card className="stat-card">
          <h3>Synced Today</h3>
          <p className="stat-value">{stats.syncedToday}</p>
        </Card>
        <Card className="stat-card">
          <h3>Errors</h3>
          <p className="stat-value errors">{stats.errorsToday}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tab key="overview" tab="Overview">
          <Table
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Provider', dataIndex: 'provider', key: 'provider' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (_, record) => getStatusBadge(record.status) },
              { title: 'Last Sync', dataIndex: 'lastSync', key: 'lastSync', render: (_, record) => record.lastSync || 'Never' },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <div className="action-buttons">
                    <Button size="small" onClick={() => handleSync(record.id, record.type)}>
                      Sync
                    </Button>
                    <Button size="small" type="link">
                      Configure
                    </Button>
                  </div>
                ),
              },
            ]}
            dataSource={connections}
            rowKey="id"
          />
        </Tab>

        <Tab key="erp" tab="ERP Systems">
          <ERPConnector onConnect={handleConnect} />
        </Tab>

        <Tab key="crm" tab="CRM Systems">
          <CRMConnector onConnect={handleConnect} />
        </Tab>

        <Tab key="lms" tab="Corporate LMS">
          <LMSConnector onConnect={handleConnect} />
        </Tab>

        <Tab key="talent" tab="Talent Management">
          <TalentSyncManager />
        </Tab>

        <Tab key="gateway" tab="API Gateway">
          <APIGatewayConfig />
        </Tab>

        <Tab key="legacy" tab="Legacy Systems">
          <LegacySystemManager />
        </Tab>

        <Tab key="monitor" tab="Sync Monitor">
          <SyncMonitor />
        </Tab>
      </Tabs>

      {/* Connect Modal */}
      <Modal
        open={showConnectModal}
        onCancel={() => setShowConnectModal(false)}
        footer={null}
        title="Connect New Integration"
      >
        <Form layout="vertical">
          <Form.Item label="Integration Type" required>
            <Select placeholder="Select type">
              <Select.Option value="erp">ERP System</Select.Option>
              <Select.Option value="crm">CRM System</Select.Option>
              <Select.Option value="lms">Corporate LMS</Select.Option>
              <Select.Option value="legacy">Legacy System</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Provider">
            <Select placeholder="Select provider">
              <Select.Option value="sap">SAP S/4HANA</Select.Option>
              <Select.Option value="oracle">Oracle ERP Cloud</Select.Option>
              <Select.Option value="dynamics">Microsoft Dynamics 365</Select.Option>
              <Select.Option value="salesforce">Salesforce</Select.Option>
              <Select.Option value="hubspot">HubSpot</Select.Option>
              <Select.Option value="zoho">Zoho CRM</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Continue
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
