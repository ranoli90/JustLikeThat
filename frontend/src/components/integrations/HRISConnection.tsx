// ============ HRIS CONNECTION COMPONENT ============

import React, { useState } from 'react';
import { Card, Button, Form, Row, Col } from 'react-bootstrap';

interface HRISConnectionProps {
  onConnect: () => void;
}

const HRIS_PROVIDERS = [
  { id: 'WORKDAY_HCM', name: 'Workday HCM', description: 'Enterprise HR management' },
  { id: 'BAMBOOHR', name: 'BambooHR', description: 'HR software for SMBs' },
  { id: 'ADP', name: 'ADP', description: 'Payroll and HR solutions' },
  { id: 'SAP_SUCCESSFACTORS', name: 'SAP SuccessFactors', description: 'Cloud HCM' },
];

export const HRISConnection: React.FC<HRISConnectionProps> = ({ onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    if (!selectedProvider) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      onConnect();
    }, 1000);
  };

  return (
    <Row className="g-3">
      {HRIS_PROVIDERS.map((provider) => (
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
      {selectedProvider && (
        <div className="mt-4">
          <h5>Connect to {selectedProvider}</h5>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control type="password" placeholder="Enter API Key" />
            </Form.Group>
            <Button variant="primary" onClick={handleConnect} disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </Form>
        </div>
      )}
    </Row>
  );
};

export default HRISConnection;
