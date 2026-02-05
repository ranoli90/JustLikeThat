// ============ JOB BOARD CONNECTOR COMPONENT ============

import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';

interface JobBoardConnectorProps {
  onConnect: () => void;
}

const JOB_BOARDS = [
  { id: 'LINKEDIN', name: 'LinkedIn', icon: '🔗', description: 'Search and apply to LinkedIn jobs' },
  { id: 'INDEED', name: 'Indeed', icon: '✓', description: 'Indeed job aggregator' },
  { id: 'GLASSDOOR', name: 'Glassdoor', icon: '🏢', description: 'Jobs with company reviews' },
  { id: 'REMOTE_CO', name: 'Remote.co', icon: '🌍', description: 'Remote job listings' },
  { id: 'ANGEL_LIST', name: 'AngelList', icon: '👼', description: 'Startup jobs' },
  { id: 'DICE', name: 'Dice', icon: '🎲', description: 'Tech jobs' },
];

export const JobBoardConnector: React.FC<JobBoardConnectorProps> = ({ onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ apiKey: '', clientId: '', clientSecret: '' });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!selectedProvider) return;

    setConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/integrations/job-boards/connect/' + selectedProvider.toLowerCase(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      onConnect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const getCredentialFields = () => {
    switch (selectedProvider) {
      case 'LINKEDIN':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Client ID</Form.Label>
              <Form.Control
                type="text"
                value={credentials.clientId}
                onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                placeholder="Enter LinkedIn Client ID"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Client Secret</Form.Label>
              <Form.Control
                type="password"
                value={credentials.clientSecret}
                onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                placeholder="Enter LinkedIn Client Secret"
              />
            </Form.Group>
          </>
        );
      default:
        return (
          <Form.Group className="mb-3">
            <Form.Label>API Key</Form.Label>
            <Form.Control
              type="password"
              value={credentials.apiKey}
              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              placeholder="Enter API Key"
            />
          </Form.Group>
        );
    }
  };

  return (
    <div>
      <Row className="g-3">
        {JOB_BOARDS.map((provider) => (
          <Col md={4} key={provider.id}>
            <Card
              className="integration-card h-100"
              style={{
                cursor: 'pointer',
                border: selectedProvider === provider.id ? '2px solid #0d6efd' : '1px solid #dee2e6',
              }}
              onClick={() => setSelectedProvider(provider.id)}
            >
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-2" style={{ fontSize: '24px' }}>{provider.icon}</span>
                  <Card.Title className="mb-0">{provider.name}</Card.Title>
                </div>
                <Card.Text className="text-muted small">{provider.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedProvider && (
        <div className="mt-4">
          <h5>Connect to {JOB_BOARDS.find(p => p.id === selectedProvider)?.name}</h5>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form>
            {getCredentialFields()}
            
            <Button
              variant="primary"
              onClick={handleConnect}
              disabled={connecting || !credentials.apiKey}
              className="w-100"
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
};

export default JobBoardConnector;
