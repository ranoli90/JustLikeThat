// LTS Service - Sprint 49
import api from './api';

export interface SLADefinition {
  id: string;
  tenantId?: string;
  serviceName: string;
  metricType: 'availability' | 'latency' | 'throughput' | 'error_rate';
  targetValue: number;
  measurementUnit: string;
  period: 'hourly' | 'daily' | 'monthly';
  isActive: boolean;
}

export interface SLAMetric {
  id: string;
  slaConfigId: string;
  value: number;
  timestamp: string;
  status: 'met' | 'violated' | 'pending';
}

export interface SLAViolation {
  id: string;
  slaConfigId: string;
  violationType: string;
  severity: 'critical' | 'warning';
  details: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface CapacityMetrics {
  cpu: ResourceMetric;
  memory: ResourceMetric;
  storage: ResourceMetric;
  network: ResourceMetric;
}

export interface ResourceMetric {
  current: number;
  peak: number;
  average: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CostSummary {
  totalCost: number;
  byService: Record<string, number>;
  byResourceType: Record<string, number>;
  trend: 'increasing' | 'decreasing' | 'stable';
  period: string;
}

export interface TechnologyRoadmap {
  id: string;
  title: string;
  description: string;
  category: 'infrastructure' | 'security' | 'ai' | 'frontend' | 'backend';
  status: 'planned' | 'in_progress' | 'completed' | 'deferred';
  priority: number;
  estimatedEffort: string;
  dependencies: Array<{ id: string; name: string; type: string; status: string }>;
  risks: Array<{ id: string; description: string; probability: 'low' | 'medium' | 'high'; impact: 'low' | 'medium' | 'high'; mitigation: string }>;
  startDate?: string;
  targetDate?: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  feedbackType: 'feature_request' | 'bug_report' | 'compliment' | 'complaint';
  category: string;
  subject: string;
  description: string;
  sentiment: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  priority: number;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface NPSMetrics {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  responseRate: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ImprovementInitiative {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'cost' | 'quality' | 'security' | 'user_experience';
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  estimatedImpact: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  actualCost?: number;
  roi?: number;
  metricsBefore?: Record<string, number>;
  metricsAfter?: Record<string, number>;
  startDate?: string;
  completedAt?: string;
}

class LTSService {
  private baseUrl = '/api/v1/lts';

  // SLA Endpoints
  async getSLAConfigs(tenantId?: string): Promise<SLADefinition[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    return api.get<SLADefinition[]>(`${this.baseUrl}/sla/configs${params}`);
  }

  async createSLAConfig(config: Partial<SLADefinition>): Promise<SLADefinition> {
    return api.post<SLADefinition>(`${this.baseUrl}/sla/configs`, config);
  }

  async getSLAMetrics(slaConfigId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<SLAMetric[]> {
    const params = new URLSearchParams({ slaConfigId });
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    return api.get<SLAMetric[]>(`${this.baseUrl}/sla/metrics?${params}`);
  }

  async getSLAViolations(options?: { tenantId?: string; severity?: string; acknowledged?: boolean }): Promise<SLAViolation[]> {
    const params = new URLSearchParams();
    if (options?.tenantId) params.append('tenantId', options.tenantId);
    if (options?.severity) params.append('severity', options.severity);
    if (options?.acknowledged !== undefined) params.append('acknowledged', options.acknowledged.toString());
    return api.get<SLAViolation[]>(`${this.baseUrl}/sla/violations?${params}`);
  }

  async acknowledgeViolation(id: string, acknowledgedBy: string): Promise<SLAViolation> {
    return api.post<SLAViolation>(`${this.baseUrl}/sla/violations/${id}/acknowledge`, { acknowledgedBy });
  }

  async getSLADashboard(tenantId?: string): Promise<{
    overallCompliance: number;
    activeConfigs: number;
    violationsLast24h: number;
    metricsByService: Record<string, { compliance: number; status: string }>;
  }> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    return api.get<unknown>(`${this.baseUrl}/sla/dashboard${params}`);
  }

  async getSLARecommendations(tenantId?: string): Promise<Array<{ type: string; description: string; priority: string; expectedImprovement: number }>> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    return api.get<unknown[]>(`${this.baseUrl}/sla/recommendations${params}`);
  }

  // Capacity Endpoints
  async getCurrentCapacity(): Promise<CapacityMetrics> {
    return api.get<CapacityMetrics>(`${this.baseUrl}/capacity/current`);
  }

  async getCapacityPredictions(options?: { horizonMonths?: number; resourceTypes?: string[] }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options?.horizonMonths) params.append('horizonMonths', options.horizonMonths.toString());
    return api.get<unknown[]>(`${this.baseUrl}/capacity/predictions?${params}`);
  }

  async getCapacityRecommendations(): Promise<unknown[]> {
    return api.get<unknown[]>(`${this.baseUrl}/capacity/recommendations`);
  }

  async getAutoScalingRecommendations(): Promise<{ scalingRules: unknown[]; estimatedSavings: number }> {
    return api.get<unknown>(`${this.baseUrl}/capacity/autoscaling`);
  }

  // Cost Endpoints
  async getCostRecords(options?: { tenantId?: string; serviceName?: string; startDate?: string; endDate?: string }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options?.tenantId) params.append('tenantId', options.tenantId);
    if (options?.serviceName) params.append('serviceName', options.serviceName);
    return api.get<unknown[]>(`${this.baseUrl}/cost/records?${params}`);
  }

  async getCostSummary(tenantId?: string): Promise<CostSummary> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    return api.get<CostSummary>(`${this.baseUrl}/cost/summary${params}`);
  }

  async getCostForecasts(options?: { tenantId?: string; horizonMonths?: number }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options?.tenantId) params.append('tenantId', options.tenantId);
    if (options?.horizonMonths) params.append('horizonMonths', options.horizonMonths.toString());
    return api.get<unknown[]>(`${this.baseUrl}/cost/forecasts?${params}`);
  }

  async getCostAnomalies(tenantId?: string): Promise<unknown[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    return api.get<unknown[]>(`${this.baseUrl}/cost/anomalies${params}`);
  }

  async getCostReductionRecommendations(tenantId?: string): Promise<unknown[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    return api.get<unknown[]>(`${this.baseUrl}/cost/recommendations${params}`);
  }

  // Roadmap Endpoints
  async getRoadmap(options?: { category?: string; status?: string }): Promise<TechnologyRoadmap[]> {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.status) params.append('status', options.status);
    return api.get<TechnologyRoadmap[]>(`${this.baseUrl}/roadmap?${params}`);
  }

  async createRoadmapItem(item: Partial<TechnologyRoadmap>): Promise<TechnologyRoadmap> {
    return api.post<TechnologyRoadmap>(`${this.baseUrl}/roadmap`, item);
  }

  async updateRoadmapStatus(id: string, status: string): Promise<TechnologyRoadmap> {
    return api.post<TechnologyRoadmap>(`${this.baseUrl}/roadmap/${id}/status`, { status });
  }

  async getRoadmapSummary(): Promise<unknown> {
    return api.get<unknown>(`${this.baseUrl}/roadmap/summary`);
  }

  async getTechnologyAssessment(): Promise<unknown> {
    return api.get<unknown>(`${this.baseUrl}/roadmap/assessment`);
  }

  // Feedback Endpoints
  async getFeedback(options?: { userId?: string; feedbackType?: string; status?: string; limit?: number }): Promise<{ feedback: UserFeedback[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.userId) params.append('userId', options.userId);
    if (options?.feedbackType) params.append('feedbackType', options.feedbackType);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    return api.get<{ feedback: UserFeedback[]; total: number }>(`${this.baseUrl}/feedback?${params}`);
  }

  async createFeedback(feedback: Partial<UserFeedback>): Promise<UserFeedback> {
    return api.post<UserFeedback>(`${this.baseUrl}/feedback`, feedback);
  }

  async respondToFeedback(id: string, response: string, respondedBy: string): Promise<UserFeedback> {
    return api.post<UserFeedback>(`${this.baseUrl}/feedback/${id}/respond`, { response, respondedBy });
  }

  // NPS Endpoints
  async getNPSMetrics(): Promise<NPSMetrics> {
    return api.get<NPSMetrics>(`${this.baseUrl}/nps/metrics`);
  }

  async createNPSSurvey(userId: string): Promise<unknown> {
    return api.post(`${this.baseUrl}/nps`, { userId });
  }

  async submitNPSResponse(id: string, score: number, comments?: string): Promise<unknown> {
    return api.post(`${this.baseUrl}/nps/${id}/respond`, { score, comments });
  }

  // Improvement Endpoints
  async getImprovements(options?: { category?: string; status?: string }): Promise<{ initiatives: ImprovementInitiative[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.status) params.append('status', options.status);
    return api.get<unknown>(`${this.baseUrl}/improvements?${params}`);
  }

  async createImprovement(initiative: Partial<ImprovementInitiative>): Promise<ImprovementInitiative> {
    return api.post<ImprovementInitiative>(`${this.baseUrl}/improvements`, initiative);
  }

  async completeImprovement(id: string, metricsAfter: Record<string, number>, actualCost?: number): Promise<ImprovementInitiative> {
    return api.post<ImprovementInitiative>(`${this.baseUrl}/improvements/${id}/complete`, { metricsAfter, actualCost });
  }

  async getImprovementMetrics(): Promise<unknown> {
    return api.get<unknown>(`${this.baseUrl}/improvements/metrics`);
  }

  async getROITracking(): Promise<unknown> {
    return api.get<unknown>(`${this.baseUrl}/improvements/roi`);
  }

  async getAutomatedSuggestions(): Promise<unknown[]> {
    return api.get<unknown[]>(`${this.baseUrl}/improvements/suggestions`);
  }

  // Benchmark Endpoints
  async getBenchmarks(category?: string): Promise<unknown[]> {
    const params = category ? `?category=${category}` : '';
    return api.get<unknown[]>(`${this.baseUrl}/benchmarks${params}`);
  }

  async createBenchmark(benchmark: Partial<unknown>): Promise<unknown> {
    return api.post(`${this.baseUrl}/benchmarks`, benchmark);
  }

  async compareWithBenchmarks(): Promise<unknown> {
    return api.get<unknown>(`${this.baseUrl}/benchmarks/compare`);
  }
}

export default new LTSService();
