import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';

interface ConnectionManagerProps {
  node: Node;
  edges: Edge[];
  onConfigChange: (config: Record<string, any>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  node,
  edges,
  onConfigChange,
  onDelete,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = useState(node.data.config || {});
  const [activeTab, setActiveTab] = useState<'config' | 'inputs' | 'outputs'>('config');

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const incomingEdges = edges.filter((edge) => edge.target === node.id);
  const outgoingEdges = edges.filter((edge) => edge.source === node.id);

  const nodeType = node.data.type;
  const isTrigger = nodeType.startsWith('trigger.');
  const isAction = nodeType.startsWith('action.');
  const isCondition = nodeType.startsWith('condition.');
  const isFlow = nodeType.startsWith('flow.');

  return (
    <div className="connection-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {node.data.label}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6B7280',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            padding: '4px 8px',
            backgroundColor: isTrigger ? '#D1FAE5' : isAction ? '#DBEAFE' : isCondition ? '#FEF3C7' : isFlow ? '#EDE9FE' : '#FEE2E2',
            color: isTrigger ? '#065F46' : isAction ? '#1E40AF' : isCondition ? '#92400E' : isFlow ? '#5B21B6' : '#991B1B',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {nodeType}
        </span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }}>
        {(['config', 'inputs', 'outputs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab ? 'white' : '#F9FAFB',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              color: activeTab === tab ? '#3B82F6' : '#6B7280',
              fontWeight: activeTab === tab ? 500 : 400,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="config-panel">
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
              Label
            </label>
            <input
              type="text"
              value={localConfig.label || node.data.label || ''}
              onChange={(e) => handleConfigChange('label', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>

          {isTrigger && nodeType === 'trigger.webhook' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Method
                </label>
                <select
                  value={localConfig.method || 'POST'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
            </>
          )}

          {isTrigger && nodeType === 'trigger.schedule' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={localConfig.cronExpression || '* * * * *'}
                  onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
                  placeholder="* * * * *"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Timezone
                </label>
                <select
                  value={localConfig.timezone || 'UTC'}
                  onChange={(e) => handleConfigChange('timezone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
            </>
          )}

          {isAction && nodeType === 'action.http' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  URL
                </label>
                <input
                  type="text"
                  value={localConfig.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Method
                </label>
                <select
                  value={localConfig.method || 'GET'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
            </>
          )}

          {isAction && nodeType === 'action.email' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  To
                </label>
                <input
                  type="text"
                  value={localConfig.to || ''}
                  onChange={(e) => handleConfigChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={localConfig.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                  placeholder="Email subject"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </>
          )}

          {isCondition && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Conditions
              </label>
              <textarea
                value={JSON.stringify(localConfig.conditions || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleConfigChange('conditions', parsed);
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder="[]"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  minHeight: '100px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          )}

          {nodeType === 'flow.delay' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Delay (milliseconds)
              </label>
              <input
                type="number"
                value={localConfig.delayMs || 1000}
                onChange={(e) => handleConfigChange('delayMs', parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'inputs' && (
        <div className="inputs-panel">
          <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
            Incoming Connections ({incomingEdges.length})
          </h4>
          {incomingEdges.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#6B7280' }}>No incoming connections</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {incomingEdges.map((edge) => (
                <li
                  key={edge.id}
                  style={{
                    padding: '8px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '13px',
                  }}
                >
                  From: {edge.source}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'outputs' && (
        <div className="outputs-panel">
          <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
            Outgoing Connections ({outgoingEdges.length})
          </h4>
          {outgoingEdges.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#6B7280' }}>No outgoing connections</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {outgoingEdges.map((edge) => (
                <li
                  key={edge.id}
                  style={{
                    padding: '8px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '13px',
                  }}
                >
                  To: {edge.target}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Delete Button */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={onDelete}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
};

export default ConnectionManager;
