import React, { useState, useEffect } from 'react';
import './SecurityComponents.css';

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  affectedUsers: number;
  affectedSystems: string[];
  timeline: any[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// Mock data generator
function generateMockIncidents(count: number): SecurityIncident[] {
  const categories = ['Unauthorized Access', 'Data Breach', 'Malware', 'DDoS', 'Phishing'];
  const statuses = ['open', 'investigating', 'contained', 'resolved'];

  return Array.from({ length: count }, (_, i) => ({
    id: `incident-${i}`,
    title: `Security Incident ${i + 1}: ${categories[i % categories.length]}`,
    description: 'A security incident was detected and requires investigation.',
    severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    category: categories[i % categories.length],
    affectedUsers: Math.floor(Math.random() * 100),
    affectedSystems: ['api-gateway', 'database'],
    timeline: [
      {
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        action: 'Incident detected',
        performedBy: 'system',
      },
      {
        timestamp: new Date(Date.now() - (i - 1) * 3600000).toISOString(),
        action: 'Status updated',
        performedBy: 'security-team',
      },
    ],
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: statuses[i % statuses.length] === 'resolved' ? new Date().toISOString() : undefined,
  }));
}

export const IncidentDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/security/incidents');
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      setIncidents(generateMockIncidents(5));
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open': return 'open';
      case 'investigating': return 'investigating';
      case 'contained': return 'contained';
      case 'resolved': return 'resolved';
      default: return '';
    }
  };

  const filteredIncidents = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter);

  const stats = {
    critical: incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length,
    high: incidents.filter((i) => i.severity === 'high' && i.status !== 'resolved').length,
    medium: incidents.filter((i) => i.severity === 'medium' && i.status !== 'resolved').length,
    low: incidents.filter((i) => i.severity === 'low' && i.status !== 'resolved').length,
  };

  return (
    <div className="incident-dashboard">
      <div className="incident-header">
        <h3>Security Incident Dashboard</h3>
        <div className="framework-tabs">
          <button className={`framework-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({incidents.length})
          </button>
          <button className={`framework-tab ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>
            Open
          </button>
          <button className={`framework-tab ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')}>
            Resolved
          </button>
        </div>
      </div>

      <div className="incident-stats">
        <div className={`stat-card ${getSeverityClass('critical')}`}>
          <div className="stat-number">{stats.critical}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className={`stat-card ${getSeverityClass('high')}`}>
          <div className="stat-number">{stats.high}</div>
          <div className="stat-label">High</div>
        </div>
        <div className={`stat-card ${getSeverityClass('medium')}`}>
          <div className="stat-number">{stats.medium}</div>
          <div className="stat-label">Medium</div>
        </div>
        <div className={`stat-card ${getSeverityClass('low')}`}>
          <div className="stat-number">{stats.low}</div>
          <div className="stat-label">Low</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading incidents...</div>
      ) : (
        <div className="incident-list">
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="incident-item" onClick={() => setSelectedIncident(incident)}>
              <div className="incident-info">
                <div className="incident-title">{incident.title}</div>
                <div className="incident-meta">
                  <span>{incident.category}</span>
                  <span>{incident.affectedUsers} users affected</span>
                </div>
              </div>
              <span className={`incident-status ${getStatusClass(incident.status)}`}>{incident.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentDashboard;
