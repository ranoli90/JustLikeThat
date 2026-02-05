// Analytics Event Types
export interface AnalyticsEvent {
  id?: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp?: Date;
  processedAt?: Date;
}

export interface DashboardConfig {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  filters?: DashboardFilter[];
  isPublic?: boolean;
  shareToken?: string;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  rowHeight: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: Record<string, unknown>;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface DashboardFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';

export type WidgetType = 
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table'
  | 'metric'
  | 'heatmap'
  | 'funnel'
  | 'cohort'
  | 'gauge'
  | 'map'
  | 'list'
  | 'timeline'
  | 'scatter';

// Session Types
export interface Session {
  id?: string;
  userId?: string;
  sessionKey: string;
  deviceInfo?: DeviceInfo;
  browserInfo?: BrowserInfo;
  ipAddress?: string;
  location?: LocationInfo;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  pageCount?: number;
}

export interface SessionEvent {
  id?: string;
  sessionId: string;
  eventType: SessionEventType;
  elementId?: string;
  elementType?: string;
  pageUrl?: string;
  x?: number;
  y?: number;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export type SessionEventType = 
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'mousemove'
  | 'keypress'
  | 'form_submit'
  | 'resize'
  | 'visibility_change';

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  brand?: string;
  model?: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine?: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

// Cohort Types
export interface CohortConfig {
  id?: string;
  name: string;
  description?: string;
  cohortType: 'daily' | 'weekly' | 'monthly';
  cohortDate: Date;
  cohortSize: number;
  retentionData: RetentionData[];
  metrics: CohortMetrics;
}

export interface RetentionData {
  period: number;
  retained: number;
  retainedPct: number;
  churned: number;
  churnedPct: number;
}

export interface CohortMetrics {
  avgRetention: number;
  maxRetention: number;
  minRetention: number;
  avgTimeToChurn?: number;
}

export interface LTVPrediction {
  userId: string;
  predictedLTV: number;
  confidence: number;
  factors: LTVFactor[];
  modelVersion: string;
}

export interface LTVFactor {
  name: string;
  impact: number;
  value: unknown;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: ChurnFactor[];
  alerts?: ChurnAlert[];
}

export interface ChurnFactor {
  name: string;
  impact: number;
  description: string;
}

export interface ChurnAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// A/B Testing Types
export interface ABExperiment {
  id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  targeting?: ABTargeting;
  startDate?: Date;
  endDate?: Date;
  results?: ABResults;
  trafficSplit: TrafficSplit[];
  primaryMetric?: string;
  minSampleSize?: number;
  currentSample?: number;
}

export interface ABVariant {
  id?: string;
  experimentId?: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  trafficWeight: number;
  isControl?: boolean;
}

export interface ABTargeting {
  userAttributes?: Record<string, unknown>[];
  percentage?: number;
  excludeUsers?: string[];
  includeUsers?: string[];
}

export interface TrafficSplit {
  variant: string;
  weight: number;
}

export interface ABResults {
  winner?: string;
  improvement?: number;
  confidence?: number;
  isSignificant?: boolean;
}

export interface ABResult {
  id?: string;
  experimentId: string;
  variantId: string;
  metricName: string;
  sampleSize: number;
  mean: number;
  variance?: number;
  confidenceLow?: number;
  confidenceHigh?: number;
  pValue?: number;
  isSignificant?: boolean;
}

export interface FeatureFlag {
  id?: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPct: number;
  targeting?: ABTargeting;
}

// Report Types
export interface ReportConfig {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  type: 'dashboard' | 'custom' | 'scheduled';
  config: ReportDataConfig;
  schedule?: ReportSchedule;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface ReportDataConfig {
  metrics: string[];
  dimensions?: string[];
  filters?: DashboardFilter[];
  dateRange: DateRange;
  aggregations?: Aggregation[];
  orderBy?: string[];
  limit?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  timezone?: string;
}

export interface Aggregation {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'percentile';
  alias?: string;
  percentile?: number;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients?: string[];
}

export interface ReportExport {
  id?: string;
  reportId: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  error?: string;
  requestedAt?: Date;
  completedAt?: Date;
}

// Funnel Types
export interface FunnelConfig {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  steps: FunnelStepConfig[];
}

export interface FunnelStepConfig {
  id?: string;
  stepOrder: number;
  name: string;
  eventType: string;
  conditions?: FunnelCondition[];
}

export interface FunnelCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FunnelConversion {
  id?: string;
  funnelId: string;
  userId?: string;
  sessionId?: string;
  stepReached: number;
  completedAt?: Date;
  conversionTime?: number;
}

// Metric Types
export interface MetricData {
  id?: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface WidgetTemplate {
  id?: string;
  name: string;
  description?: string;
  type: WidgetType;
  category: string;
  config: Record<string, unknown>;
  preview?: string;
  isPublic?: boolean;
  userId?: string;
}
