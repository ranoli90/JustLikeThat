// ============ SYNC MONITOR ============

import React, { useState, useEffect } from 'react';

interface SyncLog {
  id: string;
  connectionType: string;
  syncType: string;
  status: string;
  recordsRead: number;
  recordsWritten: number;
  errors?: Array<{ message: string; timestamp: Date }>;
  startedAt: Date;
  completedAt?: Date;
}

interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  avgRecordsPerSync: number;
  avgDuration: number;
}

export const SyncMonitor: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<SyncStats>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    avgRecordsPerSync: 0,
    avgDuration: 0,
  });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/v1/enterprise-integrations/sync/logs');
      const data = await response.json();
      setLogs(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: SyncLog[]) => {
    const successful = logs.filter(l => l.status === 'success');
    const failed = logs.filter(l => l.status === 'failed');
    const totalRecords = logs.reduce((sum, l) => sum + l.recordsWritten, 0);
    const totalDuration = logs.reduce((sum, l) => {
      if (l.startedAt && l.completedAt) {
        return sum + (new Date(l.completedAt).getTime() - new Date(l.startedAt).getTime());
      }
      return sum;
    }, 0);

    setStats({
      totalSyncs: logs.length,
      successfulSyncs: successful.length,
      failedSyncs: failed.length,
      avgRecordsPerSync: logs.length > 0 ? Math.round(totalRecords / logs.length) : 0,
      avgDuration: logs.length > 0 ? Math.round(totalDuration / logs.length / 1000) : 0,
    });
  };

  const handleRetry = async (logId: string) => {
    try {
      await fetch(`/api/v1/enterprise-integrations/sync/${logId}/retry`, {
        method: 'POST',
      });
      alert('Retry initiated');
      fetchLogs();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'running': return 'blue';
      case 'failed': return 'red';
      case 'partial': return 'orange';
      default: return 'gray';
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(l => l.status === filter);

  if (loading) {
    return <div className="loading">Loading sync data...</div>;
  }

  return (
    <div className="sync-monitor">
      <h2>Sync Monitor</h2>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <h4>Total Syncs</h4>
          <p className="value">{stats.totalSyncs}</p>
        </div>
        <div className="stat-card success">
          <h4>Successful</h4>
          <p className="value">{stats.successfulSyncs}</p>
        </div>
        <div className="stat-card danger">
          <h4>Failed</h4>
          <p className="value">{stats.failedSyncs}</p>
        </div>
        <div className="stat-card">
          <h4>Avg Records/Sync</h4>
          <p className="value">{stats.avgRecordsPerSync.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h4>Avg Duration</h4>
          <p className="value">{stats.avgDuration}s</p>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <label>Filter by status:</label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="running">Running</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={fetchLogs} className="refresh-button">Refresh</button>
      </div>

      {/* Logs Table */}
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Sync Type</th>
              <th>Status</th>
              <th>Records Read</th>
              <th>Records Written</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.slice(0, 50).map(log => {
              const duration = log.startedAt && log.completedAt
                ? Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)
                : '-';
              
              return (
                <tr key={log.id}>
                  <td>{log.connectionType}</td>
                  <td>{log.syncType}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.recordsRead.toLocaleString()}</td>
                  <td>{log.recordsWritten.toLocaleString()}</td>
                  <td>{new Date(log.startedAt).toLocaleString()}</td>
                  <td>{typeof duration === 'number' ? `${duration}s` : duration}</td>
                  <td>
                    {log.status === 'failed' && (
                      <button onClick={() => handleRetry(log.id)} className="retry-button">
                        Retry
                      </button>
                    )}
                    {log.errors && log.errors.length > 0 && (
                      <button className="view-errors-button">View Errors</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="empty-state">
          <p>No sync logs found</p>
        </div>
      )}
    </div>
  );
};
