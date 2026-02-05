import React, { useState, useEffect } from 'react';
import { MetricsAPI } from '../../services/maturity.service';

interface PlatformMetrics {
  id: string;
  date: string;
  uptime: number;
  performance: number;
  security: number;
  userSatisfaction: number;
  costEfficiency: number;
  overallScore: number;
}

export const PlatformMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      const limit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const [metricsRes, latestRes, healthRes] = await Promise.all([
        MetricsAPI.getAll(limit),
        MetricsAPI.getLatest(),
        MetricsAPI.getHealthStatus(),
      ]);
      setMetrics(metricsRes);
      setLatestMetrics(latestRes);
      setHealthStatus(healthRes);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading platform metrics...</div>;

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'warning';
    return 'critical';
  };

  return (
    <div className="platform-metrics">
      <div className="header">
        <h1>📊 Platform Metrics Dashboard</h1>
        <div className="time-range">
          <button className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>7 Days</button>
          <button className={timeRange === '30d' ? 'active' : ''} onClick={() => setTimeRange('30d')}>30 Days</button>
          <button className={timeRange === '90d' ? 'active' : ''} onClick={() => setTimeRange('90d')}>90 Days</button>
        </div>
      </div>

      {healthStatus && (
        <div className="health-status">
          <h2>System Health</h2>
          <div className="health-grid">
            <div className={`health-card ${healthStatus.status}`}>
              <span className="icon">{healthStatus.status === 'healthy' ? '✅' : healthStatus.status === 'degraded' ? '⚠️' : '❌'}</span>
              <span className="label">Overall Status</span>
              <span className="value">{healthStatus.status}</span>
            </div>
            {healthStatus.components && Object.entries(healthStatus.components).map(([component, status]) => (
              <div key={component} className={`health-card ${status as string}`}>
                <span className="label">{component}</span>
                <span className="value">{status as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {latestMetrics && (
        <div className="latest-metrics">
          <h2>Latest Metrics</h2>
          <div className="metrics-grid">
            <div className={`metric-card ${getScoreColor(latestMetrics.uptime)}`}>
              <h3>Uptime</h3>
              <p className="value">{latestMetrics.uptime?.toFixed(2)}%</p>
              <span className="target">Target: 99.99%</span>
            </div>
            <div className={`metric-card ${getScoreColor(latestMetrics.performance)}`}>
              <h3>Performance</h3>
              <p className="value">{latestMetrics.performance?.toFixed(1)}</p>
              <span className="target">Target: 90+</span>
            </div>
            <div className={`metric-card ${getScoreColor(latestMetrics.security)}`}>
              <h3>Security</h3>
              <p className="value">{latestMetrics.security?.toFixed(1)}</p>
              <span className="target">Target: 95+</span>
            </div>
            <div className={`metric-card ${getScoreColor(latestMetrics.userSatisfaction)}`}>
              <h3>User Satisfaction</h3>
              <p className="value">{latestMetrics.userSatisfaction?.toFixed(1)}</p>
              <span className="target">Target: 90+</span>
            </div>
            <div className={`metric-card ${getScoreColor(latestMetrics.costEfficiency)}`}>
              <h3>Cost Efficiency</h3>
              <p className="value">{latestMetrics.costEfficiency?.toFixed(1)}</p>
              <span className="target">Target: 85+</span>
            </div>
            <div className={`metric-card overall ${getScoreColor(latestMetrics.overallScore)}`}>
              <h3>Overall Score</h3>
              <p className="value">{latestMetrics.overallScore?.toFixed(1)}</p>
              <span className="target">Target: 90+</span>
            </div>
          </div>
        </div>
      )}

      <div className="metrics-chart">
        <h2>Historical Metrics</h2>
        <div className="chart-container">
          <div className="chart-placeholder">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Uptime</th>
                  <th>Performance</th>
                  <th>Security</th>
                  <th>User Satisfaction</th>
                  <th>Cost Efficiency</th>
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 10).map((metric) => (
                  <tr key={metric.id}>
                    <td>{new Date(metric.date).toLocaleDateString()}</td>
                    <td className={getScoreColor(metric.uptime)}>{metric.uptime?.toFixed(2)}%</td>
                    <td className={getScoreColor(metric.performance)}>{metric.performance?.toFixed(1)}</td>
                    <td className={getScoreColor(metric.security)}>{metric.security?.toFixed(1)}</td>
                    <td className={getScoreColor(metric.userSatisfaction)}>{metric.userSatisfaction?.toFixed(1)}</td>
                    <td className={getScoreColor(metric.costEfficiency)}>{metric.costEfficiency?.toFixed(1)}</td>
                    <td className={`overall ${getScoreColor(metric.overallScore)}`}>{metric.overallScore?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
