// ============ ATS INTEGRATION COMPONENT ============

import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';

interface ATSIntegrationProps {
  onConnect: () => void;
}

const ATS_PROVIDERS = [
  { id: 'GREENHOUSE', name: 'Greenhouse', description: 'Modern ATS for growing teams' },
  { id: 'LEVER', name: 'Lever', description: 'Recruiting and CRM' },
  { id: 'WORKDAY_ATS', name: 'Workday', description: 'Enterprise ATS' },
  { id: 'BULLHORN', name: 'Bullhorn', description: 'Staffing and recruiting' },
  { id: 'ICIMS', name: 'iCIMS', description: 'Talent Cloud' },
  { id: 'SMART_RECRUITERS', name: 'SmartRecruiters', description: 'Hiring platform' },
];

export const ATSIntegration: React.FC<ATSIntegrationProps> = ({ onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ apiKey: '', subdomain: '' });
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedProvider) return;
    setConnecting(true);
    // Simulate connection
    setTimeout(() => {
      setConnecting(false);
      onConnect();
    }, 1000);
  };

  return (
    <div>
      <Row className="g-3">
        {ATS_PROVIDERS.map((provider) => (
          <Col md={4} key={provider.id}>
            <Card
              className="h-100"
              style={{ cursor: 'pointer', border: selectedProvider === provider.id ? '2px solid #0d6efd' : '1px solid #dee2e6' }}
              onClick={() => setSelectedProvider(provider.id)}
            >
              <Card.Body>
                <Card.Title>{provider.name}</Card.Title>
                <Card.Text className="text-muted small">{provider.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedProvider && (
        <div className="mt-4">
          <h5>Connect to {ATS_PROVIDERS.find(p => p.id === selectedProvider)?.name}</h5>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control
                type="password"
                value={credentials.apiKey}
                onChange={(e: any) => setCredentials({ ...credentials, apiKey: e.target.value })}
                placeholder="Enter API Key"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subdomain (optional)</Form.Label>
              <Form.Control
                value={credentials.subdomain}
                onChange={(e: any) => setCredentials({ ...credentials, subdomain: e.target.value })}
                placeholder="your-company"
              />
            </Form.Group>
            <Button variant="primary" onClick={handleConnect} disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
};

export default ATSIntegration;
