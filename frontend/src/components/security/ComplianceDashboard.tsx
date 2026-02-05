import React, { useState, useEffect } from 'react';
import './SecurityComponents.css';

interface ComplianceControl {
  id: string;
  framework: string;
  controlId: string;
  name: string;
  description: string;
  implementation: string;
  status: string;
  riskLevel: string;
  lastTested: string;
  nextTest: string;
}

export const ComplianceDashboard: React.FC = () => {
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState('SOC2');
  const [complianceScore, setComplianceScore] = useState(0);

  useEffect(() => {
    fetchComplianceData();
  }, [selectedFramework]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/security/compliance/reports/${selectedFramework}`);
      const data = await response.json();
      setControls(data.controls || []);
      setComplianceScore(data.score || 0);
    } catch (error) {
      // Mock data for demo
      setControls(generateMockControls(selectedFramework, 10));
      setComplianceScore(Math.floor(Math.random() * 30) + 70);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#16a34a';
    if (score >= 70) return '#ca8a04';
    return '#dc2626';
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'compliant': return 'compliant';
      case 'non_compliant': return 'non-compliant';
      default: return 'pending';
    }
  };

  const frameworks = ['SOC2', 'GDPR', 'HIPAA', 'ISO27001'];

  return (
    <div className="compliance-dashboard">
      <div className="compliance-header">
        <h3>Compliance Dashboard</h3>
        <div className="framework-tabs">
          {frameworks.map((fw) => (
            <button
              key={fw}
              className={`framework-tab ${selectedFramework === fw ? 'active' : ''}`}
              onClick={() => setSelectedFramework(fw)}
            >
              {fw}
            </button>
          ))}
        </div>
      </div>

      <div className="compliance-score">
        <div className="score-circle" style={{ borderColor: getScoreColor(complianceScore) }}>
          <div className="score-value">{complianceScore}%</div>
          <div className="score-label">{selectedFramework} Score</div>
        </div>
        <div className="compliance-summary">
          <div className="summary-stat">
            <span className="summary-value">
              {controls.filter((c) => c.status === 'compliant').length}
            </span>
            <span className="summary-label">Compliant</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {controls.filter((c) => c.status === 'non_compliant').length}
            </span>
            <span className="summary-label">Non-Compliant</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {controls.filter((c) => c.status === 'partial').length}
            </span>
            <span className="summary-label">Partial</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading compliance data...</div>
      ) : (
        <div className="controls-list">
          {controls.map((control) => (
            <div key={control.id} className="control-item">
              <div className="control-info">
                <h4>{control.controlId}: {control.name}</h4>
                <p>{control.description}</p>
              </div>
              <div className="control-meta">
                <span className={`control-status ${getStatusClass(control.status)}`}>
                  {control.status.replace('_', ' ')}
                </span>
                <span className="control-risk">{control.riskLevel} risk</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function generateMockControls(framework: string, count: number): ComplianceControl[] {
  const statuses = ['compliant', 'partial', 'non_compliant'];
  const riskLevels = ['low', 'medium', 'high'];

  return Array.from({ length: count }, (_, i) => ({
    id: `${framework.toLowerCase()}-${i}`,
    framework,
    controlId: `${framework}.${String(i + 1).padStart(3, '0')}`,
    name: `Control ${i + 1}`,
    description: `Description for ${framework} control ${i + 1}`,
    implementation: 'Implemented via automated monitoring',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    lastTested: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    nextTest: new Date(Date.now() + Math.random() * 90 * 86400000).toISOString(),
  }));
}

export default ComplianceDashboard;
