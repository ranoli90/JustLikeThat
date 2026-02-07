import React, { useState, useEffect } from 'react';

interface Metric {
  name: string;
  labels: Record<string, string>;
  value: number;
  timestamp: string;
}

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  status: string;
  startsAt: string;
}

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  useEffect(() => {
    fetchMetricNames();
    fetchAlerts();
  }, []);

  const fetchMetricNames = async () => {
    try {
      const response = await fetch('/api/v1/metrics/series');
      const data = await response.json();
      setMetricNames(data.names || []);
    } catch (error) {
      console.error('Failed to fetch metric names:', error);
    }
  };

  const fetchMetrics = async (metricName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/metrics/query?name=${metricName}`);
      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/alerts?status=firing');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleMetricSelect = (metricName: string) => {
    setSelectedMetric(metricName);
    fetchMetrics(metricName);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="mb-6 text-2xl font-bold">Metrics Dashboard</h1>

      {/* Alert Summary */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Active Alerts</h2>
        {alerts.length === 0 ? (
          <div className="text-green-500">No active alerts</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 rounded bg-gray-50 p-2">
                <span className={`size-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                <span className="font-medium">{alert.name}</span>
                <span className="text-sm text-gray-500">{alert.severity}</span>
                <span className="ml-auto text-sm text-gray-500">
                  {new Date(alert.startsAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metric Selector */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Metrics</h2>
        <select
          value={selectedMetric}
          onChange={(e) => handleMetricSelect(e.target.value)}
          className="w-full rounded border p-2"
        >
          <option value="">Select a metric...</option>
          {metricNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Metrics Table */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">
          {selectedMetric ? selectedMetric : 'Select a metric to view data'}
        </h2>
        {loading ? (
          <div className="py-4 text-center">Loading...</div>
        ) : metrics.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Labels</th>
                <th className="p-3 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{metric.value.toFixed(4)}</td>
                  <td className="p-3">
                    <pre className="text-xs">{JSON.stringify(metric.labels)}</pre>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(metric.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-4 text-center text-gray-500">No data available</div>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboard;
