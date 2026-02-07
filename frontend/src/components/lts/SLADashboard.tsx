// SLA Dashboard Component - Sprint 49
import React, { useState, useEffect } from 'react';
import ltsService, { SLADefinition, SLAViolation, NPSMetrics } from '../../services/lts.service';

interface SLADashboardProps {
  tenantId?: string;
}

const SLADashboard: React.FC<SLADashboardProps> = ({ tenantId }) => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [configs, setConfigs] = useState<SLADefinition[]>([]);
  const [violations, setViolations] = useState<SLAViolation[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'configs' | 'violations' | 'recommendations'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardData, configsData, violationsData, recsData] = await Promise.all([
        ltsService.getSLADashboard(tenantId),
        ltsService.getSLAConfigs(tenantId),
        ltsService.getSLAViolations({ tenantId, acknowledged: false }),
        ltsService.getSLARecommendations(tenantId),
      ]);
      setDashboard(dashboardData);
      setConfigs(configsData);
      setViolations(violationsData);
      setRecommendations(recsData);
    } catch (err) {
      setError('Failed to load SLA dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeViolation = async (id: string) => {
    try {
      await ltsService.acknowledgeViolation(id, 'system');
      loadDashboardData();
    } catch (err) {
      setError('Failed to acknowledge violation');
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 99.9) return '#10b981'; // green
    if (compliance >= 99) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return <span className={`rounded px-2 py-1 ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  if (loading) {
    return <div className="p-4">Loading SLA dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="lts-sla-dashboard p-6">
      <h1 className="mb-6 text-2xl font-bold">SLA Monitoring Dashboard</h1>

      {/* Overview Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="mb-2 text-sm text-gray-500">Overall Compliance</div>
          <div className="text-3xl font-bold" style={{ color: getComplianceColor(dashboard?.overallCompliance || 0) }}>
            {dashboard?.overallCompliance?.toFixed(2) || 0}%
          </div>
          <div className="mt-1 text-xs text-gray-400">Target: 99.9%</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="mb-2 text-sm text-gray-500">Active Configs</div>
          <div className="text-3xl font-bold">{dashboard?.activeConfigs || 0}</div>
          <div className="mt-1 text-xs text-gray-400">SLA definitions</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="mb-2 text-sm text-gray-500">Violations (24h)</div>
          <div className="text-3xl font-bold text-red-600">{dashboard?.violationsLast24h || 0}</div>
          <div className="mt-1 text-xs text-gray-400">Requires attention</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="mb-2 text-sm text-gray-500">Services Monitored</div>
          <div className="text-3xl font-bold">{Object.keys(dashboard?.metricsByService || {}).length}</div>
          <div className="mt-1 text-xs text-gray-400">Active services</div>
        </div>
      </div>

      {/* Service Status */}
      {dashboard?.metricsByService && Object.keys(dashboard.metricsByService).length > 0 && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold">Service Status</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(dashboard.metricsByService).map(([service, data]: [string, any]) => (
              <div key={service} className="rounded border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{service}</span>
                  {getStatusBadge(data.status)}
                </div>
                <div className="text-2xl font-bold" style={{ color: getComplianceColor(data.compliance) }}>
                  {data.compliance?.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-400">Compliance rate</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex border-b">
        {(['overview', 'configs', 'violations', 'recommendations'] as const).map((tab) => (
          <button
            key={tab}
            className={`border-b-2 px-4 py-2 ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'configs' && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-left">Metric</th>
                <th className="px-4 py-2 text-left">Target</th>
                <th className="px-4 py-2 text-left">Period</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id} className="border-t">
                  <td className="px-4 py-2">{config.serviceName}</td>
                  <td className="px-4 py-2">{config.metricType}</td>
                  <td className="px-4 py-2">{config.targetValue} {config.measurementUnit}</td>
                  <td className="px-4 py-2">{config.period}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-1 ${config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'violations' && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Severity</th>
                <th className="px-4 py-2 text-left">Details</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((violation) => (
                <tr key={violation.id} className="border-t">
                  <td className="px-4 py-2">{violation.violationType}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-1 ${violation.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {violation.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{JSON.stringify(violation.details)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-1 ${violation.acknowledged ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                      {violation.acknowledged ? 'Acknowledged' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {!violation.acknowledged && (
                      <button
                        className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                        onClick={() => acknowledgeViolation(violation.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{rec.type}</h3>
                  <p className="mt-1 text-gray-600">{rec.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Expected improvement: {rec.expectedImprovement}%
                  </div>
                </div>
                <span className={`rounded px-2 py-1 ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {rec.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold">Real-Time Monitoring</h2>
          <div className="py-8 text-center text-gray-500">
            Real-time SLA monitoring is active. Check individual tabs for detailed views.
          </div>
        </div>
      )}
    </div>
  );
};

export default SLADashboard;
