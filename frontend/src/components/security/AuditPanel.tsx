import React, { useState, useEffect } from 'react';
import { SecurityService } from '../../services/security.service';

export const AuditPanel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await SecurityService.getAuditLogs(filters);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select start and end dates for export');
      return;
    }
    setExporting(true);
    try {
      const data = await SecurityService.exportAuditLogs(filters.startDate, filters.endDate);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${filters.startDate}-${filters.endDate}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="audit-panel">
      <h2>Security Audit Logs</h2>
      
      <div className="panel-controls">
        <div className="filter-group">
          <label>
            User ID:
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user ID"
            />
          </label>
          <label>
            Action:
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Filter by action"
            />
          </label>
          <label>
            Start Date:
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </label>
        </div>
        <div className="button-group">
          <button className="refresh-btn" onClick={loadLogs}>Apply Filters</button>
          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Logs'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <div className="audit-log-list">
          {logs.length === 0 ? (
            <div className="empty-state">No audit logs found</div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th>Resource Type</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.action}</td>
                    <td>{log.userId || '-'}</td>
                    <td>{log.resourceType}</td>
                    <td>{log.ipAddress || '-'}</td>
                    <td>
                      {log.details && (
                        <button
                          className="details-btn"
                          onClick={() => alert(JSON.stringify(log.details, null, 2))}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditPanel;
