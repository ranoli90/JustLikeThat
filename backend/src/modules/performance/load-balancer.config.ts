/**
 * Load Balancer Configuration
 * 
 * This configuration supports multiple load balancing strategies
 * and health check settings for horizontal scaling.
 */

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted' | 'adaptive';
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
    unhealthyThreshold: number;
    healthyThreshold: number;
  };
  stickySessions: {
    enabled: boolean;
    cookieName: string;
    ttl: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeout: number;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  ssl: {
    enabled: boolean;
    certPath?: string;
    keyPath?: string;
    minVersion: string;
  };
}

export const loadBalancerConfig: LoadBalancerConfig = {
  strategy: 'adaptive',
  healthCheck: {
    path: '/health',
    interval: 30000,
    timeout: 5000,
    unhealthyThreshold: 3,
    healthyThreshold: 2,
  },
  stickySessions: {
    enabled: true,
    cookieName: 'session_id',
    ttl: 86400000,
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 50,
    resetTimeout: 30000,
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000,
    maxRequests: 1000,
  },
  ssl: {
    enabled: true,
    minVersion: 'TLSv1.2',
  },
};

/**
 * Instance health check endpoint
 */
export const healthCheckEndpoints = {
  liveness: '/health/live',
  readiness: '/health/ready',
  startup: '/health/startup',
};

/**
 * Graceful shutdown configuration
 */
export const gracefulShutdownConfig = {
  enabled: true,
  timeout: 30000,
  forceTimeout: 60000,
  cleanupTasks: [
    'closeDatabaseConnections',
    'flushMetrics',
    'drainQueue',
    'notifyLoadBalancer',
  ],
};
