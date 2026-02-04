import React, { useState, useEffect } from 'react';
import { SecurityService } from '../services/security.service';
import { ThreatPanel } from './security/ThreatPanel';
import { EncryptionPanel } from './security/EncryptionPanel';
import { AuditPanel } from './security/AuditPanel';
import { MfaPanel } from './security/MfaPanel';
import { CompliancePanel } from './security/CompliancePanel';
import { ConsentPanel } from './security/ConsentPanel';
import { VulnerabilityPanel } from './security/VulnerabilityPanel';

interface SecurityDashboardProps {
  userId?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await SecurityService.getSecurityDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load security dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🔒' },
    { id: 'threats', label: 'Threat Detection', icon: '⚠️' },
    { id: 'encryption', label: 'Encryption', icon: '🔐' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
    { id: 'mfa', label: 'Multi-Factor Auth', icon: '📱' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'consent', label: 'Privacy Consent', icon: '🤝' },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: '🐛' },
  ];

  if (loading) {
    return (
      <div className="security-dashboard loading">
        <div className="loading-spinner">Loading security dashboard...</div>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      <header className="security-header">
        <h1>Security & Compliance Center</h1>
        <div className="security-status">
          {dashboardData?.overview?.status === 'healthy' && (
            <span className="status-badge healthy">System Healthy</span>
          )}
          {dashboardData?.overview?.status === 'warning' && (
            <span className="status-badge warning">Attention Required</span>
          )}
          {dashboardData?.overview?.status === 'critical' && (
            <span className="status-badge critical">Critical Alert</span>
          )}
        </div>
      </header>

      {dashboardData && (
        <div className="security-overview-cards">
          <div className="overview-card">
            <h3>Security Score</h3>
            <div className="score-display">{dashboardData.overview?.securityScore}%</div>
          </div>
          <div className="overview-card">
            <h3>Active Threats</h3>
            <div className="count-display">{dashboardData.activeThreats || 0}</div>
          </div>
          <div className="overview-card">
            <h3>Open Incidents</h3>
            <div className="count-display">{dashboardData.openIncidents || 0}</div>
          </div>
          <div className="overview-card">
            <h3>Open Vulnerabilities</h3>
            <div className="count-display">
              {(dashboardData.vulnerabilities?.critical || 0) +
                (dashboardData.vulnerabilities?.high || 0)}
            </div>
          </div>
          <div className="overview-card">
            <h3>Compliance Score</h3>
            <div className="score-display">{dashboardData.complianceScore || 0}%</div>
          </div>
        </div>
      )}

      <nav className="security-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="security-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <h2>Security Overview</h2>
            {dashboardData?.recommendations && (
              <div className="recommendations">
                <h3>Recommendations</h3>
                <ul>
                  {dashboardData.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button onClick={() => SecurityService.runVulnerabilityScan()}>
                Run Vulnerability Scan
              </button>
              <button onClick={() => SecurityService.applyRetentionPolicies()}>
                Apply Retention Policies
              </button>
              <button onClick={() => SecurityService.rotateEncryptionKey()}>
                Rotate Encryption Key
              </button>
            </div>
          </div>
        )}
        {activeTab === 'threats' && <ThreatPanel />}
        {activeTab === 'encryption' && <EncryptionPanel />}
        {activeTab === 'audit' && <AuditPanel />}
        {activeTab === 'mfa' && <MfaPanel userId={userId} />}
        {activeTab === 'compliance' && <CompliancePanel />}
        {activeTab === 'consent' && <ConsentPanel userId={userId} />}
        {activeTab === 'vulnerabilities' && <VulnerabilityPanel />}
      </main>
    </div>
  );
};

export default SecurityDashboard;
