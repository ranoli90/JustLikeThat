// Dependency Updater Component - Sprint 48
import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenance.service';

interface DependencyUpdate {
  id: string;
  packageName: string;
  currentVersion: string;
  latestVersion: string;
  compatibility: string;
  status: string;
  vulnerabilityRisk?: string;
}

interface UpdateSchedule {
  nextMinorUpdate: string;
  nextMajorUpdate: string;
  lastUpdateRun: string;
  nextUpdateRun: string;
}

export const DependencyUpdater: React.FC = () => {
  const [dependencies, setDependencies] = useState<DependencyUpdate[]>([]);
  const [schedule, setSchedule] = useState<UpdateSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('outdated');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [depsRes, scheduleRes] = await Promise.all([
        maintenanceService.getOutdatedDependencies(),
        maintenanceService.getUpdateSchedule(),
      ]);
      setDependencies(depsRes);
      setSchedule(scheduleRes);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
    }
    setLoading(false);
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      await maintenanceService.checkForUpdates();
      await loadData();
    } catch (error) {
      console.error('Check failed:', error);
    }
    setChecking(false);
  };

  const handleUpdate = async (id: string) => {
    try {
      await maintenanceService.applyUpdate(id);
      await loadData();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleRollback = async (id: string) => {
    try {
      await maintenanceService.rollbackUpdate(id);
      await loadData();
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'applied': return '#16a34a';
      case 'approved': return '#2563eb';
      case 'testing': return '#ca8a04';
      case 'pending': return '#6b7280';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getCompatibilityColor = (compatibility: string): string => {
    switch (compatibility) {
      case 'compatible': return '#16a34a';
      case 'breaking': return '#dc2626';
      default: return '#ca8a04';
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Dependency Updater</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>Next Minor Update</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{schedule ? new Date(schedule.nextMinorUpdate).toLocaleDateString() : '-'}</p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>Next Major Update</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{schedule ? new Date(schedule.nextMajorUpdate).toLocaleDateString() : '-'}</p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>Last Scan</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{schedule ? new Date(schedule.lastUpdateRun).toLocaleDateString() : '-'}</p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '14px' }}>Pending Updates</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{dependencies.filter(d => d.status === 'pending').length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="tabs" style={{ borderBottom: 'none' }}>
          {['outdated', 'pending', 'applied'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: filter === f ? '#2563eb' : '#f3f4f6',
                color: filter === f ? 'white' : '#374151',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={handleCheckUpdates} disabled={checking} style={{ padding: '8px 16px', background: checking ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: checking ? 'not-allowed' : 'pointer' }}>
          {checking ? 'Checking...' : '🔍 Check for Updates'}
        </button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Package</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Current</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Latest</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Compatibility</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dependencies
              .filter((d) => filter === 'outdated' || d.status === filter)
              .map((dep) => (
                <tr key={dep.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{dep.packageName}</p>
                    {dep.vulnerabilityRisk && (
                      <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0 0' }}>{dep.vulnerabilityRisk}</p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{dep.currentVersion}</td>
                  <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 'bold' }}>{dep.latestVersion}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: getCompatibilityColor(dep.compatibility) + '20', color: getCompatibilityColor(dep.compatibility) }}>
                      {dep.compatibility}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: getStatusColor(dep.status) + '20', color: getStatusColor(dep.status) }}>
                      {dep.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {dep.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdate(dep.id)} style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>
                          Update
                        </button>
                        <button onClick={() => handleRollback(dep.id)} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Rollback
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DependencyUpdater;
