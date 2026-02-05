import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface UsageMetric {
  metricType: string;
  metricName: string;
  quantity: number;
  periodStart: string;
  periodEnd: string;
}

interface UsageSummary {
  [key: string]: number;
}

export const UsageTracker: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [usage, setUsage] = useState<UsageMetric[]>([]);
  const [summary, setSummary] = useState<UsageSummary>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadUsage();
  }, [tenantId, timeRange]);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const response = await fetch(
        `/api/v1/tenants/${tenantId}/usage?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      setUsage(data);

      // Calculate summary
      const summaryCalc: UsageSummary = {};
      data.forEach((item: UsageMetric) => {
        summaryCalc[item.metricType] = (summaryCalc[item.metricType] || 0) + item.quantity;
      });
      setSummary(summaryCalc);
    } catch (err) {
      console.error('Failed to load usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const metricCategories: Record<string, { label: string; color: string }> = {
    api_calls: { label: 'API Calls', color: 'bg-blue-500' },
    storage_bytes: { label: 'Storage', color: 'bg-green-500' },
    emails_sent: { label: 'Emails Sent', color: 'bg-purple-500' },
    webhooks_triggered: { label: 'Webhooks', color: 'bg-orange-500' },
    users_created: { label: 'Users', color: 'bg-teal-500' },
    applications: { label: 'Applications', color: 'bg-indigo-500' },
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usage Tracking</h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${timeRange === range ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <>
          {/* Usage Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.entries(summary).map(([metric, value]) => (
              <Card key={metric} className="p-4">
                <div className={`w-2 h-8 rounded ${metricCategories[metric]?.color || 'bg-gray-500'} mb-2`} />
                <h3 className="text-gray-500 text-sm">{metricCategories[metric]?.label || metric}</h3>
                <p className="text-2xl font-bold">{formatNumber(value as number)}</p>
              </Card>
            ))}
          </div>

          {/* Usage Chart Placeholder */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4">Usage Over Time</h3>
            <div className="h-48 flex items-end justify-between gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const height = Math.random() * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </Card>

          {/* Usage Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Detailed Usage</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Metric</th>
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-right py-2 px-4">Quantity</th>
                    <th className="text-left py-2 px-4">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.slice(0, 20).map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 px-4">{item.metricName}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {item.metricType}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-semibold">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-500">
                        {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default UsageTracker;
