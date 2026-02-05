// Gateway Interface Definitions

export interface GatewayRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  clientId: string;
  ip: string;
  timestamp: number;
}

export interface GatewayResponse {
  statusCode: number;
  data: any;
  headers: Record<string, string>;
  timestamp: number;
}

export interface Route {
  id: string;
  path: string;
  method: string;
  targetService: string;
  targetPath?: string;
  plugins?: RoutePlugin[];
  timeout?: number;
  retries?: number;
  stripPrefix: boolean;
  preserveHost: boolean;
  active: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutePlugin {
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface CircuitBreakerState {
  service: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  nextAttempt?: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  latency?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface ScalingPolicy {
  serviceName: string;
  minReplicas: number;
  maxReplicas: number;
  targetCpu?: number;
  targetMemory?: number;
  targetRequestsPerSecond?: number;
  cooldownSeconds: number;
}

export interface ScalingEvent {
  id: string;
  serviceName: string;
  previousReplicas: number;
  newReplicas: number;
  trigger: string;
  timestamp: Date;
  metrics: Record<string, any>;
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  rateLimitHits: number;
  circuitBreakerTrips: number;
}
