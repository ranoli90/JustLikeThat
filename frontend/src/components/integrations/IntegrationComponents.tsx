// ============ REMAINING INTEGRATION COMPONENTS ============

import React from 'react';
import { Card, Button, Form, Row, Col } from 'react-bootstrap';

// Background Check Manager
export const BackgroundCheckManager: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const providers = [
    { id: 'CHECKR', name: 'Checkr', description: 'Background checks' },
    { id: 'GOODHIRE', name: 'GoodHire', description: 'Employment screening' },
    { id: 'HIRERIGHT', name: 'HireRight', description: 'Background verification' },
  ];

  return (
    <Row className="g-3">
      {providers.map((p) => (
        <Col md={4} key={p.id}>
          <Card className="h-100" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>{p.name}</Card.Title>
              <Card.Text className="text-muted small">{p.description}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// Scheduling Integration
export const SchedulingIntegration: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const providers = [
    { id: 'CALENDLY', name: 'Calendly', description: 'Meeting scheduling' },
    { id: 'GOOGLE_CALENDAR', name: 'Google Calendar', description: 'Calendar sync' },
  ];

  return (
    <Row className="g-3">
      {providers.map((p) => (
        <Col md={4} key={p.id}>
          <Card className="h-100" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>{p.name}</Card.Title>
              <Card.Text className="text-muted small">{p.description}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// LMS Integration
export const LMSIntegration: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const providers = [
    { id: 'LINKEDIN_LEARNING', name: 'LinkedIn Learning', description: 'Online courses' },
    { id: 'UDEMY_BUSINESS', name: 'Udemy Business', description: 'Corporate training' },
  ];

  return (
    <Row className="g-3">
      {providers.map((p) => (
        <Col md={4} key={p.id}>
          <Card className="h-100" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>{p.name}</Card.Title>
              <Card.Text className="text-muted small">{p.description}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// Team Chat Integration
export const TeamChatIntegration: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const providers = [
    { id: 'SLACK', name: 'Slack', description: 'Team messaging' },
    { id: 'TEAMS', name: 'Microsoft Teams', description: 'Collaboration' },
  ];

  return (
    <Row className="g-3">
      {providers.map((p) => (
        <Col md={4} key={p.id}>
          <Card className="h-100" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>{p.name}</Card.Title>
              <Card.Text className="text-muted small">{p.description}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// SSO Provider
export const SSOProvider: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const providers = [
    { id: 'OKTA', name: 'Okta', description: 'Identity management' },
    { id: 'AZURE_AD', name: 'Azure AD', description: 'Microsoft identity' },
    { id: 'GOOGLE_WORKSPACE', name: 'Google Workspace', description: 'Google SSO' },
  ];

  return (
    <Row className="g-3">
      {providers.map((p) => (
        <Col md={4} key={p.id}>
          <Card className="h-100" style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>{p.name}</Card.Title>
              <Card.Text className="text-muted small">{p.description}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// Webhook Tester Component
export const WebhookTester: React.FC = () => {
  return (
    <div>
      <h5>Webhook Tester</h5>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Webhook URL</Form.Label>
          <Form.Control type="text" placeholder="Enter webhook URL to test" />
        </Form.Group>
        <Button variant="primary">Send Test Payload</Button>
      </Form>
    </div>
  );
};
