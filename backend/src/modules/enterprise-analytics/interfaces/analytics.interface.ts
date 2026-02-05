// Enterprise Analytics Interfaces
// Sprint 45: Enterprise Analytics & Reporting

export interface IKPIWidget {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  sparkline?: number[];
  icon?: string;
  color?: string;
}

export interface IWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'map' | 'gauge' | 'funnel' | 'heatmap';
  title: string;
  config: IWidgetConfig;
  position: IWidgetPosition;
  dataSource: IDataSource;
  refreshEnabled: boolean;
  refreshInterval?: number;
}

export interface IWidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'donut' | 'radar' | 'combo';
  colors?: string[];
  legend?: boolean;
  axis?: IAxisConfig;
  tooltip?: boolean;
  pagination?: boolean;
  pageSize?: number;
  filters?: IFilterConfig[];
  formatting?: IFormattingConfig;
}

export interface IWidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface IAxisConfig {
  xAxis?: { label?: string; format?: string };
  yAxis?: { label?: string; format?: string; min?: number; max?: number };
}

export interface IDataSource {
  type: 'api' | 'query' | 'static';
  endpoint?: string;
  query?: IQueryConfig;
  staticData?: Record<string, unknown>[];
}

export interface IQueryConfig {
  table?: string;
  fields?: string[];
  filters?: IFilterConfig[];
  groupBy?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  aggregations?: IAggregation[];
  joins?: IJoinConfig[];
  limit?: number;
  dateRange?: IDateRange;
}

export interface IFilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'between';
  value: unknown;
}

export interface IAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  alias?: string;
}

export interface IJoinConfig {
  table: string;
  on: { localField: string; foreignField: string };
  type?: 'inner' | 'left' | 'right';
}

export interface IDateRange {
  field: string;
  start?: Date | string;
  end?: Date | string;
  preset?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
}

export interface IFormattingConfig {
  numberFormat?: { decimalPlaces?: number; thousandSeparator?: string };
  dateFormat?: string;
  currencyFormat?: { currency?: string; locale?: string };
}

export interface IDashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: IWidget[];
  settings: IDashboardSettings;
  theme?: IDashboardTheme;
}

export interface IDashboardSettings {
  refreshInterval: number;
  dateRange: IDateRange;
  timezone: string;
  defaultFilters?: IFilterConfig[];
}

export interface IDashboardTheme {
  backgroundColor?: string;
  widgetBackground?: string;
  textColor?: string;
  accentColor?: string;
  chartColors?: string[];
}

// Report Builder Interfaces
export interface IReportDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  reportType: IReportType;
  query: IQueryConfig;
  visualization: IVisualizationConfig;
  filters?: IFilterConfig[];
  parameters?: IReportParameter[];
  columns?: IReportColumn[];
  sorting?: ISortingConfig[];
  grouping?: IGroupingConfig[];
  formulas?: ICustomFormula[];
}

export type IReportType = 'standard' | 'ad_hoc' | 'scheduled' | 'template';

export interface IVisualizationConfig {
  type: 'table' | 'chart' | 'pivot' | 'funnel' | 'cohort' | 'heatmap';
  chartSubtype?: string;
  colors?: string[];
  options?: Record<string, unknown>;
}

export interface IReportParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'date_range' | 'select' | 'multi_select';
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  required: boolean;
}

export interface IReportColumn {
  id: string;
  field: string;
  header: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  format?: string;
  hidden?: boolean;
}

export interface ISortingConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface IGroupingConfig {
  column: string;
  collapsed?: boolean;
}

export interface ICustomFormula {
  id: string;
  name: string;
  expression: string;
  format?: string;
}

// Scheduling Interfaces
export interface IScheduledReport {
  id: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'png';
  compression: boolean;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastStatus?: 'success' | 'failed' | 'partial';
  errorMessage?: string;
}

// Analytics Interfaces
export interface IPredictionResult {
  id: string;
  type: IPredictionType;
  predictionDate: Date;
  forecastPeriod: string;
  value: number;
  confidence: number;
  factors: IPredictionFactor[];
  recommendations?: string[];
}

export type IPredictionType = 'attrition' | 'talent_gap' | 'skills_demand' | 'retention' | 'performance';

export interface IPredictionFactor {
  name: string;
  weight: number;
  direction: 'positive' | 'negative';
  description?: string;
}

export interface IAttritionPrediction {
  department: string;
  role?: string;
  predictedAttritionRate: number;
  historicalRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: IPredictionFactor[];
  recommendedActions: string[];
}

export interface ISkillsGap {
  department: string;
  role: string;
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  developmentOptions: string[];
  estimatedCost: number;
  timelineMonths: number;
}

export interface ITalentForecast {
  department: string;
  role: string;
  period: string;
  currentHeadcount: number;
  projectedHeadcount: number;
  attritionRate: number;
  hiringRate: number;
  internalMoves: number;
  externalHires: number;
  confidence: number;
}

// Talent Acquisition Interfaces
export interface ISourceMetrics {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  period: {
    start: Date;
    end: Date;
  };
  volume: {
    applications: number;
    screenings: number;
    interviews: number;
    offers: number;
    hires: number;
  };
  conversions: {
    appToScreening: number;
    screeningToInterview: number;
    interviewToOffer: number;
    offerToHire: number;
    overall: number;
  };
  costs: {
    total: number;
    perApplication: number;
    perHire: number;
  };
  quality: {
    avgScore: number;
    avgTenure: number;
    performanceScore: number;
  };
}

export interface IRecruiterMetrics {
  recruiterId: string;
  period: {
    start: Date;
    end: Date;
  };
  volume: {
    positionsFilled: number;
    offersMade: number;
    offersAccepted: number;
    offersDeclined: number;
  };
  time: {
    avgTimeToFill: number;
    avgTimeToHire: number;
  };
  quality: {
    avgQualityScore: number;
    newHireRetention: number;
  };
  experience: {
    candidateRating: number;
    feedbackScore: number;
  };
}

export interface IPipelineHealth {
  jobId?: string;
  department: string;
  asOfDate: Date;
  stages: IPipelineStage[];
  totalCandidates: number;
  bottleneckStage?: string;
  staleCandidates: number;
  velocityMetrics: {
    avgPipelineTime: number;
    projectedCompletions: number;
  };
  qualityIndicators: {
    qualifiedRatio: number;
    diversityRatio?: Record<string, number>;
  };
}

export interface IPipelineStage {
  name: string;
  count: number;
  avgDays: number;
  conversionRate?: number;
}

// Time-to-Hire Interfaces
export interface ITimeToHireMetrics {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  overall: {
    avg: number;
    median: number;
    min: number;
    max: number;
    p25: number;
    p75: number;
    p90: number;
  };
  byStage: IStageDuration[];
  byRoleCategory: Record<string, number>;
  byDepartment: Record<string, number>;
  trends: ITrendData[];
  benchmarks: IBenchmarkData;
}

export interface IStageDuration {
  stage: string;
  avg: number;
  median: number;
  min: number;
  max: number;
  contribution: number; // Percentage of total time
}

export interface ITrendData {
  period: string;
  avgTimeToHire: number;
  change: number;
  changePercent: number;
}

export interface IBenchmarkData {
  industryAvg: number;
  percentile: number;
  topPerformers: number;
  bestInClass: number;
}

export interface IBottleneck {
  id: string;
  department?: string;
  jobId?: string;
  stage: string;
  bottleneckType: 'duration' | 'volume' | 'resource' | 'process';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metrics: {
    avgDuration: number;
    avgWaitTime: number;
    candidateBacklog: number;
  };
  impact: {
    timeLost: number;
    costImpact: number;
    candidateLoss: number;
  };
  recommendations: IOptimizationRecommendation[];
  status: 'identified' | 'investigating' | 'implementing' | 'resolved';
}

export interface IOptimizationRecommendation {
  id: string;
  type: 'process' | 'automation' | 'sourcing' | 'screening' | 'interviewing';
  title: string;
  description: string;
  timeSavings: {
    value: number;
    unit: 'days' | 'hours';
  };
  costSavings: {
    value: number;
    currency: string;
  };
  effort: 'low' | 'medium' | 'high';
  priority: number;
  steps: string[];
  expectedOutcome: string;
}

// Cost Tracking Interfaces
export interface ICostTracking {
  id: string;
  tenantId: string;
  hireId?: string;
  jobId?: string;
  department?: string;
  category: ICostCategory;
  amount: number;
  currency: string;
  convertedAmount?: number;
  description?: string;
  vendor?: string;
  receipt?: string;
  status: 'pending' | 'approved' | 'paid' | 'reimbursed';
  createdAt: Date;
}

export type ICostCategory = 
  | 'job_board'
  | 'referral'
  | 'agency'
  | 'internal'
  | 'advertising'
  | 'events'
  | 'technology'
  | 'recruiter'
  | 'background_check'
  | 'assessment'
  | 'travel'
  | 'relocation'
  | 'other';

export interface ICostBudget {
  id: string;
  tenantId: string;
  name: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  categories: Record<string, { budget: number; spent: number }>;
  departments?: Record<string, { budget: number; spent: number }>;
  varianceThreshold: number;
  alerts: Record<string, { percentage: number; alerted: boolean }>;
  status: 'draft' | 'active' | 'closed';
}

export interface ICostROI {
  hireId: string;
  period: string;
  calculationDate: Date;
  totalCost: number;
  perHireCost: number;
  hireValue?: number;
  performanceScore?: number;
  tenureMonths?: number;
  roi?: number;
  paybackPeriod?: number;
  vsBudget: number;
  vsAverage: number;
}

export interface ICostForecast {
  tenantId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  projectedSpend: number;
  confidence: number;
  byCategory: Record<string, number>;
  byDepartment?: Record<string, number>;
  assumptions: string[];
  vsBudget: number;
}

export interface IVarianceAnalysis {
  budgetId: string;
  category: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  varianceType: 'favorable' | 'unfavorable';
  reason?: string;
  contributingFactors: {
    factor: string;
    impact: number;
  }[];
}

// Export Interfaces
export interface IExportRequest {
  reportId?: string;
  dashboardId?: string;
  format: 'pdf' | 'excel' | 'csv' | 'png';
  parameters?: Record<string, unknown>;
  dateRange?: IDateRange;
  recipients?: string[];
  compression?: boolean;
}

export interface IExportResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: Date;
  errorMessage?: string;
}
