// ============ TALENT SYNC MANAGER ============

import React, { useState, useEffect } from 'react';

interface TalentSyncStatus {
  syncType: string;
  status: string;
  recordsProcessed: number;
  lastRun?: Date;
  errors?: string[];
}

export const TalentSyncManager: React.FC = () => {
  const [syncs, setSyncs] = useState<TalentSyncStatus[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);

  const syncTypes = [
    { id: 'succession', name: 'Succession Planning', description: 'Sync succession plans and candidate data' },
    { id: 'performance', name: 'Performance Reviews', description: 'Sync performance review data' },
    { id: 'compensation', name: 'Compensation Data', description: 'Sync salary and compensation information' },
    { id: 'lifecycle', name: 'Employee Lifecycle', description: 'Sync hire, promotion, and termination events' },
    { id: 'pools', name: 'Talent Pools', description: 'Sync talent pool memberships' },
  ];

  const handleSync = async (syncType: string) => {
    setSyncing(syncType);
    try {
      const response = await fetch('/api/v1/enterprise-integrations/talent/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType }),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh sync status
        fetchSyncs();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  const fetchSyncs = async () => {
    try {
      const response = await fetch('/api/v1/enterprise-integrations/talent/status/all');
      const data = await response.json();
      setSyncs(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  useEffect(() => {
    fetchSyncs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'running': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="talent-sync-manager">
      <h2>Talent Management Sync</h2>
      
      <div className="sync-grid">
        {syncTypes.map(sync => {
          const syncStatus = syncs.find(s => s.syncType === sync.id);
          const isSyncing = syncing === sync.id;
          
          return (
            <div key={sync.id} className="sync-card">
              <div className="sync-header">
                <h3>{sync.name}</h3>
                {syncStatus && (
                  <span className={`status-badge ${getStatusColor(syncStatus.status)}`}>
                    {syncStatus.status}
                  </span>
                )}
              </div>
              <p>{sync.description}</p>
              {syncStatus && (
                <div className="sync-stats">
                  <span>Records processed: {syncStatus.recordsProcessed}</span>
                  {syncStatus.lastRun && (
                    <span>Last run: {new Date(syncStatus.lastRun).toLocaleString()}</span>
                  )}
                </div>
              )}
              <button
                onClick={() => handleSync(sync.id)}
                disabled={isSyncing}
                className="sync-button"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="sync-history">
        <h3>Recent Sync History</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Records</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {syncs.slice(0, 10).map((sync, index) => (
              <tr key={index}>
                <td>{sync.syncType}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(sync.status)}`}>
                    {sync.status}
                  </span>
                </td>
                <td>{sync.recordsProcessed}</td>
                <td>{sync.lastRun ? new Date(sync.lastRun).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
