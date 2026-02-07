import React, { useState, useEffect } from 'react';

interface SLO {
  id: string;
  name: string;
  description: string;
  serviceName: string;
  sliType: string;
  target: number;
  window: string;
  alertsEnabled: boolean;
}

interface SLOStatus {
  id: string;
  name: string;
  serviceName: string;
  sliType: string;
  target: number;
  current: number;
  status: 'healthy' | 'warning' | 'critical';
  errorBudgetRemaining: number;
}

export const SLODashboard: React.FC = () => {
  const [slos, setSlos] = useState<SLOStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSLO, setSelectedSLO] = useState<SLO | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSLO, setNewSLO] = useState({
    name: '',
    description: '',
    serviceName: '',
    sliType: 'availability',
    target: 99.9,
    window: '30d',
  });

  useEffect(() => {
    fetchSlos();
  }, []);

  const fetchSlos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/slo/health');
      const data = await response.json();
      setSlos(data.sloList || []);
    } catch (error) {
      console.error('Failed to fetch SLOs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSLO = async () => {
    try {
      await fetch('/api/v1/slo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSLO),
      });
      setShowCreateForm(false);
      setNewSLO({
        name: '',
        description: '',
        serviceName: '',
        sliType: 'availability',
        target: 99.9,
        window: '30d',
      });
      fetchSlos();
    } catch (error) {
      console.error('Failed to create SLO:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getSLITypeIcon = (type: string) => {
    switch (type) {
      case 'availability': return '✓';
      case 'latency': return '⚡';
      case 'quality': return '★';
      default: return '●';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">SLO/SLI Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Create SLO
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-3xl font-bold text-blue-500">{slos.length}</div>
          <div className="text-gray-500">Total SLOs</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-3xl font-bold text-green-500">
            {slos.filter(s => s.status === 'healthy').length}
          </div>
          <div className="text-gray-500">Healthy</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-3xl font-bold text-yellow-500">
            {slos.filter(s => s.status === 'warning').length}
          </div>
          <div className="text-gray-500">Warning</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-3xl font-bold text-red-500">
            {slos.filter(s => s.status === 'critical').length}
          </div>
          <div className="text-gray-500">Critical</div>
        </div>
      </div>

      {/* Create SLO Form */}
      {showCreateForm && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold">Create SLO</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={newSLO.name}
                onChange={(e) => setNewSLO({ ...newSLO, name: e.target.value })}
                className="w-full rounded border p-2"
                placeholder="API Availability"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Service Name</label>
              <input
                type="text"
                value={newSLO.serviceName}
                onChange={(e) => setNewSLO({ ...newSLO, serviceName: e.target.value })}
                className="w-full rounded border p-2"
                placeholder="api-service"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={newSLO.description}
                onChange={(e) => setNewSLO({ ...newSLO, description: e.target.value })}
                className="w-full rounded border p-2"
                placeholder="SLO description"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">SLI Type</label>
              <select
                value={newSLO.sliType}
                onChange={(e) => setNewSLO({ ...newSLO, sliType: e.target.value })}
                className="w-full rounded border p-2"
              >
                <option value="availability">Availability</option>
                <option value="latency">Latency</option>
                <option value="quality">Quality</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Target (%)</label>
              <input
                type="number"
                value={newSLO.target}
                onChange={(e) => setNewSLO({ ...newSLO, target: parseFloat(e.target.value) })}
                className="w-full rounded border p-2"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Window</label>
              <select
                value={newSLO.window}
                onChange={(e) => setNewSLO({ ...newSLO, window: e.target.value })}
                className="w-full rounded border p-2"
              >
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="365d">365 Days</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreateSLO}
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
      )}

      {/* SLO List */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Service Level Objectives</h2>
        {loading ? (
          <div className="py-4 text-center">Loading...</div>
        ) : (
          <div className="space-y-2">
            {slos.map((slo) => (
              <div
                key={slo.id}
                className={`rounded-lg border p-4 ${getStatusBg(slo.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSLITypeIcon(slo.sliType)}</span>
                    <div>
                      <div className="font-semibold">{slo.name}</div>
                      <div className="text-sm text-gray-500">{slo.serviceName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{slo.current.toFixed(2)}%</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{slo.target}%</div>
                      <div className="text-xs text-gray-500">Target</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getStatusColor(slo.status)}`}>
                        {slo.errorBudgetRemaining.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Error Budget</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBg(slo.status)} ${getStatusColor(slo.status)}`}>
                      {slo.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Progress to target</span>
                    <span>{Math.min(100, (slo.current / slo.target) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${slo.status === 'healthy' ? 'bg-green-500' : slo.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (slo.current / slo.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SLODashboard;
