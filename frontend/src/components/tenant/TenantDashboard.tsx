import React, { useState, useEffect } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface TenantStats {
  users: number;
  applications: number;
  storageUsed: number;
  monthlyUsage: Record<string, number>;
}

export const TenantDashboard: React.FC = () => {
  const { tenant, loading, error, refreshTenant } = useTenant();
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenant?.id}/stats`);
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Tenant Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tenant?.name}</h1>
          <p className="text-gray-500">
            {tenant?.domain || `${tenant?.subdomain}.example.com`}
          </p>
        </div>
        <Badge variant={tenant?.status === 'ACTIVE' ? 'success' : 'warning'}>
          {tenant?.status}
        </Badge>
      </div>

      {/* Plan Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Current Plan</h3>
            <p className="text-2xl font-bold">{tenant?.plan}</p>
          </div>
          <Button variant="outline">Upgrade Plan</Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Total Users</h3>
          <p className="text-3xl font-bold">{stats?.users || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Applications</h3>
          <p className="text-3xl font-bold">{stats?.applications || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Storage Used</h3>
          <p className="text-3xl font-bold">
            {((stats?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-500">Data Residency</h3>
          <p className="text-3xl font-bold">{tenant?.dataResidency || 'US'}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="cursor-pointer p-4 transition-shadow hover:shadow-lg">
          <h3 className="mb-2 font-semibold">Branding</h3>
          <p className="text-sm text-gray-500">Customize your brand appearance</p>
          <Button variant="link" className="mt-2">Open Editor →</Button>
        </Card>
        <Card className="cursor-pointer p-4 transition-shadow hover:shadow-lg">
          <h3 className="mb-2 font-semibold">Custom Domains</h3>
          <p className="text-sm text-gray-500">Manage your custom domains</p>
          <Button variant="link" className="mt-2">Manage Domains →</Button>
        </Card>
        <Card className="cursor-pointer p-4 transition-shadow hover:shadow-lg">
          <h3 className="mb-2 font-semibold">Feature Flags</h3>
          <p className="text-sm text-gray-500">Toggle features on/off</p>
          <Button variant="link" className="mt-2">Manage Flags →</Button>
        </Card>
      </div>

      {/* Usage Overview */}
      <Card className="p-4">
        <h3 className="mb-4 font-semibold">Monthly Usage</h3>
        {statsLoading ? (
          <p>Loading usage data...</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats?.monthlyUsage || {}).map(([metric, value]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-semibold">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TenantDashboard;
