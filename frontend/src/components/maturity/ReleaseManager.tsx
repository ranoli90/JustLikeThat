import React, { useState, useEffect } from 'react';
import { ReleaseAPI } from '../../services/maturity.service';

interface Release {
  id: string;
  version: string;
  name: string;
  description: string;
  status: string;
  scheduledDate: string;
  riskLevel: string;
  releasedAt?: string;
}

export const ReleaseManager: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', riskLevel: '' });
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  useEffect(() => {
    loadReleases();
  }, [filter]);

  const loadReleases = async () => {
    try {
      const [releasesRes, statsRes] = await Promise.all([
        ReleaseAPI.getAll({ limit: 50 }),
        ReleaseAPI.getStats(),
      ]);
      setReleases(releasesRes.data);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await ReleaseAPI.approve(id, { approverRole: 'admin', approverId: 'current-user' });
      alert('Release approved successfully!');
      loadReleases();
    } catch (error) {
      console.error('Failed to approve release:', error);
    }
  };

  const handleDeploy = async (id: string, environment: string) => {
    try {
      await ReleaseAPI.deploy(id, { environment, deployedBy: 'current-user' });
      alert(`Deployment to ${environment} started!`);
      loadReleases();
    } catch (error) {
      console.error('Failed to deploy release:', error);
    }
  };

  const handleRollback = async (id: string) => {
    const reason = prompt('Enter rollback reason:');
    if (reason) {
      try {
        await ReleaseAPI.rollback(id, { reason, rolledBackBy: 'current-user' });
        alert('Rollback initiated successfully!');
        loadReleases();
      } catch (error) {
        console.error('Failed to rollback release:', error);
      }
    }
  };

  const statuses = ['planning', 'scheduled', 'in_progress', 'released', 'cancelled', 'rolled_back'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const environments = ['development', 'staging', 'production'];

  if (loading) return <div className="loading">Loading release manager...</div>;

  return (
    <div className="release-manager">
      <div className="header">
        <h1>🚀 Release Manager</h1>
        <button className="primary">+ New Release</button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Releases</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card success">
            <h3>Released</h3>
            <p>{stats.released}</p>
          </div>
          <div className="stat-card warning">
            <h3>In Progress</h3>
            <p>{stats.byStatus?.in_progress || 0}</p>
          </div>
          <div className="stat-card info">
            <h3>Scheduled</h3>
            <p>{stats.byStatus?.scheduled || 0}</p>
          </div>
        </div>
      )}

      <div className="filters">
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.riskLevel} onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value })}>
          <option value="">All Risk Levels</option>
          {riskLevels.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="releases-table">
        <table>
          <thead>
            <tr>
              <th>Version</th>
              <th>Name</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Scheduled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map(release => (
              <tr key={release.id} className={selectedRelease?.id === release.id ? 'selected' : ''}>
                <td>
                  <span className="version">{release.version}</span>
                </td>
                <td>
                  <div className="release-info">
                    <strong>{release.name}</strong>
                    <p>{release.description}</p>
                  </div>
                </td>
                <td>
                  <span className={`badge ${release.status}`}>{release.status}</span>
                </td>
                <td>
                  <span className={`risk-badge ${release.riskLevel}`}>{release.riskLevel}</span>
                </td>
                <td>{release.scheduledDate ? new Date(release.scheduledDate).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="actions">
                    <button onClick={() => setSelectedRelease(release)}>View</button>
                    {release.status === 'scheduled' && (
                      <>
                        <button onClick={() => handleApprove(release.id)}>Approve</button>
                        <button onClick={() => handleDeploy(release.id, 'staging')}>Deploy to Staging</button>
                      </>
                    )}
                    {release.status === 'released' && (
                      <button onClick={() => handleRollback(release.id)} className="danger">Rollback</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRelease && (
        <div className="release-details">
          <h2>{selectedRelease.name} ({selectedRelease.version})</h2>
          <p>{selectedRelease.description}</p>
          <div className="detail-grid">
            <div><strong>Status:</strong> {selectedRelease.status}</div>
            <div><strong>Risk Level:</strong> {selectedRelease.riskLevel}</div>
            <div><strong>Scheduled:</strong> {selectedRelease.scheduledDate ? new Date(selectedRelease.scheduledDate).toLocaleString() : '-'}</div>
            <div><strong>Released:</strong> {selectedRelease.releasedAt ? new Date(selectedRelease.releasedAt).toLocaleString() : '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};
