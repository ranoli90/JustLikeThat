import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../services/security.service';

export const CompliancePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gdpr' | 'ccpa'>('gdpr');
  const [gdprData, setGdprData] = useState<any>(null);
  const [ccpaData, setCcpaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const [gdpr, ccpa] = await Promise.all([
        SecurityService.getGdprCompliance(),
        SecurityService.getCcpaCompliance(),
      ]);
      setGdprData(gdpr);
      setCcpaData(ccpa);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return '✓';
      case 'partial': return '~';
      case 'non-compliant': return '✗';
      default: return '?';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'compliant': return 'compliant';
      case 'partial': return 'partial';
      case 'non-compliant': return 'non-compliant';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading compliance data...</div>;
  }

  const currentData = activeTab === 'gdpr' ? gdprData : ccpaData;

  return (
    <div className="compliance-panel">
      <h2>Compliance Management</h2>
      
      <div className="compliance-tabs">
        <button
          className={`tab ${activeTab === 'gdpr' ? 'active' : ''}`}
          onClick={() => setActiveTab('gdpr')}
        >
          GDPR
        </button>
        <button
          className={`tab ${activeTab === 'ccpa' ? 'active' : ''}`}
          onClick={() => setActiveTab('ccpa')}
        >
          CCPA
        </button>
      </div>

      <div className="compliance-overview">
        <div className="score-card">
          <h3>{activeTab === 'gdpr' ? 'GDPR' : 'CCPA'} Compliance Score</h3>
          <div className="score-circle">
            <span className="score">{currentData?.overallScore || 0}%</span>
          </div>
        </div>
      </div>

      <div className="compliance-details">
        {activeTab === 'gdpr' && gdprData && (
          <>
            <section className="compliance-section">
              <h3>Data Processing</h3>
              <div className="checklist">
                {gdprData.dataProcessing?.map((check: any) => (
                  <div key={check.id} className={`check-item ${getStatusClass(check.status)}`}>
                    <span className="status-icon">{getStatusIcon(check.status)}</span>
                    <div className="check-content">
                      <span className="requirement">{check.requirement}</span>
                      {check.details && <span className="details">{check.details}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="compliance-section">
              <h3>Data Subject Rights</h3>
              <div className="checklist">
                {gdprData.dataSubjectRights?.map((check: any) => (
                  <div key={check.id} className={`check-item ${getStatusClass(check.status)}`}>
                    <span className="status-icon">{getStatusIcon(check.status)}</span>
                    <div className="check-content">
                      <span className="requirement">{check.requirement}</span>
                      {check.details && <span className="details">{check.details}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'ccpa' && ccpaData && (
          <section className="compliance-section">
            <h3>Privacy Rights</h3>
            <div className="checklist">
              {ccpaData.privacyRights?.map((check: any) => (
                <div key={check.id} className={`check-item ${getStatusClass(check.status)}`}>
                  <span className="status-icon">{getStatusIcon(check.status)}</span>
                  <div className="check-content">
                    <span className="requirement">{check.requirement}</span>
                    {check.details && <span className="details">{check.details}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="compliance-actions">
        <button
          className="export-btn"
          onClick={async () => {
            const report = await SecurityService.getComplianceReport(activeTab);
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeTab}-compliance-report.json`;
            a.click();
          }}
        >
          Export Report
        </button>
      </div>
    </div>
  );
};

export default CompliancePanel;
