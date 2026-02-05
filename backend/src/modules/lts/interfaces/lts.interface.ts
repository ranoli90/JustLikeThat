// SLA Monitoring Interfaces
export interface SLADefinition {
  id: string;
  tenantId?: string;
  serviceName: string;
  metricType: SLAMetricType;
  targetValue: number;
  measurementUnit: string;
  period: 'hourly' | 'daily' | 'monthly';
  isActive: boolean;
}

export type SLAMetricType = 'availability' | 'latency' | 'throughput' | 'error_rate';

export interface SLAMetric {
  id: string;
  slaConfigId: string;
  value: number;
  timestamp: Date;
  status: 'met' | 'violated' | 'pending';
}

export interface SLAMetricSummary {
  serviceName: string;
  metricType: SLAMetricType;
  targetValue: number;
  actualValue: number;
  compliance: number;
  period: string;
}

export interface SLAViolation {
  id: string;
  slaConfigId: string;
  violationType: string;
  severity: 'critical' | 'warning';
  details: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface SLAReport {
  period: string;
  startDate: Date;
  endDate: Date;
  overallCompliance: number;
  metrics: SLAMetricSummary[];
  violations: SLAViolation[];
}

// Capacity Planning Interfaces
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

export interface CapacityPrediction {
  resourceType: string;
  currentCapacity: number;
  predictedCapacity: number;
  confidence: number;
  predictionDate: Date;
  factors: CapacityFactor[];
}

export interface CapacityFactor {
  name: string;
  impact: number;
  description: string;
}

export interface CapacityRecommendation {
  id: string;
  type: 'scale_up' | 'scale_down' | 'optimize' | 'invest';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedCost: number;
  expectedImprovement: number;
  implementationEffort: string;
}

// Cost Optimization Interfaces
export interface CostRecord {
  id: string;
  tenantId?: string;
  serviceName: string;
  resourceType: string;
  cost: number;
  currency: string;
  usage: Record<string, unknown>;
  tags: Record<string, string>;
  billingPeriod: Date;
}

export interface CostForecast {
  id: string;
  tenantId?: string;
  forecastPeriod: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  predictedCost: number;
  confidence: number;
  factors: CostFactor[];
}

export interface CostFactor {
  name: string;
  impact: number;
  description: string;
}

export interface CostAnomaly {
  id: string;
  tenantId?: string;
  serviceName: string;
  expectedCost: number;
  actualCost: number;
  deviation: number;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface CostSummary {
  totalCost: number;
  byService: Record<string, number>;
  byResourceType: Record<string, number>;
  trend: 'increasing' | 'decreasing' | 'stable';
  period: string;
}

// Technology Roadmap Interfaces
export interface TechnologyRoadmap {
  id: string;
  title: string;
  description: string;
  category: RoadmapCategory;
  status: RoadmapStatus;
  priority: number;
  estimatedEffort: string;
  dependencies: Dependency[];
  risks: Risk[];
  startDate?: Date;
  targetDate?: Date;
}

export type RoadmapCategory = 'infrastructure' | 'security' | 'ai' | 'frontend' | 'backend';
export type RoadmapStatus = 'planned' | 'in_progress' | 'completed' | 'deferred';

export interface Dependency {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface Risk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// User Feedback Interfaces
export interface UserFeedback {
  id: string;
  userId: string;
  feedbackType: FeedbackType;
  category: string;
  subject: string;
  description: string;
  sentiment: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  priority: number;
  status: FeedbackStatus;
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
}

export type FeedbackType = 'feature_request' | 'bug_report' | 'compliment' | 'complaint';
export type FeedbackStatus = 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed';

export interface NPSSurvey {
  id: string;
  userId: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  comments?: string;
  sentAt: Date;
  respondedAt?: Date;
}

export interface NPSMetrics {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  responseRate: number;
  trend: 'improving' | 'declining' | 'stable';
}

// Continuous Improvement Interfaces
export interface ImprovementInitiative {
  id: string;
  title: string;
  description: string;
  category: ImprovementCategory;
  status: ImprovementStatus;
  estimatedImpact: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  actualCost?: number;
  roi?: number;
  metricsBefore?: Record<string, number>;
  metricsAfter?: Record<string, number>;
  startDate?: Date;
  completedAt?: Date;
}

export type ImprovementCategory = 'performance' | 'cost' | 'quality' | 'security' | 'user_experience';
export type ImprovementStatus = 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface BenchmarkData {
  id: string;
  category: 'industry' | 'competitor' | 'best_practice';
  name: string;
  metrics: Record<string, number>;
  source: string;
  collectionDate: Date;
}

export interface ImprovementMetrics {
  activeInitiatives: number;
  completedThisQuarter: number;
  averageROI: number;
  impactScore: number;
}
