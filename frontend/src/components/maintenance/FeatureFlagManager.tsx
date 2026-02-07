// Feature Flag Manager Component - Sprint 48
import React, { useState, useEffect } from 'react';
import { maintenanceService, FeatureFlag } from '../../services/maintenance.service';

export const FeatureFlagManager: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '', rolloutPercentage: 0 });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await maintenanceService.getFeatureFlags();
      setFlags(data);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string) => {
    try {
      await maintenanceService.toggleFeatureFlag(id);
      await loadFlags();
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await maintenanceService.createFeatureFlag(newFlag);
      setShowCreate(false);
      setNewFlag({ key: '', name: '', description: '', rolloutPercentage: 0 });
      await loadFlags();
    } catch (error) {
      console.error('Failed to create flag:', error);
    }
  };

  const handleRollout = async (id: string, percentage: number) => {
    try {
      await maintenanceService.setRolloutPercentage(id, percentage);
      await loadFlags();
    } catch (error) {
      console.error('Failed to update rollout:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Feature Flag Manager</h2>
        <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          + New Flag
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
          <h4 style={{ marginTop: 0 }}>Create Feature Flag</h4>
          <input
            placeholder="Key (e.g., new-dashboard)"
            value={newFlag.key}
            onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          <input
            placeholder="Name"
            value={newFlag.name}
            onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          <textarea
            placeholder="Description"
            value={newFlag.description}
            onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {flags.map((flag) => (
          <div key={flag.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{flag.name}</p>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>{flag.key}</p>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{flag.description}</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Rollout: {flag.rolloutPercentage}%</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={flag.rolloutPercentage}
                  onChange={(e) => handleRollout(flag.id, parseInt(e.target.value, 10))}
                  style={{ width: '100px' }}
                />
              </div>
              <button
                onClick={() => handleToggle(flag.id)}
                style={{
                  padding: '8px 16px',
                  background: flag.isEnabled ? '#16a34a' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {flag.isEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureFlagManager;
