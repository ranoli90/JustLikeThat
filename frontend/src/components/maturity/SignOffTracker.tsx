import React, { useState, useEffect } from 'react';
import { SignOffAPI } from '../../services/maturity.service';

interface SignOff {
  id: string;
  stakeholderType: string;
  stakeholderId: string;
  area: string;
  status: string;
  comments?: string;
  evidence?: any;
  approvedAt?: string;
  expiresAt?: string;
}

export const SignOffTracker: React.FC = () => {
  const [signoffs, setSignoffs] = useState<SignOff[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [overallStatus, setOverallStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ stakeholderType: '', area: '', status: '' });
  const [selectedSignOff, setSelectedSignOff] = useState<SignOff | null>(null);

  useEffect(() => {
    loadSignOffs();
  }, [filter]);

  const loadSignOffs = async () => {
    try {
      const [signoffsRes, statsRes, overallRes] = await Promise.all([
        SignOffAPI.getAll({ limit: 50 }),
        SignOffAPI.getStats(),
        SignOffAPI.getOverallStatus(),
      ]);
      setSignoffs(signoffsRes.data);
      setStats(statsRes);
      setOverallStatus(overallRes);
    } catch (error) {
      console.error('Failed to load sign-offs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const comments = prompt('Enter approval comments (optional):');
    try {
      await SignOffAPI.approve(id, { comments: comments || undefined, evidence: { timestamp: new Date().toISOString() } });
      alert('Sign-off approved successfully!');
      loadSignOffs();
    } catch (error) {
      console.error('Failed to approve sign-off:', error);
    }
  };

  const handleReject = async (id: string) => {
    const comments = prompt('Enter rejection reason:');
    if (comments) {
      try {
        await SignOffAPI.reject(id, { comments });
        alert('Sign-off rejected');
        loadSignOffs();
      } catch (error) {
        console.error('Failed to reject sign-off:', error);
      }
    }
  };

  const stakeholderTypes = ['executive', 'engineering', 'security', 'compliance', 'operations', 'product'];
  const areas = ['performance', 'security', 'compliance', 'functionality', 'overall'];
  const statuses = ['pending', 'approved', 'rejected'];

  if (loading) return <div className="loading">Loading sign-off tracker...</div>;

  return (
    <div className="signoff-tracker">
      <div className="header">
        <h1>✅ Sign-Off Tracker</h1>
        <button className="primary">+ New Sign-Off Request</button>
      </div>

      {overallStatus && (
        <div className="overall-status">
          <h2>Platform Sign-Off Status</h2>
          <div className="status-grid">
            {Object.entries(overallStatus).map(([area, status]) => (
              <div key={area} className={`status-card ${status as string}`}>
                <h4>{area}</h4>
                <span className={`badge ${status}`}>{status as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sign-Offs</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card success">
            <h3>Approved</h3>
            <p>{stats.approved || 0}</p>
          </div>
          <div className="stat-card warning">
            <h3>Pending</h3>
            <p>{stats.pending || 0}</p>
          </div>
          <div className="stat-card danger">
            <h3>Rejected</h3>
            <p>{stats.rejected || 0}</p>
          </div>
        </div>
      )}

      <div className="filters">
        <select value={filter.stakeholderType} onChange={(e) => setFilter({ ...filter, stakeholderType: e.target.value })}>
          <option value="">All Stakeholder Types</option>
          {stakeholderTypes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.area} onChange={(e) => setFilter({ ...filter, area: e.target.value })}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="signoffs-list">
        {signoffs.map(signoff => (
          <div
            key={signoff.id}
            className={`signoff-card ${selectedSignOff?.id === signoff.id ? 'selected' : ''}`}
            onClick={() => setSelectedSignOff(signoff)}
          >
            <div className="signoff-header">
              <span className={`badge ${signoff.stakeholderType}`}>{signoff.stakeholderType}</span>
              <span className={`badge ${signoff.area}`}>{signoff.area}</span>
              <span className={`badge ${signoff.status}`}>{signoff.status}</span>
            </div>
            <div className="signoff-meta">
              <span>Stakeholder: {signoff.stakeholderId}</span>
              {signoff.approvedAt && (
                <span>Approved: {new Date(signoff.approvedAt).toLocaleDateString()}</span>
              )}
            </div>
            {signoff.comments && (
              <p className="comments">"{signoff.comments}"</p>
            )}
            <div className="signoff-actions">
              {signoff.status === 'pending' && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleApprove(signoff.id); }}>Approve</button>
                  <button onClick={(e) => { e.stopPropagation(); handleReject(signoff.id); }} className="danger">Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedSignOff && (
        <div className="signoff-details">
          <h3>Sign-Off Details</h3>
          <div className="detail-grid">
            <div><strong>Stakeholder Type:</strong> {selectedSignOff.stakeholderType}</div>
            <div><strong>Stakeholder ID:</strong> {selectedSignOff.stakeholderId}</div>
            <div><strong>Area:</strong> {selectedSignOff.area}</div>
            <div><strong>Status:</strong> {selectedSignOff.status}</div>
            <div><strong>Created:</strong> {new Date((selectedSignOff as any).createdAt || Date.now()).toLocaleString()}</div>
            {selectedSignOff.approvedAt && (
              <div><strong>Approved At:</strong> {new Date(selectedSignOff.approvedAt).toLocaleString()}</div>
            )}
            {selectedSignOff.expiresAt && (
              <div><strong>Expires At:</strong> {new Date(selectedSignOff.expiresAt).toLocaleString()}</div>
            )}
          </div>
          {selectedSignOff.comments && (
            <div className="comments-section">
              <h4>Comments</h4>
              <p>{selectedSignOff.comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
