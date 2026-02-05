import React, { useState, useEffect } from 'react';

interface RemediationAction {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  condition: Record<string, any>;
  action: Record<string, any>;
  isActive: boolean;
  successCount: number;
  failureCount: number;
  lastTriggered?: string;
}

interface RemediationExecution {
  id: string;
  actionId: string;
  actionName: string;
  triggerType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  result?: Record<string, any>;
  error?: string;
}

export const RemediationCenter: React.FC = () => {
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [predefined, setPredefined] = useState<RemediationAction[]>([]);
  const [executions, setExecutions] = useState<RemediationExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({
    totalActions: 0,
    activeActions: 0,
    successRate: 0,
    avgExecutionTime: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [remediationRes, statsRes] = await Promise.all([
        fetch('/api/v1/remediation'),
        fetch('/api/v1/remediation/stats'),
      ]);
      const remediationData = await remediationRes.json();
      const statsData = await statsRes.json();

      setActions(remediationData.actions || []);
      setPredefined(remediationData.predefined || []);
      setStats({
        totalActions: statsData.totalActions || 0,
        activeActions: statsData.activeActions || 0,
        successRate: statsData.successRate || 0,
        avgExecutionTime: statsData.avgExecutionTime || 0,
      });
    } catch (error) {
      console.error('Failed to fetch remediation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/v1/remediation/${actionId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual' }),
      });
      const data = await response.json();
      alert(`Execution started: ${data.executionId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  };

  const handleCreateAction = async (action: Partial<RemediationAction>) => {
    try {
      await fetch('/api/v1/remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create action:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Automated Remediation Center</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Remediation Action
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-500">{stats.totalActions}</div>
          <div className="text-gray-500">Total Actions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-500">{stats.activeActions}</div>
          <div className="text-gray-500">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-purple-500">{stats.successRate.toFixed(1)}%</div>
          <div className="text-gray-500">Success Rate</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-orange-500">{stats.avgExecutionTime.toFixed(1)}s</div>
          <div className="text-gray-500">Avg Execution Time</div>
        </div>
      </div>

      {/* Create Action Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Create Remediation Action</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Action name"
                id="actionName"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Type</label>
                <select className="w-full p-2 border rounded" id="triggerType">
                  <option value="metric">Metric Threshold</option>
                  <option value="alert">Alert Triggered</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <select className="w-full p-2 border rounded" id="actionType">
                  <option value="scale">Scale</option>
                  <option value="restart">Restart</option>
                  <option value="rollback">Rollback</option>
                  <option value="circuit_breaker">Circuit Breaker</option>
                  <option value="notify">Notify</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const name = (document.getElementById('actionName') as HTMLInputElement).value;
                  const triggerType = (document.getElementById('triggerType') as HTMLSelectElement).value;
                  const actionType = (document.getElementById('actionType') as HTMLSelectElement).value;
                  handleCreateAction({
                    name,
                    triggerType,
                    condition: {},
                    action: { type: actionType },
                  });
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Remediation Actions */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Active Remediation Actions</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{action.name}</div>
                    <div className="text-sm text-gray-500">
                      Trigger: {action.triggerType} | Action: {action.action?.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-500">{action.successCount}</div>
                      <div className="text-xs text-gray-500">Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-500">{action.failureCount}</div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                    <button
                      onClick={() => handleExecuteAction(action.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Predefined Actions */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Predefined Remediation Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {predefined.map((action) => (
            <div key={action.name} className="p-4 border rounded-lg">
              <div className="font-semibold">{action.name}</div>
              <div className="text-sm text-gray-500 mt-1">{action.description}</div>
              <div className="text-xs text-gray-400 mt-2">
                Trigger: {action.triggerType} | Action: {action.action?.type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RemediationCenter;
