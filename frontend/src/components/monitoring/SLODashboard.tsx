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
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SLO/SLI Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create SLO
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-500">{slos.length}</div>
          <div className="text-gray-500">Total SLOs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-500">
            {slos.filter(s => s.status === 'healthy').length}
          </div>
          <div className="text-gray-500">Healthy</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-yellow-500">
            {slos.filter(s => s.status === 'warning').length}
          </div>
          <div className="text-gray-500">Warning</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-red-500">
            {slos.filter(s => s.status === 'critical').length}
          </div>
          <div className="text-gray-500">Critical</div>
        </div>
      </div>

      {/* Create SLO Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Create SLO</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newSLO.name}
                onChange={(e) => setNewSLO({ ...newSLO, name: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="API Availability"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Name</label>
              <input
                type="text"
                value={newSLO.serviceName}
                onChange={(e) => setNewSLO({ ...newSLO, serviceName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="api-service"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newSLO.description}
                onChange={(e) => setNewSLO({ ...newSLO, description: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="SLO description"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SLI Type</label>
              <select
                value={newSLO.sliType}
                onChange={(e) => setNewSLO({ ...newSLO, sliType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="availability">Availability</option>
                <option value="latency">Latency</option>
                <option value="quality">Quality</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target (%)</label>
              <input
                type="number"
                value={newSLO.target}
                onChange={(e) => setNewSLO({ ...newSLO, target: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Window</label>
              <select
                value={newSLO.window}
                onChange={(e) => setNewSLO({ ...newSLO, window: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="365d">365 Days</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateSLO}
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
      )}

      {/* SLO List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Service Level Objectives</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-2">
            {slos.map((slo) => (
              <div
                key={slo.id}
                className={`p-4 rounded-lg border ${getStatusBg(slo.status)}`}
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(slo.status)} ${getStatusColor(slo.status)}`}>
                      {slo.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to target</span>
                    <span>{Math.min(100, (slo.current / slo.target) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
