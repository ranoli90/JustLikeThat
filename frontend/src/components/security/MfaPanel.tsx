import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../services/security.service';

interface MfaPanelProps {
  userId?: string;
}

export const MfaPanel: React.FC<MfaPanelProps> = ({ userId }) => {
  const [status, setStatus] = useState<any>(null);
  const [setupData, setSetupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email' | 'webauthn'>('totp');

  useEffect(() => {
    if (userId) {
      loadMfaStatus();
    }
  }, [userId]);

  const loadMfaStatus = async () => {
    setLoading(true);
    try {
      const data = await SecurityService.getMfaStatus(userId!);
      setStatus(data);
    } catch (error) {
      console.error('Failed to load MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSettingUp(true);
    try {
      const data = await SecurityService.setupMfa({
        userId: userId!,
        method: selectedMethod,
      });
      setSetupData(data);
    } catch (error) {
      console.error('Failed to setup MFA:', error);
    } finally {
      setSettingUp(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) return;
    setVerifying(true);
    try {
      const result = await SecurityService.verifyMfa({
        userId: userId!,
        code: verificationCode,
        method: selectedMethod,
      });
      if (result.success) {
        setSetupData(null);
        setVerificationCode('');
        await loadMfaStatus();
      } else {
        alert(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Failed to verify MFA:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable MFA? This will reduce your account security.')) {
      return;
    }
    try {
      await SecurityService.disableMfa(userId!);
      await loadMfaStatus();
    } catch (error) {
      console.error('Failed to disable MFA:', error);
    }
  };

  if (!userId) {
    return <div className="mfa-panel">Please log in to manage MFA settings</div>;
  }

  if (loading) {
    return <div className="loading">Loading MFA status...</div>;
  }

  return (
    <div className="mfa-panel">
      <h2>Multi-Factor Authentication</h2>
      
      <div className="mfa-status">
        <div className="status-card">
          <h3>Current Status</h3>
          {status?.enabled ? (
            <div className="enabled-status">
              <span className="status-icon enabled">✓</span>
              <span>MFA is enabled with {status.method?.toUpperCase()}</span>
              <span className="backup-codes">
                Backup codes remaining: {status.backupCodesRemaining}
              </span>
            </div>
          ) : (
            <div className="disabled-status">
              <span className="status-icon disabled">✗</span>
              <span>MFA is not enabled</span>
            </div>
          )}
        </div>
      </div>

      {!status?.enabled && !setupData && (
        <div className="setup-section">
          <h3>Setup MFA</h3>
          <div className="method-selection">
            <label className={selectedMethod === 'totp' ? 'selected' : ''}>
              <input
                type="radio"
                name="method"
                value="totp"
                checked={selectedMethod === 'totp'}
                onChange={() => setSelectedMethod('totp')}
              />
              Authenticator App (TOTP)
            </label>
            <label className={selectedMethod === 'sms' ? 'selected' : ''}>
              <input
                type="radio"
                name="method"
                value="sms"
                checked={selectedMethod === 'sms'}
                onChange={() => setSelectedMethod('sms')}
              />
              SMS
            </label>
            <label className={selectedMethod === 'email' ? 'selected' : ''}>
              <input
                type="radio"
                name="method"
                value="email"
                checked={selectedMethod === 'email'}
                onChange={() => setSelectedMethod('email')}
              />
              Email
            </label>
            <label className={selectedMethod === 'webauthn' ? 'selected' : ''}>
              <input
                type="radio"
                name="method"
                value="webauthn"
                checked={selectedMethod === 'webauthn'}
                onChange={() => setSelectedMethod('webauthn')}
              />
              Hardware Key (WebAuthn)
            </label>
          </div>
          <button
            className="setup-btn"
            onClick={handleSetup}
            disabled={settingUp}
          >
            {settingUp ? 'Setting up...' : 'Setup MFA'}
          </button>
        </div>
      )}

      {setupData && (
        <div className="verification-section">
          <h3>Verify Setup</h3>
          <div className="qr-section">
            {setupData.qrCodeUrl && (
              <div className="qr-code">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUrl)}`}
                  alt="QR Code"
                />
                <p>Scan this QR code with your authenticator app</p>
              </div>
            )}
            <div className="manual-entry">
              <p>Or enter this secret manually:</p>
              <code>{setupData.secret}</code>
            </div>
          </div>
          <div className="backup-codes-section">
            <h4>Backup Codes</h4>
            <p>Save these codes in a safe place. You can use them to access your account if you lose your authenticator.</p>
            <div className="backup-codes-list">
              {setupData.backupCodes?.map((code: string, i: number) => (
                <code key={i}>{code}</code>
              ))}
            </div>
          </div>
          <div className="verify-section">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="verification-input"
            />
            <button
              className="verify-btn"
              onClick={handleVerify}
              disabled={verifying || verificationCode.length !== 6}
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {status?.enabled && (
        <div className="mfa-actions">
          <button className="disable-btn" onClick={handleDisable}>
            Disable MFA
          </button>
        </div>
      )}
    </div>
  );
};

export default MfaPanel;
