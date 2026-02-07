// ============ INTEGRATION DASHBOARD COMPONENT ============

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Form, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useApi } from '../../hooks/useApi';
import { JobBoardConnector } from './JobBoardConnector';
import { ATSIntegration } from './ATSIntegration';
import { HRISConnection } from './HRISConnection';
import { BackgroundCheckManager } from './BackgroundCheckManager';
import { SchedulingIntegration } from './SchedulingIntegration';
import { LMSIntegration } from './LMSIntegration';
import { TeamChatIntegration } from './TeamChatIntegration';
import { SSOProvider } from './SSOProvider';

interface Integration {
  id: string;
  provider: string;
  type: string;
  status: string;
  lastSync: string | null;
  createdAt: string;
}

export const IntegrationDashboard: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('JOB_BOARD');
  const [activeTab, setActiveTab] = useState('all');

  const { get, post } = useApi();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await get('/api/v1/integrations');
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'success',
      PENDING: 'warning',
      SYNCING: 'info',
      ERROR: 'danger',
      DISABLED: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const handleSync = async (integrationId: string) => {
    try {
      await post(`/api/v1/integrations/${integrationId}/sync`, { syncType: 'manual' });
      loadIntegrations();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const filteredIntegrations = activeTab === 'all'
    ? integrations
    : integrations.filter(i => i.type === activeTab);

  return (
    <div className="integration-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Integrations</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add Integration
        </Button>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'all')} className="mb-4">
        <Tab eventKey="all" title="All"></Tab>
        <Tab eventKey="JOB_BOARD" title="Job Boards"></Tab>
        <Tab eventKey="ATS" title="ATS"></Tab>
        <Tab eventKey="HRIS" title="HRIS"></Tab>
        <Tab eventKey="BACKGROUND_CHECK" title="Background Checks"></Tab>
        <Tab eventKey="SCHEDULING" title="Scheduling"></Tab>
        <Tab eventKey="LMS" title="Learning"></Tab>
        <Tab eventKey="TEAM_CHAT" title="Team Chat"></Tab>
        <Tab eventKey="SSO" title="SSO"></Tab>
      </Tabs>

      {loading ? (
        <div className="p-5 text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped hover>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Sync</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIntegrations.map((integration) => (
              <tr key={integration.id}>
                <td>
                  <strong>{integration.provider}</strong>
                </td>
                <td>{integration.type.replace('_', ' ')}</td>
                <td>{getStatusBadge(integration.status)}</td>
                <td>
                  {integration.lastSync
                    ? new Date(integration.lastSync).toLocaleString()
                    : 'Never'}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => handleSync(integration.id)}
                  >
                    Sync
                  </Button>
                  <Button size="sm" variant="outline-secondary">
                    Configure
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Integration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={selectedType}
            onSelect={(k) => setSelectedType(k || 'JOB_BOARD')}
            className="mb-3"
          >
            <Tab eventKey="JOB_BOARD" title="Job Boards">
              <JobBoardConnector onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="ATS" title="ATS">
              <ATSIntegration onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="HRIS" title="HRIS">
              <HRISConnection onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="BACKGROUND_CHECK" title="Background Checks">
              <BackgroundCheckManager onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="SCHEDULING" title="Scheduling">
              <SchedulingIntegration onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="LMS" title="Learning">
              <LMSIntegration onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="TEAM_CHAT" title="Team Chat">
              <TeamChatIntegration onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
            <Tab eventKey="SSO" title="SSO">
              <SSOProvider onConnect={() => { loadIntegrations(); setShowModal(false); }} />
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default IntegrationDashboard;
