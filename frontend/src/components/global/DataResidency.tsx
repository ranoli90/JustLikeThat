import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface DataResidencyRule {
  ruleId: string;
  tenantId?: string;
  region: 'eu' | 'us' | 'apac' | 'uk' | 'canada';
  dataType: 'user_data' | 'application_data' | 'analytics_data';
  storageRegions: string[];
  isRequired: boolean;
  retentionDays: number;
}

interface ComplianceStatus {
  region: string;
  compliant: boolean;
  ruleCount: number;
  auditCount: number;
}

interface AuditLog {
  ruleId: string;
  operation: 'read' | 'write' | 'delete' | 'transfer';
  sourceRegion: string;
  targetRegion?: string;
  dataType: string;
  compliance: boolean;
  timestamp: string;
}

export const DataResidency: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const { data: rules, isLoading: rulesLoading } = useQuery<DataResidencyRule[]>({
    queryKey: ['/api/v1/global/residency/rules'],
  });

  const { data: compliance, isLoading: complianceLoading } = useQuery<ComplianceStatus[]>({
    queryKey: ['/api/v1/global/residency/compliance'],
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/v1/global/residency/audit'],
  });

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'eu': return 'bg-blue-500';
      case 'us': return 'bg-red-500';
      case 'apac': return 'bg-yellow-500';
      case 'uk': return 'bg-green-500';
      case 'canada': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getRegionLabel = (region: string) => {
    switch (region) {
      case 'eu': return 'European Union (GDPR)';
      case 'us': return 'United States (CCPA)';
      case 'apac': return 'Asia Pacific';
      case 'uk': return 'United Kingdom (UK GDPR)';
      case 'canada': return 'Canada (PIPEDA)';
      default: return region;
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'read': return '📖';
      case 'write': return '✏️';
      case 'delete': return '🗑️';
      case 'transfer': return '🔄';
      default: return '📋';
    }
  };

  if (rulesLoading || complianceLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Residency Compliance</h1>
        <p className="text-gray-600">Manage data sovereignty rules and compliance across regions</p>
      </div>

      {/* Compliance Overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        {compliance?.map((status) => (
          <div
            key={status.region}
            className={`cursor-pointer rounded-lg bg-white p-4 shadow transition-all hover:shadow-md ${
              selectedRegion === status.region ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedRegion(selectedRegion === status.region ? null : status.region)}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className={`size-3 rounded-full ${getRegionColor(status.region)}`}></div>
              <span className={`rounded px-2 py-1 text-xs ${
                status.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {status.compliant ? 'Compliant' : 'Non-Compliant'}
              </span>
            </div>
            <div className="font-semibold text-gray-900">{getRegionLabel(status.region)}</div>
            <div className="mt-2 text-sm text-gray-500">
              <div>{status.ruleCount} rules</div>
              <div>{status.auditCount} audits</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rules Table */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="text-lg font-medium">Data Residency Rules</h3>
            <button className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
              Add Rule
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Storage Regions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Retention</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rules?.map((rule) => (
                  <tr key={rule.ruleId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRegionColor(rule.region)} text-white`}>
                        {rule.region.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rule.dataType}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {rule.storageRegions.slice(0, 2).map((region) => (
                          <span key={region} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                            {region}
                          </span>
                        ))}
                        {rule.storageRegions.length > 2 && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                            +{rule.storageRegions.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rule.retentionDays} days</td>
                    <td className="px-4 py-3">
                      {rule.isRequired ? (
                        <span className="text-green-600">✓ Required</span>
                      ) : (
                        <span className="text-gray-400">Optional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-medium">Recent Audit Logs</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {auditLogs?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No audit logs available
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {auditLogs?.map((log, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getOperationIcon(log.operation)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.operation.charAt(0).toUpperCase() + log.operation.slice(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.sourceRegion} → {log.targetRegion || 'local'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          log.compliance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.compliance ? 'Compliant' : 'Violation'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
