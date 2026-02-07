// ============ API GATEWAY CONFIGURATION ============

import React, { useState } from 'react';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

interface AuthProvider {
  type: 'oauth2' | 'saml' | 'apiKey' | 'mTLS';
  config: {
    issuer?: string;
    clientId?: string;
    jwksUri?: string;
  };
}

export const APIGatewayConfig: React.FC = () => {
  const [rateLimit, setRateLimit] = useState<RateLimitConfig>({
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
  });
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([]);
  const [selectedAuthType, setSelectedAuthType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const authTypes = [
    { id: 'oauth2', name: 'OAuth 2.0', description: 'Industry standard authorization protocol' },
    { id: 'saml', name: 'SAML 2.0', description: 'Security Assertion Markup Language' },
    { id: 'apiKey', name: 'API Key', description: 'Simple API key authentication' },
    { id: 'mTLS', name: 'mTLS', description: 'Mutual TLS authentication' },
  ];

  const handleSaveRateLimit = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/enterprise-integrations/gateway/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateLimit }),
      });
      console.log('Rate limits saved successfully!');
    } catch (error) {
      console.error('Failed to save rate limits:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAuthProvider = async () => {
    if (!selectedAuthType) return;
    
    setSaving(true);
    try {
      const provider: AuthProvider = {
        type: selectedAuthType as AuthProvider['type'],
        config: {},
      };
      
      await fetch('/api/v1/enterprise-integrations/gateway/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authProvider: provider }),
      });
      
      setAuthProviders([...authProviders, provider]);
      setSelectedAuthType('');
    } catch (error) {
      console.error('Failed to add auth provider:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="api-gateway-config">
      <h2>Enterprise API Gateway Configuration</h2>

      <div className="config-section">
        <h3>Rate Limiting</h3>
        <div className="rate-limit-form">
          <div className="form-group">
            <label>Requests per Minute</label>
            <input
              type="number"
              value={rateLimit.requestsPerMinute}
              onChange={e => setRateLimit({ ...rateLimit, requestsPerMinute: parseInt(e.target.value, 10) })}
            />
          </div>
          <div className="form-group">
            <label>Requests per Hour</label>
            <input
              type="number"
              value={rateLimit.requestsPerHour}
              onChange={e => setRateLimit({ ...rateLimit, requestsPerHour: parseInt(e.target.value, 10) })}
            />
          </div>
          <div className="form-group">
            <label>Requests per Day</label>
            <input
              type="number"
              value={rateLimit.requestsPerDay}
              onChange={e => setRateLimit({ ...rateLimit, requestsPerDay: parseInt(e.target.value, 10) })}
            />
          </div>
          <button onClick={handleSaveRateLimit} disabled={saving} className="primary">
            {saving ? 'Saving...' : 'Save Rate Limits'}
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>Authentication Providers</h3>
        <div className="auth-providers">
          {authProviders.map((provider, index) => (
            <div key={index} className="auth-provider-card">
              <span className="provider-type">{provider.type}</span>
              <button className="remove-button">Remove</button>
            </div>
          ))}
        </div>
        
        <div className="add-auth-provider">
          <select
            value={selectedAuthType}
            onChange={e => setSelectedAuthType(e.target.value)}
          >
            <option value="">Select auth type</option>
            {authTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <button onClick={handleAddAuthProvider} disabled={!selectedAuthType || saving}>
            Add Provider
          </button>
        </div>
      </div>

      <div className="config-section">
        <h3>API Versions</h3>
        <div className="api-versions">
          <div className="version-card active">
            <span className="version">v1</span>
            <span className="status">Active</span>
          </div>
          <div className="version-card preview">
            <span className="version">v2</span>
            <span className="status">Preview</span>
          </div>
        </div>
      </div>

      <div className="config-section">
        <h3>Documentation</h3>
        <p>OpenAPI 3.0 specification available at:</p>
        <code>/api-docs/enterprise-integrations</code>
      </div>
    </div>
  );
};
