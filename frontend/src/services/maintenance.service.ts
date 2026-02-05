// Maintenance Service - Sprint 48
import api from './api';

export interface TechnicalDebtItem {
  id: string;
  category: string;
  severity: string;
  description: string;
  filePath: string;
  estimatedHours: number;
  status: string;
  createdAt: string;
}

export interface DebtSummary {
  totalItems: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  estimatedHoursTotal: number;
  reductionPercentage: number;
}

export interface SecurityPatch {
  id: string;
  vulnerabilityId: string;
  severity: string;
  affectedSystems: string[];
  patchVersion: string;
  status: string;
  deployedAt?: string;
  createdAt: string;
}

export interface DependencyUpdate {
  id: string;
  packageName: string;
  currentVersion: string;
  latestVersion: string;
  compatibility: string;
  status: string;
  scheduledFor?: string;
  appliedAt?: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targeting?: Record<string, any>;
  createdAt: string;
}

export interface PerformanceMetrics {
  serviceName: string;
  cpuUsage: number;
  memoryUsage: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  throughput: number;
  errorRate: number;
}

class MaintenanceService {
  // Technical Debt
  async getTechnicalDebt(filters?: { category?: string; severity?: string; status?: string }): Promise<TechnicalDebtItem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    
    return api.get(`/api/v1/maintenance/technical-debt?${params.toString()}`);
  }

  async getDebtSummary(): Promise<DebtSummary> {
    return api.get('/api/v1/maintenance/technical-debt/summary');
  }

  async createDebtItem(data: Partial<TechnicalDebtItem>): Promise<TechnicalDebtItem> {
    return api.post('/api/v1/maintenance/technical-debt', data);
  }

  async updateDebtItem(id: string, data: Partial<TechnicalDebtItem>): Promise<TechnicalDebtItem> {
    return api.put(`/api/v1/maintenance/technical-debt/${id}`, data);
  }

  async deleteDebtItem(id: string): Promise<void> {
    return api.delete(`/api/v1/maintenance/technical-debt/${id}`);
  }

  async identifyDebtFromSonarQube(): Promise<TechnicalDebtItem[]> {
    return api.post('/api/v1/maintenance/technical-debt/identify');
  }

  async getQualityMetrics(serviceName?: string, days?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (serviceName) params.append('serviceName', serviceName);
    if (days) params.append('days', days.toString());
    return api.get(`/api/v1/maintenance/technical-debt/quality-metrics?${params.toString()}`);
  }

  // Security Patches
  async getSecurityPatches(status?: string): Promise<SecurityPatch[]> {
    const params = status ? `?status=${status}` : '';
    return api.get(`/api/v1/maintenance/security-patches${params}`);
  }

  async getSecurityDashboard(): Promise<any> {
    return api.get('/api/v1/maintenance/security-patches/dashboard');
  }

  async scanVulnerabilities(): Promise<any> {
    return api.post('/api/v1/maintenance/security-patches/scan');
  }

  async deployPatch(id: string): Promise<any> {
    return api.post(`/api/v1/maintenance/security-patches/${id}/deploy`);
  }

  async rollbackPatch(id: string): Promise<any> {
    return api.post(`/api/v1/maintenance/security-patches/${id}/rollback`);
  }

  async checkCompliance(): Promise<any> {
    return api.get('/api/v1/maintenance/security-patches/compliance');
  }

  // Dependency Updates
  async getDependencies(): Promise<DependencyUpdate[]> {
    return api.get('/api/v1/maintenance/dependencies');
  }

  async getOutdatedDependencies(): Promise<DependencyUpdate[]> {
    return api.get('/api/v1/maintenance/dependencies/outdated');
  }

  async checkForUpdates(): Promise<any> {
    return api.post('/api/v1/maintenance/dependencies/check');
  }

  async scanDependencies(): Promise<any> {
    return api.post('/api/v1/maintenance/dependencies/scan');
  }

  async applyUpdate(id: string): Promise<any> {
    return api.post(`/api/v1/maintenance/dependencies/${id}/update`);
  }

  async rollbackUpdate(id: string): Promise<any> {
    return api.post(`/api/v1/maintenance/dependencies/${id}/rollback`);
  }

  async getUpdateSchedule(): Promise<any> {
    return api.get('/api/v1/maintenance/dependencies/schedule');
  }

  // Feature Flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return api.get('/api/v1/maintenance/feature-flags');
  }

  async createFeatureFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    return api.post('/api/v1/maintenance/feature-flags', data);
  }

  async toggleFeatureFlag(id: string): Promise<FeatureFlag> {
    return api.post(`/api/v1/maintenance/feature-flags/${id}/toggle`);
  }

  async setRolloutPercentage(id: string, percentage: number): Promise<FeatureFlag> {
    return api.post(`/api/v1/maintenance/feature-flags/${id}/rollout`, { percentage });
  }

  async isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
    const params = userId ? `?userId=${userId}` : '';
    const result = await api.get<{ enabled: boolean }>(`/api/v1/maintenance/feature-flags/check/${key}${params}`);
    return result.enabled;
  }

  // Experiments
  async getExperiments(status?: string): Promise<any[]> {
    const params = status ? `?status=${status}` : '';
    return api.get(`/api/v1/maintenance/experiments${params}`);
  }

  async createExperiment(data: any): Promise<any> {
    return api.post('/api/v1/maintenance/experiments', data);
  }

  async startExperiment(id: string): Promise<any> {
    return api.post(`/api/v1/maintenance/experiments/${id}/start`);
  }

  async stopExperiment(id: string, results?: any): Promise<any> {
    return api.post(`/api/v1/maintenance/experiments/${id}/stop`, results);
  }

  async getExperimentResults(id: string): Promise<any> {
    return api.get(`/api/v1/maintenance/experiments/${id}/results`);
  }

  // Performance
  async getCurrentPerformance(serviceName: string): Promise<PerformanceMetrics> {
    return api.get(`/api/v1/maintenance/performance?serviceName=${serviceName}`);
  }

  async getPerformanceSnapshots(serviceName: string, hours?: number): Promise<any[]> {
    const params = new URLSearchParams({ serviceName });
    if (hours) params.append('hours', hours.toString());
    return api.get(`/api/v1/maintenance/performance/snapshots?${params.toString()}`);
  }

  async getApmData(serviceName: string): Promise<any> {
    return api.get(`/api/v1/maintenance/performance/apm/${serviceName}`);
  }

  async getDatabaseMetrics(): Promise<any> {
    return api.get('/api/v1/maintenance/performance/database');
  }

  async getSlowQueries(): Promise<any[]> {
    return api.get('/api/v1/maintenance/performance/slow-queries');
  }

  async getCacheMetrics(serviceName: string): Promise<any> {
    return api.get(`/api/v1/maintenance/performance/cache/${serviceName}`);
  }

  async runLoadTest(config: any): Promise<any> {
    return api.post('/api/v1/maintenance/performance/load-test', config);
  }

  async getLoadTestResults(serviceName?: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (serviceName) params.append('serviceName', serviceName);
    if (limit) params.append('limit', limit.toString());
    return api.get(`/api/v1/maintenance/performance/load-tests?${params.toString()}`);
  }

  // Optimizations
  async getOptimizationRecommendations(category?: string): Promise<any[]> {
    const params = category ? `?category=${category}` : '';
    return api.get(`/api/v1/maintenance/optimizations${params}`);
  }

  async createOptimizationRecommendation(data: any): Promise<any> {
    return api.post('/api/v1/maintenance/optimizations', data);
  }

  async approveRecommendation(id: string): Promise<void> {
    return api.post('/api/v1/maintenance/optimizations/review', { id, action: 'approve' });
  }

  async rejectRecommendation(id: string): Promise<void> {
    return api.post('/api/v1/maintenance/optimizations/review', { id, action: 'reject' });
  }

  async markImplemented(id: string): Promise<void> {
    return api.post('/api/v1/maintenance/optimizations/review', { id, action: 'implement' });
  }
}

export const maintenanceService = new MaintenanceService();
export default maintenanceService;
