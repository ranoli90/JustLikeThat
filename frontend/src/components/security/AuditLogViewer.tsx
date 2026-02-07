import React, { useState, useEffect } from 'react';
import './SecurityComponents.css';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string | null;
  details: Record<string, any>;
  riskLevel: string;
  createdAt: string;
}

interface AuditLogViewerProps {
  tenantId?: string;
  onViewDetails?: (log: AuditLog) => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  tenantId = 'default',
  onViewDetails,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    riskLevel: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, [tenantId, pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      });

      const response = await fetch(`/api/v1/security/audit-logs?${params}`);
      const data = await response.json();

      setLogs(data.logs || []);
      setPagination((prev) => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      // Mock data for demo
      setLogs(generateMockLogs(20));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#ca8a04';
      case 'low':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/v1/security/audit-logs/export?startDate=${filters.startDate || '1970-01-01'}&endDate=${new Date().toISOString()}`
      );
      const data = await response.json();

      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="audit-log-viewer">
      <div className="audit-header">
        <h3>Security Audit Logs</h3>
        <div className="audit-filters">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="EXPORT">Export</option>
          </select>

          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="End Date"
          />

          <button onClick={handleExport} className="export-btn">
            Export
          </button>
        </div>
      </div>

      <div className="audit-table-container">
        {loading ? (
          <div className="loading">Loading audit logs...</div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Resource</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Risk Level</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.resource}</td>
                  <td className="p-3">{log.user?.email || log.userId}</td>
                  <td className="p-3">{log.resourceType}</td>
                  <td>
                    <span
                      className="risk-badge"
                      style={{ backgroundColor: getRiskColor(log.riskLevel) }}
                    >
                      {log.riskLevel}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate" title={Array.isArray(log.details?.changes) ? log.details.changes.at(-1) : ''}>
                    {Array.isArray(log.details?.changes) ? log.details.changes.at(-1) : ''}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => onViewDetails?.(log)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="audit-pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
          }
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of{' '}
          {Math.ceil(pagination.total / pagination.limit)}
        </span>
        <button
          disabled={
            pagination.page >= Math.ceil(pagination.total / pagination.limit)
          }
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Mock data generator
function generateMockLogs(count: number): AuditLog[] {
  const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'ACCESS'];
  const resources = ['User', 'Application', 'Resume', 'Interview', 'Report', 'Settings'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];

  return Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    userId: i % 3 === 0 ? `user-${i}` : null,
    action: actions[Math.floor(Math.random() * actions.length)],
    resource: resources[Math.floor(Math.random() * resources.length)],
    resourceId: `resource-${i}`,
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    userAgent: 'Mozilla/5.0',
    details: { key: 'value' },
    riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

export default AuditLogViewer;
