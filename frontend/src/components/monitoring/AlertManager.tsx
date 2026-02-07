import React, { useState, useEffect } from 'react';

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  status: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
}

interface AlertRule {
  id: string;
  name: string;
  expr: string;
  for: string;
  isActive: boolean;
}

export const AlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    expr: '',
    for: '1m',
    severity: 'warning',
  });

  useEffect(() => {
    fetchAlerts();
    fetchRules();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/v1/alerts/rules');
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      await fetch('/api/v1/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name,
          expr: newRule.expr,
          for: newRule.for,
          labels: { severity: newRule.severity },
          annotations: {},
        }),
      });
      setShowCreateForm(false);
      setNewRule({ name: '', expr: '', for: '1m', severity: 'warning' });
      fetchRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/v1/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-700';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'firing': return 'bg-red-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alert Manager</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Create Alert Rule
        </button>
      </div>

      {/* Create Rule Form */}
      {showCreateForm && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold">Create Alert Rule</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full rounded border p-2"
                placeholder="Alert name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Expression (PromQL)</label>
              <textarea
                value={newRule.expr}
                onChange={(e) => setNewRule({ ...newRule, expr: e.target.value })}
                className="w-full rounded border p-2"
                placeholder='rate(http_errors_total[5m]) > 0.05'
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">For Duration</label>
                <input
                  type="text"
                  value={newRule.for}
                  onChange={(e) => setNewRule({ ...newRule, for: e.target.value })}
                  className="w-full rounded border p-2"
                  placeholder="1m"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Severity</label>
                <select
                  value={newRule.severity}
                  onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                  className="w-full rounded border p-2"
                >
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateRule}
                className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Active Alerts</h2>
        {alerts.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No active alerts</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded border-l-4 p-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{alert.name}</span>
                    <span className={`ml-2 rounded px-2 py-1 text-xs ${getStatusBadge(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(alert.startsAt).toLocaleString()}
                    </span>
                    {alert.status === 'firing' && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
                {alert.annotations?.description && (
                  <p className="mt-2 text-sm">{alert.annotations.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Rules */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Alert Rules</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Expression</th>
              <th className="p-3 text-left">For</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{rule.name}</td>
                <td className="p-3 font-mono text-sm">{rule.expr}</td>
                <td className="p-3">{rule.for}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-1 text-xs ${
                    rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertManager;
