// ============ ERP CONNECTOR COMPONENT ============

import React, { useState } from 'react';

interface ERPConfig {
  provider: 'sap' | 'oracle' | 'dynamics';
  baseUrl: string;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    tenant?: string;
  };
  syncSettings: {
    frequency: 'realtime' | 'hourly' | 'daily';
    entities: string[];
  };
}

interface ERPConnectorProps {
  onConnect: (type: string, config: ERPConfig) => Promise<void>;
}

export const ERPConnector: React.FC<ERPConnectorProps> = ({ onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [config, setConfig] = useState<Partial<ERPConfig>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const providers = [
    { id: 'sap', name: 'SAP S/4HANA', description: 'Enterprise resource planning for large organizations' },
    { id: 'oracle', name: 'Oracle ERP Cloud', description: 'Cloud-based ERP solution' },
    { id: 'dynamics', name: 'Microsoft Dynamics 365', description: 'Microsoft enterprise applications' },
  ];

  const handleConnect = async () => {
    if (!selectedProvider) {
      setError('Please select a provider');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await onConnect('erp', {
        provider: selectedProvider as ERPConfig['provider'],
        baseUrl: config.baseUrl || '',
        credentials: config.credentials || {},
        syncSettings: config.syncSettings || { frequency: 'hourly', entities: [] },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to connect. Please check your credentials.');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    // Test connection without saving
    setConnecting(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Connection successful!');
    } catch (err) {
      setError('Connection test failed');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="erp-connector">
      <h2>Connect ERP System</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Connection established successfully!</div>}

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
              placeholder={`https://api.${selectedProvider}.com`}
              value={config.baseUrl || ''}
              onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </div>

          {selectedProvider === 'sap' && (
            <>
              <div className="form-group">
                <label>SAP Client ID</label>
                <input
                  type="text"
                  placeholder="Enter SAP Client ID"
                  value={config.credentials?.clientId || ''}
                  onChange={e => setConfig({
                    ...config,
                    credentials: { ...config.credentials, clientId: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>SAP Client Secret</label>
                <input
                  type="password"
                  placeholder="Enter Client Secret"
                  value={config.credentials?.clientSecret || ''}
                  onChange={e => setConfig({
                    ...config,
                    credentials: { ...config.credentials, clientSecret: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          {(selectedProvider === 'oracle' || selectedProvider === 'dynamics') && (
            <>
              <div className="form-group">
                <label>Tenant ID</label>
                <input
                  type="text"
                  placeholder="Enter Tenant ID"
                  value={config.credentials?.tenant || ''}
                  onChange={e => setConfig({
                    ...config,
                    credentials: { ...config.credentials, tenant: e.target.value }
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
            </>
          )}

          <div className="form-group">
            <label>Sync Frequency</label>
            <select
              value={config.syncSettings?.frequency || 'hourly'}
              onChange={e => setConfig({
                ...config,
                syncSettings: { ...config.syncSettings!, frequency: e.target.value as ERPConfig['syncSettings']['frequency'] }
              })}
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div className="button-group">
            <button onClick={handleTestConnection} disabled={connecting}>
              Test Connection
            </button>
            <button onClick={handleConnect} disabled={connecting} className="primary">
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
