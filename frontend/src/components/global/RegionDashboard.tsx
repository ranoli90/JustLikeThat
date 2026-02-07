import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface Region {
  regionId: string;
  name: string;
  cloudProvider: 'aws' | 'gcp' | 'azure';
  regionName: string;
  endpoint: string;
  status: 'active' | 'standby' | 'maintenance';
  priority: number;
  isPrimary: boolean;
}

interface RegionHealth {
  regionId: string;
  latency: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export const RegionDashboard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ['/api/v1/global/regions'],
  });

  const { data: healthData, isLoading: healthLoading } = useQuery<RegionHealth[]>({
    queryKey: ['/api/v1/global/health/regions'],
  });

  const failoverMutation = useMutation({
    mutationFn: async ({ fromRegion, toRegion, reason }: { fromRegion: string; toRegion: string; reason: string }) => {
      const response = await fetch(`/api/v1/global/regions/${fromRegion}/failover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRegion: toRegion, reason }),
      });
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'standby': return 'bg-yellow-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws': return '☁️';
      case 'gcp': return '🌐';
      case 'azure': return '🔷';
      default: return '🌍';
    }
  };

  if (regionsLoading || healthLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Global Region Dashboard</h1>
        <p className="text-gray-600">Monitor and manage multi-region deployment</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Total Regions</div>
          <div className="text-2xl font-bold text-gray-900">{regions?.length || 0}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Active Regions</div>
          <div className="text-2xl font-bold text-green-600">
            {regions?.filter(r => r.status === 'active').length || 0}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Avg Latency</div>
          <div className="text-2xl font-bold text-blue-600">
            {healthData?.reduce((sum, h) => sum + h.latency, 0) / (healthData?.length || 1) || 0}ms
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Cloud Providers</div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(regions?.map(r => r.cloudProvider)).size || 0}
          </div>
        </div>
      </div>

      {/* Region Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {regions?.map((region) => {
          const health = healthData?.find(h => h.regionId === region.regionId);
          return (
            <div
              key={region.regionId}
              className={`cursor-pointer rounded-lg bg-white p-4 shadow-md transition-all hover:shadow-lg ${
                selectedRegion === region.regionId ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedRegion(region.regionId)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getProviderIcon(region.cloudProvider)}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{region.name}</div>
                    <div className="text-xs text-gray-500">{region.regionName}</div>
                  </div>
                </div>
                <div className={`rounded-full px-2 py-1 text-xs text-white ${getStatusColor(region.status)}`}>
                  {region.status}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Endpoint:</span>
                  <span className="max-w-[150px] truncate text-gray-700">{region.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Priority:</span>
                  <span className="text-gray-700">{region.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Primary:</span>
                  <span className={region.isPrimary ? 'text-green-600' : 'text-gray-400'}>
                    {region.isPrimary ? '✓' : '○'}
                  </span>
                </div>
              </div>

              {health && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Latency</div>
                      <div className="font-medium">{health.latency.toFixed(0)}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-500">CPU</div>
                      <div className="font-medium">{health.cpuUsage.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Memory</div>
                      <div className="font-medium">{health.memoryUsage.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex space-x-2">
                <button
                  className="flex-1 rounded bg-blue-500 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    // View details
                  }}
                >
                  View Details
                </button>
                {region.status === 'active' && !region.isPrimary && (
                  <button
                    className="flex-1 rounded bg-red-500 py-2 text-sm text-white transition-colors hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      failoverMutation.mutate({
                        fromRegion: region.regionId,
                        toRegion: regions.find(r => r.isPrimary)?.regionId || '',
                        reason: 'Manual failover from dashboard',
                      });
                    }}
                  >
                    Failover
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Failover Modal */}
      {failoverMutation.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">Failover in Progress</h3>
            <div className="flex items-center justify-center py-8">
              <div className="size-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            </div>
            <p className="text-center text-gray-600">Please wait while failover is executing...</p>
          </div>
        </div>
      )}
    </div>
  );
};
