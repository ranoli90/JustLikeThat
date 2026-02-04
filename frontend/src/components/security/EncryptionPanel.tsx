import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../services/security.service';

export const EncryptionPanel: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    loadEncryptionStatus();
  }, []);

  const loadEncryptionStatus = async () => {
    setLoading(true);
    try {
      const data = await SecurityService.getEncryptionStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load encryption status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKey = async () => {
    setRotating(true);
    try {
      await SecurityService.rotateEncryptionKey();
      await loadEncryptionStatus();
    } catch (error) {
      console.error('Failed to rotate key:', error);
    } finally {
      setRotating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading encryption status...</div>;
  }

  return (
    <div className="encryption-panel">
      <h2>Data Encryption</h2>
      
      <div className="encryption-status">
        <div className="status-section">
          <h3>Encryption Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Algorithm:</span>
              <span className="value">{status?.algorithm}</span>
            </div>
            <div className="status-item">
              <span className="label">Key Length:</span>
              <span className="value">{status?.keyLength} bits</span>
            </div>
            <div className="status-item">
              <span className="label">At Rest Encryption:</span>
              <span className={`value ${status?.atRestEncryption ? 'enabled' : 'disabled'}`}>
                {status?.atRestEncryption ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">In Transit Encryption:</span>
              <span className={`value ${status?.inTransitEncryption ? 'enabled' : 'disabled'}`}>
                {status?.inTransitEncryption ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="key-rotation">
          <h3>Key Rotation</h3>
          <div className="rotation-info">
            <div className="info-item">
              <span className="label">Rotation Interval:</span>
              <span className="value">{status?.rotationInterval} days</span>
            </div>
            <div className="info-item">
              <span className="label">Last Rotation:</span>
              <span className="value">
                {status?.lastRotation
                  ? new Date(status.lastRotation).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Next Rotation:</span>
              <span className="value">
                {status?.nextRotation
                  ? new Date(status.nextRotation).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
          <button
            className="rotate-btn"
            onClick={handleRotateKey}
            disabled={rotating}
          >
            {rotating ? 'Rotating...' : 'Rotate Encryption Key'}
          </button>
        </div>

        <div className="encryption-features">
          <h3>Encryption Features</h3>
          <ul>
            <li>AES-256-GCM authenticated encryption</li>
            <li>Hardware Security Module (HSM) integration ready</li>
            <li>Automatic key rotation scheduling</li>
            <li>Secure key storage and management</li>
            <li>Encryption at rest for all sensitive data</li>
            <li>TLS 1.3 for data in transit</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EncryptionPanel;
