// Innovation Sandbox Component - Sprint 48
import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenance.service';

interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: string;
  featureFlagKey: string;
  startDate?: string;
  endDate?: string;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  isEnabled: boolean;
}

export const InnovationSandbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState('experiments');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newExperiment, setNewExperiment] = useState({ name: '', description: '', hypothesis: '', featureFlagKey: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, flagRes] = await Promise.all([
        maintenanceService.getExperiments(),
        maintenanceService.getFeatureFlags(),
      ]);
      setExperiments(expRes);
      setFlags(flagRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleStart = async (id: string) => {
    try {
      await maintenanceService.startExperiment(id);
      await loadData();
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await maintenanceService.stopExperiment(id);
      await loadData();
    } catch (error) {
      console.error('Failed to stop experiment:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await maintenanceService.createExperiment(newExperiment);
      setShowCreate(false);
      setNewExperiment({ name: '', description: '', hypothesis: '', featureFlagKey: '' });
      await loadData();
    } catch (error) {
      console.error('Failed to create experiment:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return '#16a34a';
      case 'paused': return '#ca8a04';
      case 'completed': return '#2563eb';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Innovation Sandbox</h2>

      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('experiments')} style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === 'experiments' ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
          Experiments
        </button>
        <button onClick={() => setActiveTab('flags')} style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === 'flags' ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer' }}>
          Feature Flags
        </button>
      </div>

      {activeTab === 'experiments' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>Active experiments with A/B testing capabilities</p>
            <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              + New Experiment
            </button>
          </div>

          {showCreate && (
            <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ marginTop: 0 }}>Create Experiment</h4>
              <input placeholder="Name" value={newExperiment.name} onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })} style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <textarea placeholder="Description" value={newExperiment.description} onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })} style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <textarea placeholder="Hypothesis" value={newExperiment.hypothesis} onChange={(e) => setNewExperiment({ ...newExperiment, hypothesis: e.target.value })} style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <select value={newExperiment.featureFlagKey} onChange={(e) => setNewExperiment({ ...newExperiment, featureFlagKey: e.target.value })} style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <option value="">Select Feature Flag</option>
                {flags.map((f) => <option key={f.id} value={f.key}>{f.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {experiments.map((exp) => (
              <div key={exp.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{exp.name}</p>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>{exp.description}</p>
                    <p style={{ fontStyle: 'italic', color: '#6b7280', fontSize: '13px', margin: 0 }}>Hypothesis: {exp.hypothesis}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: `${getStatusColor(exp.status)  }20`, color: getStatusColor(exp.status) }}>
                      {exp.status}
                    </span>
                    {exp.status === 'draft' && (
                      <button onClick={() => handleStart(exp.id)} style={{ padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Start</button>
                    )}
                    {exp.status === 'running' && (
                      <button onClick={() => handleStop(exp.id)} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Stop</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'flags' && (
        <div className="card" style={{ padding: '16px' }}>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Manage feature flags in the dedicated Feature Flag Manager</p>
        </div>
      )}
    </div>
  );
};

export default InnovationSandbox;
