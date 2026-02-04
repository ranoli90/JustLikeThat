import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../services/security.service';

interface ConsentPanelProps {
  userId?: string;
}

export const ConsentPanel: React.FC<ConsentPanelProps> = ({ userId }) => {
  const [consentData, setConsentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadConsentData();
    }
  }, [userId]);

  const loadConsentData = async () => {
    setLoading(true);
    try {
      const data = await SecurityService.getUserConsent(userId!);
      setConsentData(data);
    } catch (error) {
      console.error('Failed to load consent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (consentType: string, granted: boolean) => {
    setUpdating(consentType);
    try {
      const consent = consentData.config.find((c: any) => c.id === consentType);
      await SecurityService.updateConsent({
        userId: userId!,
        consentType,
        granted,
        version: consent?.version || '1.0',
      });
      await loadConsentData();
    } catch (error) {
      console.error('Failed to update consent:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await SecurityService.exportUserData(userId!);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${userId}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }
    try {
      await SecurityService.deleteUserData(userId!);
      alert('Your data has been deleted');
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };

  if (!userId) {
    return <div className="consent-panel">Please log in to manage your consent settings</div>;
  }

  if (loading) {
    return <div className="loading">Loading consent data...</div>;
  }

  return (
    <div className="consent-panel">
      <h2>Privacy Consent Management</h2>
      
      <div className="consent-intro">
        <p>Manage your privacy preferences and data sharing consent below.</p>
      </div>

      <div className="consent-list">
        {consentData?.consents?.map((record: any) => {
          const config = consentData.config.find((c: any) => c.id === record.consentType);
          return (
            <div key={record.consentType} className="consent-item">
              <div className="consent-info">
                <h4>{config?.name || record.consentType}</h4>
                <p>{config?.description}</p>
                {config?.required && (
                  <span className="required-badge">Required</span>
                )}
              </div>
              <div className="consent-controls">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={record.granted}
                    disabled={config?.required || updating === record.consentType}
                    onChange={(e) => handleConsentChange(record.consentType, e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="consent-status">
                  {record.granted ? 'Granted' : 'Denied'}
                </span>
                {record.grantedAt && (
                  <span className="consent-date">
                    Granted: {new Date(record.grantedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="data-rights-section">
        <h3>Your Data Rights</h3>
        <div className="data-actions">
          <button className="action-btn export" onClick={handleExportData}>
            Export My Data
          </button>
          <button className="action-btn delete" onClick={handleDeleteData}>
            Delete My Data
          </button>
        </div>
        <p className="data-rights-info">
          Under GDPR and CCPA, you have the right to access, export, and delete your personal data.
        </p>
      </div>

      <div className="consent-history">
        <h3>Consent History</h3>
        <div className="history-list">
          {consentData?.consents?.filter((c: any) => c.grantedAt || c.revokedAt).map((record: any) => (
            <div key={record.consentType} className="history-item">
              <span className="consent-type">{record.consentType}</span>
              <span className="action">
                {record.grantedAt && !record.revokedAt ? 'Granted' : 'Revoked'}
              </span>
              <span className="date">
                {record.grantedAt || record.revokedAt
                  ? new Date(record.grantedAt || record.revokedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsentPanel;
