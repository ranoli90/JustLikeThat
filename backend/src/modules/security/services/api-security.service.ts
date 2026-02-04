import { Injectable } from '@nestjs/common';

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
}

export interface RateLimitEntry {
  ip: string;
  endpoint: string;
  count: number;
  windowStart: Date;
}

export interface ThrottleStatus {
  enabled: boolean;
  globalRateLimit: number;
  perIpRateLimit: number;
  currentlyThrottled: number;
}

@Injectable()
export class ApiSecurityService {
  private rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
  private rateLimitEntries: Map<string, RateLimitEntry[]> = new Map();
  private throttleEnabled = true;

  constructor() {
    // Initialize default rate limit configurations
    this.initializeDefaultRateLimits();
  }

  private initializeDefaultRateLimits() {
    const defaultLimits: RateLimitConfig[] = [
      { endpoint: '/api/auth/*', maxRequests: 10, windowSeconds: 60, tier: 'free' },
      { endpoint: '/api/auth/login', maxRequests: 5, windowSeconds: 60, tier: 'free' },
      { endpoint: '/api/search/*', maxRequests: 30, windowSeconds: 60, tier: 'free' },
      { endpoint: '/api/applications/*', maxRequests: 60, windowSeconds: 60, tier: 'basic' },
      { endpoint: '/api/analytics/*', maxRequests: 100, windowSeconds: 60, tier: 'premium' },
      { endpoint: '/api/*', maxRequests: 1000, windowSeconds: 60, tier: 'free' },
    ];

    defaultLimits.forEach((config) => {
      this.rateLimitConfigs.set(config.endpoint, config);
    });
  }

  async getRateLimits(): Promise<RateLimitConfig[]> {
    return Array.from(this.rateLimitConfigs.values());
  }

  async updateRateLimit(
    endpoint: string,
    data: { maxRequests: number; windowSeconds: number },
  ): Promise<RateLimitConfig | null> {
    const config = this.rateLimitConfigs.get(endpoint);
    if (!config) return null;

    config.maxRequests = data.maxRequests;
    config.windowSeconds = data.windowSeconds;

    return config;
  }

  async checkRateLimit(ip: string, endpoint: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    limit: number;
  }> {
    // Find matching rate limit config
    let matchedConfig: RateLimitConfig | null = null;
    for (const [pattern, config] of this.rateLimitConfigs) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(endpoint)) {
        matchedConfig = config;
        break;
      }
    }

    if (!matchedConfig) {
      return { allowed: true, remaining: 1000, resetTime: new Date(), limit: 1000 };
    }

    const key = `${ip}:${endpoint}`;
    let entries = this.rateLimitEntries.get(key) || [];

    // Clean old entries
    const windowStart = new Date(Date.now() - matchedConfig.windowSeconds * 1000);
    entries = entries.filter((e) => e.windowStart > windowStart);

    if (entries.length >= matchedConfig.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Math.min(...entries.map((e) => e.windowStart.getTime()))) ||
          new Date(Date.now() + matchedConfig.windowSeconds * 1000),
        limit: matchedConfig.maxRequests,
      };
    }

    // Add new entry
    entries.push({
      ip,
      endpoint,
      count: entries.length + 1,
      windowStart: new Date(),
    });
    this.rateLimitEntries.set(key, entries);

    return {
      allowed: true,
      remaining: matchedConfig.maxRequests - entries.length,
      resetTime: new Date(Date.now() + matchedConfig.windowSeconds * 1000),
      limit: matchedConfig.maxRequests,
    };
  }

  async getThrottleStatus(): Promise<ThrottleStatus> {
    let throttledCount = 0;

    this.rateLimitEntries.forEach((entries) => {
      const windowStart = new Date(Date.now() - 60000);
      if (entries.some((e) => e.windowStart > windowStart)) {
        throttledCount++;
      }
    });

    return {
      enabled: this.throttleEnabled,
      globalRateLimit: 10000,
      perIpRateLimit: 1000,
      currentlyThrottled: throttledCount,
    };
  }

  async getRateLimitStats(): Promise<{
    totalRequests: number;
    throttledRequests: number;
    byEndpoint: Record<string, { requests: number; throttled: number }>;
  }> {
    let totalRequests = 0;
    let throttledRequests = 0;
    const byEndpoint: Record<string, { requests: number; throttled: number }> = {};

    this.rateLimitEntries.forEach((entries, key) => {
      const [, endpoint] = key.split(':');
      const throttled = entries.length;

      totalRequests += throttled;
      throttledRequests += throttled;

      if (!byEndpoint[endpoint]) {
        byEndpoint[endpoint] = { requests: 0, throttled: 0 };
      }
      byEndpoint[endpoint].requests += throttled;
    });

    return {
      totalRequests,
      throttledRequests,
      byEndpoint,
    };
  }

  async enableThrottling(): Promise<void> {
    this.throttleEnabled = true;
  }

  async disableThrottling(): Promise<void> {
    this.throttleEnabled = false;
  }

  async addRateLimitConfig(config: Omit<RateLimitConfig, 'tier'>): Promise<RateLimitConfig> {
    const newConfig: RateLimitConfig = {
      ...config,
      tier: 'basic',
    };
    this.rateLimitConfigs.set(config.endpoint, newConfig);
    return newConfig;
  }

  async removeRateLimitConfig(endpoint: string): Promise<boolean> {
    return this.rateLimitConfigs.delete(endpoint);
  }
}
