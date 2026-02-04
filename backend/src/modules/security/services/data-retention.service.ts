import { Injectable } from '@nestjs/common';

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  description: string;
  retentionDays: number;
  legalHold: boolean;
  deletionMethod: 'anonymize' | 'delete' | 'archive';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RetentionStats {
  totalPolicies: number;
  enabledPolicies: number;
  pendingDeletions: number;
  lastRun: string;
  nextRun: string;
}

@Injectable()
export class DataRetentionService {
  private policies: DataRetentionPolicy[] = [
    {
      id: 'policy-001',
      dataType: 'user_sessions',
      description: 'User session data',
      retentionDays: 30,
      legalHold: false,
      deletionMethod: 'delete',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'policy-002',
      dataType: 'application_data',
      description: 'Job application data',
      retentionDays: 365,
      legalHold: true,
      deletionMethod: 'anonymize',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'policy-003',
      dataType: 'resume_files',
      description: 'Uploaded resume files',
      retentionDays: 730,
      legalHold: false,
      deletionMethod: 'archive',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'policy-004',
      dataType: 'audit_logs',
      description: 'Security audit logs',
      retentionDays: 2555,
      legalHold: true,
      deletionMethod: 'archive',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'policy-005',
      dataType: 'marketing_data',
      description: 'Marketing and analytics data',
      retentionDays: 90,
      legalHold: false,
      deletionMethod: 'delete',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  async getRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    return this.policies;
  }

  async getRetentionPolicy(id: string): Promise<DataRetentionPolicy | null> {
    return this.policies.find((p) => p.id === id) || null;
  }

  async createRetentionPolicy(data: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataRetentionPolicy> {
    const policy: DataRetentionPolicy = {
      ...data,
      id: `policy-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.push(policy);
    return policy;
  }

  async updateRetentionPolicy(
    id: string,
    data: Partial<DataRetentionPolicy>,
  ): Promise<DataRetentionPolicy | null> {
    const index = this.policies.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.policies[index] = {
      ...this.policies[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return this.policies[index];
  }

  async deleteRetentionPolicy(id: string): Promise<boolean> {
    const index = this.policies.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this.policies.splice(index, 1);
    return true;
  }

  async applyRetentionPolicies(): Promise<{
    processed: number;
    deleted: number;
    anonymized: number;
    archived: number;
    errors: string[];
    completedAt: string;
  }> {
    // Simulate applying retention policies
    let deleted = 0;
    let anonymized = 0;
    let archived = 0;

    const enabledPolicies = this.policies.filter((p) => p.enabled);

    for (const policy of enabledPolicies) {
      // Simulate processing data based on policy
      switch (policy.deletionMethod) {
        case 'delete':
          deleted += Math.floor(Math.random() * 100);
          break;
        case 'anonymize':
          anonymized += Math.floor(Math.random() * 50);
          break;
        case 'archive':
          archived += Math.floor(Math.random() * 30);
          break;
      }
    }

    return {
      processed: enabledPolicies.length,
      deleted,
      anonymized,
      archived,
      errors: [],
      completedAt: new Date().toISOString(),
    };
  }

  async getRetentionStats(): Promise<RetentionStats> {
    const enabled = this.policies.filter((p) => p.enabled).length;
    const nextRun = new Date(Date.now() + 86400000).toISOString();
    const lastRun = new Date(Date.now() - 86400000).toISOString();

    return {
      totalPolicies: this.policies.length,
      enabledPolicies: enabled,
      pendingDeletions: Math.floor(Math.random() * 500),
      lastRun,
      nextRun,
    };
  }

  async getUpcomingDeletions(days: number = 7): Promise<{
    dataType: string;
    recordCount: number;
    deletionDate: string;
  }[]> {
    const upcoming: { dataType: string; recordCount: number; deletionDate: string }[] = [];

    for (const policy of this.policies.filter((p) => p.enabled)) {
      const deletionDate = new Date(Date.now() + days * 86400000);
      upcoming.push({
        dataType: policy.dataType,
        recordCount: Math.floor(Math.random() * 100),
        deletionDate: deletionDate.toISOString(),
      });
    }

    return upcoming;
  }
}
