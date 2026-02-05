// ============ LMS CONNECTOR COMPONENT ============

import React, { useState } from 'react';

interface LMSConfig {
  provider: 'workday' | 'cornerstone' | 'sap_sf';
  baseUrl: string;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    tenantId?: string;
  };
  syncSettings: {
    frequency: 'realtime' | 'hourly' | 'daily';
    entities: string[];
  };
}

interface LMSConnectorProps {
  onConnect: (type: string, config: LMSConfig) => Promise<void>;
}

export const LMSConnector: React.FC<LMSConnectorProps> = ({ onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [config, setConfig] = useState<Partial<LMSConfig>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = [
    { id: 'workday', name: 'Workday Learning', description: 'Unified learning management' },
    { id: 'cornerstone', name: 'Cornerstone OnDemand', description: 'Cloud-based learning and talent management' },
    { id: 'sap_sf', name: 'SAP SuccessFactors Learning', description: 'Enterprise learning management' },
  ];

  const handleConnect = async () => {
    if (!selectedProvider) {
      setError('Please select a provider');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await onConnect('lms', {
        provider: selectedProvider as LMSConfig['provider'],
        baseUrl: config.baseUrl || '',
        credentials: config.credentials || {},
        syncSettings: config.syncSettings || { frequency: 'hourly', entities: [] },
      });
    } catch (err) {
      setError('Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="lms-connector">
      <h2>Connect Corporate LMS</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="provider-grid">
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`provider-card ${selectedProvider === provider.id ? 'selected' : ''}`}
            onClick={() => setSelectedProvider(provider.id)}
          >
            <h3>{provider.name}</h3>
            <p>{provider.description}</p>
          </div>
        ))}
      </div>

      {selectedProvider && (
        <div className="config-form">
          <h3>Configuration</h3>
          
          <div className="form-group">
            <label>Base URL</label>
            <input
              type="text"
              placeholder="Enter API base URL"
              value={config.baseUrl || ''}
              onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tenant ID</label>
            <input
              type="text"
              placeholder="Enter tenant ID"
              value={config.credentials?.tenantId || ''}
              onChange={e => setConfig({
                ...config,
                credentials: { ...config.credentials, tenantId: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={config.credentials?.username || ''}
              onChange={e => setConfig({
                ...config,
                credentials: { ...config.credentials, username: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={config.credentials?.password || ''}
              onChange={e => setConfig({
                ...config,
                credentials: { ...config.credentials, password: e.target.value }
              })}
            />
          </div>

          <div className="button-group">
            <button onClick={handleConnect} disabled={connecting} className="primary">
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
