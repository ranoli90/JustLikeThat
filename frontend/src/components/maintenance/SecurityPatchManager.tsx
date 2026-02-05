// Security Patch Manager Component - Sprint 48
import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenance.service';

interface SecurityPatch {
  id: string;
  vulnerabilityId: string;
  severity: string;
  affectedSystems: string[];
  patchVersion: string;
  status: string;
  deployedAt?: string;
  createdAt: string;
}

interface Vulnerability {
  id: string;
  cveId?: string;
  title: string;
  severity: string;
  cvssScore?: number;
  affectedPackage: string;
  status: string;
}

export const SecurityPatchManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('patches');
  const [patches, setPatches] = useState<SecurityPatch[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patchesRes, dashboardRes, complianceRes] = await Promise.all([
        maintenanceService.getSecurityPatches(),
        maintenanceService.getSecurityDashboard(),
        maintenanceService.checkCompliance(),
      ]);
      setPatches(patchesRes);
      setDashboard(dashboardRes);
      setCompliance(complianceRes);
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
    setLoading(false);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await maintenanceService.scanVulnerabilities();
      await loadData();
    } catch (error) {
      console.error('Scan failed:', error);
    }
    setScanning(false);
  };

  const handleDeploy = async (patchId: string) => {
    try {
      await maintenanceService.deployPatch(patchId);
      await loadData();
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'deployed': return '#16a34a';
      case 'testing': return '#2563eb';
      case 'available': return '#ca8a04';
      case 'failed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading security data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Security Patch Manager</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Critical</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
            {dashboard?.summary?.critical || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>High</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>
            {dashboard?.summary?.high || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Patches Deployed</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
            {dashboard?.summary?.patchesDeployed || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Compliance</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: compliance?.compliant ? '#16a34a' : '#dc2626', margin: 0 }}>
            {compliance?.compliant ? 'Pass' : 'Fail'}
          </p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('patches')} style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === 'patches' ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
          Patches
        </button>
        <button onClick={() => setActiveTab('vulnerabilities')} style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === 'vulnerabilities' ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
          Vulnerabilities
        </button>
        <button onClick={handleScan} disabled={scanning} style={{ padding: '10px 20px', border: 'none', borderBottom: '2px solid transparent', background: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
          {scanning ? 'Scanning...' : '🔍 Scan Now'}
        </button>
      </div>

      {activeTab === 'patches' && (
        <div className="card" style={{ padding: '16px' }}>
          {patches.map((patch) => (
            <div key={patch.id} style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{patch.vulnerabilityId}</p>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Version: {patch.patchVersion}</p>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0' }}>Affected: {patch.affectedSystems.join(', ')}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: getSeverityColor(patch.severity) + '20', color: getSeverityColor(patch.severity) }}>
                  {patch.severity}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: getStatusColor(patch.status) + '20', color: getStatusColor(patch.status) }}>
                  {patch.status}
                </span>
                {patch.status === 'available' && (
                  <button onClick={() => handleDeploy(patch.id)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Deploy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'vulnerabilities' && (
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Run a scan to see vulnerabilities</p>
        </div>
      )}
    </div>
  );
};

export default SecurityPatchManager;
