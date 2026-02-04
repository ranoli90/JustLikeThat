import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../services/security.service';

export const ThreatPanel: React.FC = () => {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadThreats();
  }, [statusFilter]);

  const loadThreats = async () => {
    setLoading(true);
    try {
      const data = await SecurityService.getThreats(statusFilter || undefined);
      setThreats(data);
    } catch (error) {
      console.error('Failed to load threats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMitigate = async (threatId: string) => {
    try {
      await SecurityService.mitigateThreat(threatId);
      loadThreats();
    } catch (error) {
      console.error('Failed to mitigate threat:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'active';
      case 'mitigated': return 'mitigated';
      case 'resolved': return 'resolved';
      case 'investigating': return 'investigating';
      default: return '';
    }
  };

  return (
    <div className="threat-panel">
      <h2>Threat Detection</h2>
      
      <div className="panel-controls">
        <label>
          Filter by Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="mitigated">Mitigated</option>
            <option value="resolved">Resolved</option>
            <option value="investigating">Investigating</option>
          </select>
        </label>
        <button className="refresh-btn" onClick={loadThreats}>Refresh</button>
      </div>

      {loading ? (
        <div className="loading">Loading threats...</div>
      ) : (
        <div className="threat-list">
          {threats.length === 0 ? (
            <div className="empty-state">No threats found</div>
          ) : (
            threats.map((threat) => (
              <div key={threat.id} className={`threat-card ${getSeverityColor(threat.severity)}`}>
                <div className="threat-header">
                  <span className={`severity-badge ${threat.severity}`}>
                    {threat.severity.toUpperCase()}
                  </span>
                  <span className={`status-badge ${threat.status}`}>
                    {threat.status}
                  </span>
                </div>
                <h3>{threat.type}</h3>
                <p className="threat-description">{threat.description}</p>
                <div className="threat-details">
                  <span>Source: {threat.source}</span>
                  <span>Target: {threat.target}</span>
                </div>
                {threat.indicators && threat.indicators.length > 0 && (
                  <div className="threat-indicators">
                    <strong>Indicators:</strong>
                    <ul>
                      {threat.indicators.map((indicator: string, i: number) => (
                        <li key={i}>{indicator}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {threat.status === 'active' && (
                  <button
                    className="mitigate-btn"
                    onClick={() => handleMitigate(threat.id)}
                  >
                    Mitigate Threat
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ThreatPanel;
