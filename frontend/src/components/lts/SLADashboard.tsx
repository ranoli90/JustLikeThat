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
    return <span className={`px-2 py-1 rounded ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  if (loading) {
    return <div className="p-4">Loading SLA dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="lts-sla-dashboard p-6">
      <h1 className="text-2xl font-bold mb-6">SLA Monitoring Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-2">Overall Compliance</div>
          <div className="text-3xl font-bold" style={{ color: getComplianceColor(dashboard?.overallCompliance || 0) }}>
            {dashboard?.overallCompliance?.toFixed(2) || 0}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Target: 99.9%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-2">Active Configs</div>
          <div className="text-3xl font-bold">{dashboard?.activeConfigs || 0}</div>
          <div className="text-xs text-gray-400 mt-1">SLA definitions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-2">Violations (24h)</div>
          <div className="text-3xl font-bold text-red-600">{dashboard?.violationsLast24h || 0}</div>
          <div className="text-xs text-gray-400 mt-1">Requires attention</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-2">Services Monitored</div>
          <div className="text-3xl font-bold">{Object.keys(dashboard?.metricsByService || {}).length}</div>
          <div className="text-xs text-gray-400 mt-1">Active services</div>
        </div>
      </div>

      {/* Service Status */}
      {dashboard?.metricsByService && Object.keys(dashboard.metricsByService).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Service Status</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(dashboard.metricsByService).map(([service, data]: [string, any]) => (
              <div key={service} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
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
      <div className="flex border-b mb-4">
        {(['overview', 'configs', 'violations', 'recommendations'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'configs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    <span className={`px-2 py-1 rounded ${config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    <span className={`px-2 py-1 rounded ${violation.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {violation.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{JSON.stringify(violation.details)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${violation.acknowledged ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                      {violation.acknowledged ? 'Acknowledged' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {!violation.acknowledged && (
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
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
            <div key={index} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{rec.type}</h3>
                  <p className="text-gray-600 mt-1">{rec.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Expected improvement: {rec.expectedImprovement}%
                  </div>
                </div>
                <span className={`px-2 py-1 rounded ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {rec.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Real-Time Monitoring</h2>
          <div className="text-center py-8 text-gray-500">
            Real-time SLA monitoring is active. Check individual tabs for detailed views.
          </div>
        </div>
      )}
    </div>
  );
};

export default SLADashboard;
