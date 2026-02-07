// ============ LEGACY SYSTEM MANAGER ============

import React, { useState } from 'react';

interface LegacySystemConfig {
  systemName: string;
  protocol: 'ftp' | 'sftp' | 'ftps' | 'soap' | 'rest' | 'mq' | 'tcp';
  host: string;
  port: number;
  username?: string;
  mappings: Array<{
    sourceField: string;
    targetField: string;
    dataType: string;
  }>;
}

interface LegacyConnection {
  id: string;
  systemName: string;
  protocol: string;
  status: string;
  lastSync?: Date;
}

export const LegacySystemManager: React.FC = () => {
  const [connections, setConnections] = useState<LegacyConnection[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [config, setConfig] = useState<Partial<LegacySystemConfig>>({});
  const [connecting, setConnecting] = useState(false);

  const protocols = [
    { id: 'ftp', name: 'FTP', description: 'File Transfer Protocol' },
    { id: 'sftp', name: 'SFTP', description: 'SSH File Transfer Protocol' },
    { id: 'ftps', name: 'FTPS', description: 'FTP over SSL/TLS' },
    { id: 'soap', name: 'SOAP', description: 'Simple Object Access Protocol' },
    { id: 'mq', name: 'MQ', description: 'Message Queue' },
    { id: 'tcp', name: 'TCP', description: 'Raw TCP Connection' },
  ];

  const handleConnect = async () => {
    if (!config.systemName || !config.host) {
      console.error('Please fill in required fields');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch('/api/v1/enterprise-integrations/legacy/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const result = await response.json();
      if (result.success) {
        setConnections([...connections, {
          id: result.connectionId,
          systemName: config.systemName!,
          protocol: config.protocol!,
          status: 'active',
        }]);
        setShowConnectModal(false);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      await fetch(`/api/v1/enterprise-integrations/legacy/${connectionId}/sync`, {
        method: 'POST',
      });
      console.log('Sync initiated');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="legacy-system-manager">
      <div className="header">
        <h2>Legacy System Integration</h2>
        <button onClick={() => setShowConnectModal(true)} className="primary">
          Connect Legacy System
        </button>
      </div>

      <div className="connections-grid">
        {connections.map(conn => (
          <div key={conn.id} className="connection-card">
            <div className="card-header">
              <h3>{conn.systemName}</h3>
              <span className={`status ${conn.status}`}>{conn.status}</span>
            </div>
            <div className="card-body">
              <p><strong>Protocol:</strong> {conn.protocol}</p>
              <p><strong>Last Sync:</strong> {conn.lastSync ? new Date(conn.lastSync).toLocaleString() : 'Never'}</p>
            </div>
            <div className="card-actions">
              <button onClick={() => handleSync(conn.id)}>Sync Now</button>
              <button className="secondary">Configure</button>
              <button className="danger">Disconnect</button>
            </div>
          </div>
        ))}

        {connections.length === 0 && (
          <div className="empty-state">
            <p>No legacy systems connected</p>
            <p className="hint">Connect legacy systems via FTP, SFTP, SOAP, or MQ protocols</p>
          </div>
        )}
      </div>

      {showConnectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Connect Legacy System</h3>
            
            <div className="form-group">
              <label>System Name *</label>
              <input
                type="text"
                placeholder="e.g., Mainframe System, AS400"
                value={config.systemName || ''}
                onChange={e => setConfig({ ...config, systemName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Protocol *</label>
              <select
                value={config.protocol || ''}
                onChange={e => setConfig({ ...config, protocol: e.target.value as LegacySystemConfig['protocol'] })}
              >
                <option value="">Select protocol</option>
                {protocols.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.description}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Host *</label>
              <input
                type="text"
                placeholder="Enter host address"
                value={config.host || ''}
                onChange={e => setConfig({ ...config, host: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                placeholder="Default port for selected protocol"
                value={config.port || ''}
                onChange={e => setConfig({ ...config, port: parseInt(e.target.value, 10) })}
              />
            </div>

            <div className="form-group">
              <label>Username (optional)</label>
              <input
                type="text"
                placeholder="Enter username"
                value={config.username || ''}
                onChange={e => setConfig({ ...config, username: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowConnectModal(false)}>Cancel</button>
              <button onClick={handleConnect} disabled={connecting} className="primary">
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
