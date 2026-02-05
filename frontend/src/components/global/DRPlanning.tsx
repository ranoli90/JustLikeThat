import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface DRPlan {
  planId: string;
  name: string;
  rtoMinutes: number;
  rpoMinutes: number;
  testSchedule: 'monthly' | 'quarterly' | 'manual';
  lastTest?: string;
  nextTest?: string;
}

interface FailoverEvent {
  eventId: string;
  regionId: string;
  eventType: 'planned' | 'unplanned';
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  triggerReason: string;
  startedAt: string;
  completedAt?: string;
  affectedUsers: number;
  dataLoss: number;
}

interface DRMetrics {
  activePlans: number;
  upcomingTests: number;
  recentFailovers: number;
  averageRTO: number;
  averageRPO: number;
  backupCount: number;
  lastBackup?: string;
}

export const DRPlanning: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'plans' | 'events' | 'backups'>('plans');

  const { data: metrics, isLoading: metricsLoading } = useQuery<DRMetrics>({
    queryKey: ['/api/v1/global/dr/metrics'],
  });

  const { data: plans, isLoading: plansLoading } = useQuery<DRPlan[]>({
    queryKey: ['/api/v1/global/dr/plans'],
  });

  const { data: failoverEvents, isLoading: eventsLoading } = useQuery<FailoverEvent[]>({
    queryKey: ['/api/v1/global/dr/failover-events'],
  });

  const testMutation = useMutation({
    mutationFn: async ({ planId, testType }: { planId: string; testType: 'full' | 'partial' | 'simulation' }) => {
      const response = await fetch('/api/v1/global/dr/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, testType }),
      });
      return response.json();
    },
  });

  const failoverMutation = useMutation({
    mutationFn: async ({ planId, regionId, reason }: { planId: string; regionId: string; reason: string }) => {
      const response = await fetch('/api/v1/global/dr/failover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, regionId, reason }),
      });
      return response.json();
    },
  });

  const backupMutation = useMutation({
    mutationFn: async ({ databaseId, backupType }: { databaseId: string; backupType: 'full' | 'incremental' | 'differential' }) => {
      const response = await fetch('/api/v1/global/dr/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId, backupType }),
      });
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
      case 'active': return 'bg-green-100 text-green-800';
      case 'failed':
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disaster Recovery Planning</h1>
        <p className="text-gray-600">Manage DR plans, run tests, and monitor failover events</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Active Plans</div>
          <div className="text-2xl font-bold text-blue-600">{metrics?.activePlans || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Upcoming Tests</div>
          <div className="text-2xl font-bold text-yellow-600">{metrics?.upcomingTests || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Recent Failovers</div>
          <div className="text-2xl font-bold text-red-600">{metrics?.recentFailovers || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Avg RTO</div>
          <div className="text-2xl font-bold text-green-600">{metrics?.averageRTO || 0}m</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Avg RPO</div>
          <div className="text-2xl font-bold text-purple-600">{metrics?.averageRPO || 0}m</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Backups</div>
          <div className="text-2xl font-bold text-indigo-600">{metrics?.backupCount || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['plans', 'events', 'backups'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Plans Tab */}
      {selectedTab === 'plans' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Disaster Recovery Plans</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Create Plan
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {plans?.map((plan) => (
              <div key={plan.planId} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor('active')}`}>
                        {plan.testSchedule}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">RTO:</span>
                        <span className="ml-1 font-medium">{plan.rtoMinutes} minutes</span>
                      </div>
                      <div>
                        <span className="text-gray-500">RPO:</span>
                        <span className="ml-1 font-medium">{plan.rpoMinutes} minutes</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Test:</span>
                        <span className="ml-1 font-medium">
                          {plan.lastTest ? new Date(plan.lastTest).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Test:</span>
                        <span className="ml-1 font-medium">
                          {plan.nextTest ? new Date(plan.nextTest).toLocaleDateString() : 'Not scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => testMutation.mutate({ planId: plan.planId, testType: 'simulation' })}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    >
                      Test (Sim)
                    </button>
                    <button
                      onClick={() => testMutation.mutate({ planId: plan.planId, testType: 'partial' })}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      Test (Partial)
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {selectedTab === 'events' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Failover Events</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {failoverEvents?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No failover events recorded
              </div>
            ) : (
              failoverEvents?.map((event) => (
                <div key={event.eventId} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.eventType === 'planned' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {event.eventType}
                        </span>
                        <span className="font-medium text-gray-900">{event.triggerReason}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Started: {new Date(event.startedAt).toLocaleString()}
                        {event.completedAt && (
                          <> | Completed: {new Date(event.completedAt).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-500">Affected Users</div>
                      <div className="font-medium">{event.affectedUsers}</div>
                      <div className="text-gray-500 mt-1">Data Loss</div>
                      <div className="font-medium">{event.dataLoss}s</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backups Tab */}
      {selectedTab === 'backups' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Backup Records</h3>
            <button
              onClick={() => backupMutation.mutate({ databaseId: 'db-primary', backupType: 'full' })}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Backup
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-sm">Backup history and restore points will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
};
