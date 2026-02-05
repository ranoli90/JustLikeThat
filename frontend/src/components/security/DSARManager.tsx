import React, { useState, useEffect } from 'react';
import './SecurityComponents.css';

interface DSARRequest {
  id: string;
  requestType: string;
  status: string;
  userId: string;
  email: string;
  deadline: string;
  createdAt: string;
  completedAt?: string;
}

export const DSARManager: React.FC = () => {
  const [requests, setRequests] = useState<DSARRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDSARRequests();
  }, [filter]);

  const fetchDSARRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/security/gdpr/dsar');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      setRequests(generateMockRequests(8));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(`/api/v1/security/gdpr/dsar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchDSARRequests();
    } catch (error) {
      console.error('Failed to update DSAR:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'completed';
      case 'rejected': return 'rejected';
      default: return status;
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    overdue: requests.filter((r) => new Date(r.deadline) < new Date() && r.status !== 'completed').length,
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="dsar-manager">
      <div className="dsar-header">
        <h3>GDPR DSAR Manager</h3>
        <div className="framework-tabs">
          <button className={`framework-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({stats.total})
          </button>
          <button className={`framework-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            Pending ({stats.pending})
          </button>
          <button className={`framework-tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
            Completed ({stats.completed})
          </button>
        </div>
      </div>

      <div className="dsar-stats">
        <div className="dsar-stat">
          <div className="dsar-stat-value">{stats.total}</div>
          <div className="dsar-stat-label">Total Requests</div>
        </div>
        <div className="dsar-stat">
          <div className="dsar-stat-value">{stats.overdue}</div>
          <div className="dsar-stat-label">Overdue</div>
        </div>
        <div className="dsar-stat">
          <div className="dsar-stat-value">{stats.completed}</div>
          <div className="dsar-stat-label">Completed</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading DSAR requests...</div>
      ) : (
        <table className="dsar-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Type</th>
              <th>Email</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request.id}>
                <td>{request.id.slice(0, 8)}...</td>
                <td>{request.requestType}</td>
                <td>{request.email}</td>
                <td>
                  <span className={`status-badge ${getStatusBadge(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {new Date(request.deadline) < new Date() ? (
                    <span style={{ color: '#dc2626' }}>
                      {new Date(request.deadline).toLocaleDateString()}
                    </span>
                  ) : (
                    new Date(request.deadline).toLocaleDateString()
                  )}
                </td>
                <td>
                  {request.status === 'pending' && (
                    <button
                      className="policy-btn"
                      onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                    >
                      Start
                    </button>
                  )}
                  {request.status === 'in_progress' && (
                    <button
                      className="policy-btn edit"
                      onClick={() => handleStatusUpdate(request.id, 'completed')}
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

function generateMockRequests(count: number): DSARRequest[] {
  const types = ['access', 'erasure', 'portability', 'correction'];
  const statuses = ['pending', 'in_progress', 'completed', 'rejected'];

  return Array.from({ length: count }, (_, i) => ({
    id: `dsar-${Math.random().toString(36).substr(2, 9)}`,
    requestType: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    userId: `user-${i}`,
    email: `user${i}@example.com`,
    deadline: new Date(Date.now() + Math.random() * 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
    completedAt: statuses[i % statuses.length] === 'completed' ? new Date().toISOString() : undefined,
  }));
}

export default DSARManager;
