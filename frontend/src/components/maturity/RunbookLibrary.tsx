import React, { useState, useEffect } from 'react';
import { RunbookAPI } from '../../services/maturity.service';

interface Runbook {
  id: string;
  category: string;
  title: string;
  content: string;
  version: string;
  priority: string;
  status: string;
  estimatedTime?: number;
}

export const RunbookLibrary: React.FC = () => {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', priority: '' });

  useEffect(() => {
    loadRunbooks();
  }, [filter]);

  const loadRunbooks = async () => {
    try {
      const [runbooksRes, statsRes] = await Promise.all([
        RunbookAPI.getAll({ limit: 50 }),
        RunbookAPI.getStats(),
      ]);
      setRunbooks(runbooksRes.data);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load runbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRunbook = async (id: string) => {
    try {
      await RunbookAPI.execute(id, { executedBy: 'current-user', notes: 'Manual execution' });
      alert('Runbook executed successfully!');
    } catch (error) {
      console.error('Failed to execute runbook:', error);
    }
  };

  const categories = ['incident', 'deployment', 'troubleshooting', 'maintenance', 'escalation'];
  const priorities = ['critical', 'high', 'medium', 'low'];

  if (loading) return <div className="loading">Loading runbooks...</div>;

  return (
    <div className="runbook-library">
      <div className="header">
        <h1>📖 Runbook Library</h1>
        <button className="primary">+ New Runbook</button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Runbooks</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Total Executions</h3>
            <p>{stats.totalExecutions}</p>
          </div>
          <div className="stat-card success">
            <h3>Success Rate</h3>
            <p>{stats.successRate}%</p>
          </div>
        </div>
      )}

      <div className="filters">
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All Priorities</option>
          {priorities.map(pri => <option key={pri} value={pri}>{pri}</option>)}
        </select>
      </div>

      <div className="content">
        <div className="runbook-list">
          {runbooks.map(runbook => (
            <div
              key={runbook.id}
              className={`runbook-card ${selectedRunbook?.id === runbook.id ? 'selected' : ''}`}
              onClick={() => setSelectedRunbook(runbook)}
            >
              <h3>{runbook.title}</h3>
              <div className="meta">
                <span className={`badge ${runbook.category}`}>{runbook.category}</span>
                <span className={`priority ${runbook.priority}`}>{runbook.priority}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="runbook-detail">
          {selectedRunbook ? (
            <>
              <h2>{selectedRunbook.title}</h2>
              <div className="meta">
                <span>Version: {selectedRunbook.version}</span>
                <span>Priority: {selectedRunbook.priority}</span>
              </div>
              <pre>{selectedRunbook.content}</pre>
              <div className="actions">
                <button className="primary" onClick={() => executeRunbook(selectedRunbook.id)}>▶ Execute</button>
                <button>✏️ Edit</button>
              </div>
            </>
          ) : (
            <div className="placeholder">Select a runbook to view</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunbookLibrary;
