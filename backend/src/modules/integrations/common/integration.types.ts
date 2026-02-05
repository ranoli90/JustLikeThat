// ============ INTEGRATION FRAMEWORK BASE ============

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: any;
  metadata?: {
    requestId?: string;
    timestamp?: Date;
    duration?: number;
    rateLimitRemaining?: number;
  };
}

export interface IntegrationConfig {
  provider: string;
  integrationType: IntegrationType;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  fieldMappings?: FieldMapping[];
}

export interface FieldMapping {
  localField: string;
  externalField: string;
  transform?: string;
  required?: boolean;
}

export interface SyncResult {
  syncType: SyncType;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: SyncError[];
  duration: number;
  startedAt: Date;
  completedAt: Date;
}

export interface SyncError {
  recordId: string;
  field?: string;
  message: string;
  code: string;
}

export interface WebhookPayload {
  eventType: string;
  eventId: string;
  timestamp: Date;
  data: Record<string, any>;
  signature?: string;
}

export enum IntegrationType {
  JOB_BOARD = 'JOB_BOARD',
  ATS = 'ATS',
  HRIS = 'HRIS',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  SCHEDULING = 'SCHEDULING',
  LMS = 'LMS',
  TEAM_CHAT = 'TEAM_CHAT',
  SSO = 'SSO',
}

export enum SyncType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  MANUAL = 'MANUAL',
}

// Base credentials interface
export interface OAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
}

export interface ApiKeyCredentials {
  apiKey: string;
  apiSecret?: string;
}

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

export type Credentials = OAuthCredentials | ApiKeyCredentials | BasicAuthCredentials;

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  windowMs: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}
