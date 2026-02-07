// ============ CRM CONNECTOR COMPONENT ============

import React, { useState } from 'react';

interface CRMConfig {
  provider: 'salesforce' | 'hubspot' | 'zoho';
  baseUrl: string;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
  };
  syncSettings: {
    frequency: 'realtime' | 'hourly' | 'daily';
    entities: string[];
  };
}

interface CRMConnectorProps {
  onConnect: (type: string, config: CRMConfig) => Promise<void>;
}

export const CRMConnector: React.FC<CRMConnectorProps> = ({ onConnect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [config, setConfig] = useState<Partial<CRMConfig>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = [
    { id: 'salesforce', name: 'Salesforce', description: 'World\'s #1 CRM platform' },
    { id: 'hubspot', name: 'HubSpot', description: 'Inbound marketing and sales platform' },
    { id: 'zoho', name: 'Zoho CRM', description: 'Business software suite' },
  ];

  const handleConnect = async () => {
    if (!selectedProvider) {
      setError('Please select a provider');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await onConnect('crm', {
        provider: selectedProvider as CRMConfig['provider'],
        baseUrl: config.baseUrl || '',
        credentials: config.credentials || {},
        syncSettings: config.syncSettings || { frequency: 'realtime', entities: [] },
      });
    } catch (err) {
      setError('Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="crm-connector">
      <h2>Connect CRM System</h2>
      
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
              placeholder={`https://api.${selectedProvider}.com`}
              value={config.baseUrl || ''}
              onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Client ID</label>
            <input
              type="text"
              placeholder="Enter OAuth Client ID"
              value={config.credentials?.clientId || ''}
              onChange={e => setConfig({
                ...config,
                credentials: { ...config.credentials, clientId: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Client Secret</label>
            <input
              type="password"
              placeholder="Enter OAuth Client Secret"
              value={config.credentials?.clientSecret || ''}
              onChange={e => setConfig({
                ...config,
                credentials: { ...config.credentials, clientSecret: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Sync Frequency</label>
            <select
              value={config.syncSettings?.frequency || 'realtime'}
              onChange={e => setConfig({
                ...config,
                syncSettings: { ...config.syncSettings!, frequency: e.target.value as CRMConfig['syncSettings']['frequency'] }
              })}
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
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
