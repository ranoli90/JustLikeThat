import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface IngestionStats {
  totalSources: number;
  activeSources: number;
  totalJobsIngested: number;
  todayJobsIngested: number;
  duplicatesFiltered: number;
  failedIngestions: number;
}

interface CostStats {
  daily: number;
  monthly: number;
  bySource: {
    sourceId: string;
    creditsUsed: number;
    dailyCost: number;
    monthlyCost: number;
  }[];
}

interface OptimizationRecommendation {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export function JobIngestionMonitoring() {
  const [stats, setStats] = useState<IngestionStats | null>(null);
  const [costs, setCosts] = useState<CostStats | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ingestionRes, costRes, optRes] = await Promise.all([
        fetch('/api/jobs/ingestion-stats').then(r => r.json()),
        fetch('/api/jobs/costs').then(r => r.json()),
        fetch('/api/jobs/optimization').then(r => r.json()),
      ]);
      
      setStats(ingestionRes);
      setCosts(costRes);
      setRecommendations(optRes.recommendations || []);
    } catch (err) {
      console.error('Failed to load monitoring data', err);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    try {
      const response = await fetch('/api/jobs/optimize', { method: 'POST' });
      const result = await response.json();
      alert(result.message || 'Optimization complete');
      fetchData();
    } catch (err) {
      alert('Optimization failed');
    }
  };

  if (loading) {
    return <div className="p-6">Loading monitoring data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Job Ingestion Monitoring</h1>
        <Button onClick={runOptimization}>Run Optimization</Button>
      </div>

      {/* Ingestion Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats?.totalSources || 0}</p>
          <p className="text-sm text-gray-600">Total Sources</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats?.activeSources || 0}</p>
          <p className="text-sm text-gray-600">Active Sources</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats?.totalJobsIngested || 0}</p>
          <p className="text-sm text-gray-600">Total Jobs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{stats?.todayJobsIngested || 0}</p>
          <p className="text-sm text-gray-600">Today's Jobs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats?.duplicatesFiltered || 0}</p>
          <p className="text-sm text-gray-600">Duplicates</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{stats?.failedIngestions || 0}</p>
          <p className="text-sm text-gray-600">Failed</p>
        </Card>
      </div>

      {/* Cost Overview */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Cost Analysis</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Daily Cost</p>
            <p className="text-2xl font-bold">${((costs?.daily || 0) / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="text-2xl font-bold">${((costs?.monthly || 0) / 100).toFixed(2)}</p>
          </div>
        </div>
        
        {costs?.bySource && costs.bySource.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Cost by Source</h3>
            <div className="space-y-2">
              {costs.bySource.map(source => (
                <div key={source.sourceId} className="flex items-center justify-between">
                  <span className="text-sm">{source.sourceId}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {source.creditsUsed} credits
                    </span>
                    <span className="text-sm font-medium">
                      ${(source.monthlyCost / 100).toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Rate Limits */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Rate Limits</h2>
        <RateLimitsDisplay />
      </Card>

      {/* Recommendations */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Optimization Recommendations</h2>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border ${
                  rec.priority === 'high'
                    ? 'bg-red-50 border-red-200'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <p className="text-sm">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recommendations at this time.</p>
        )}
      </Card>

      {/* Recent Ingestion Logs */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Ingestion Activity</h2>
        <IngestionLogsList />
      </Card>
    </div>
  );
}

function RateLimitsDisplay() {
  const [rateLimits, setRateLimits] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/jobs/rate-limits')
      .then(r => r.json())
      .then(data => setRateLimits(data.data || {}))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-3">
      {Object.entries(rateLimits).map(([sourceId, limit]: [string, any]) => (
        <div key={sourceId} className="flex items-center justify-between">
          <span className="font-medium">{sourceId}</span>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (limit.remaining / limit.limit) < 0.2
                    ? 'bg-red-500'
                    : (limit.remaining / limit.limit) < 0.5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, (limit.remaining / limit.limit) * 100)}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-24 text-right">
              {limit.remaining}/{limit.limit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IngestionLogsList() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/jobs/ingestion-logs?size=10')
      .then(r => r.json())
      .then(data => setLogs(data.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-2">
      {logs.map((log: any) => (
        <div key={log.id} className="flex items-center justify-between p-2 border rounded">
          <div>
            <p className="font-medium">{log.jobSourceId}</p>
            <p className="text-sm text-gray-600">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-600">{log.jobsIngested || 0} ingested</span>
            <span className="text-yellow-600">{log.jobsDuplicated || 0} dupes</span>
            <span className={`px-2 py-0.5 text-xs rounded ${
              log.status === 'SUCCESS'
                ? 'bg-green-100 text-green-800'
                : log.status === 'FAILED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {log.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
