import { Injectable, Logger } from '@nestjs/common';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  retryAfterMs: number;
}

export interface RateLimitInfo {
  sourceId: string;
  remaining: number;
  limit: number;
  resetTime: number;
  retryAfter?: number;
}

export interface CostInfo {
  sourceId: string;
  creditsUsed: number;
  creditsRemaining: number;
  costPerRequest: number;
  dailyCost: number;
  monthlyCost: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  // In-memory rate limit tracking (use Redis in production)
  private rateLimitStore: Map<string, { requests: number[]; lastReset: number }> = new Map();
  private costStore: Map<string, CostInfo> = new Map();

  // Default rate limits by source type
  private readonly defaultRateLimits: Record<string, Partial<RateLimitConfig>> = {
    linkedin: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      burstLimit: 5,
      retryAfterMs: 60000,
    },
    indeed: {
      requestsPerMinute: 30,
      requestsPerHour: 300,
      requestsPerDay: 3000,
      burstLimit: 10,
      retryAfterMs: 2000,
    },
    glassdoor: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      requestsPerDay: 2000,
      burstLimit: 8,
      retryAfterMs: 3000,
    },
    greenhouse: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 20,
      retryAfterMs: 1000,
    },
    lever: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 20,
      retryAfterMs: 1000,
    },
    workday: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      burstLimit: 10,
      retryAfterMs: 2000,
    },
    generic_scraper: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      burstLimit: 3,
      retryAfterMs: 5000,
    },
  };

  // Cost per request by source (in cents)
  private readonly costPerRequest: Record<string, number> = {
    linkedin: 5, // Premium API
    indeed: 2,
    glassdoor: 3,
    greenhouse: 0, // Free for public boards
    lever: 0, // Free for public boards
    workday: 2,
    generic_scraper: 0,
    remote_co: 0,
    we_work_remotely: 0,
    angellist: 0,
    dice: 4,
    techcrunch: 0,
  };

  checkRateLimit(sourceId: string): RateLimitInfo {
    const config = this.getRateLimitConfig(sourceId);
    const now = Date.now();
    
    let store = this.rateLimitStore.get(sourceId);
    if (!store) {
      store = { requests: [], lastReset: now };
      this.rateLimitStore.set(sourceId, store);
    }

    // Clean up old requests
    const minuteAgo = now - 60000;
    store.requests = store.requests.filter(t => t > minuteAgo);

    // Check if we're at the burst limit
    const recentRequests = store.requests.length;
    const remaining = Math.max(0, config.burstLimit - recentRequests);

    if (remaining <= 0) {
      const retryAfter = config.retryAfterMs;
      this.logger.warn(`Rate limit exceeded for ${sourceId}, retry after ${retryAfter}ms`);
      
      return {
        sourceId,
        remaining: 0,
        limit: config.burstLimit,
        resetTime: now + retryAfter,
        retryAfter,
      };
    }

    // Record this request
    store.requests.push(now);

    return {
      sourceId,
      remaining: remaining - 1,
      limit: config.burstLimit,
      resetTime: now + 60000,
    };
  }

  recordRequest(sourceId: string, creditsUsed: number = 1): void {
    // Update rate limit store
    const rateLimitInfo = this.checkRateLimit(sourceId);

    // Update cost store
    const costInfo = this.costStore.get(sourceId) || {
      sourceId,
      creditsUsed: 0,
      creditsRemaining: Infinity,
      costPerRequest: this.getCostPerRequest(sourceId),
      dailyCost: 0,
      monthlyCost: 0,
    };

    costInfo.creditsUsed += creditsUsed;
    costInfo.dailyCost = costInfo.creditsUsed * costInfo.costPerRequest;
    costInfo.monthlyCost = costInfo.dailyCost * 30;

    this.costStore.set(sourceId, costInfo);
  }

  getCostInfo(sourceId: string): CostInfo {
    return this.costStore.get(sourceId) || {
      sourceId,
      creditsUsed: 0,
      creditsRemaining: Infinity,
      costPerRequest: this.getCostPerRequest(sourceId),
      dailyCost: 0,
      monthlyCost: 0,
    };
  }

  getTotalCost(): { daily: number; monthly: number; bySource: CostInfo[] } {
    let dailyTotal = 0;
    let monthlyTotal = 0;
    const bySource: CostInfo[] = [];

    for (const [sourceId, costInfo] of this.costStore) {
      dailyTotal += costInfo.dailyCost;
      monthlyTotal += costInfo.monthlyCost;
      bySource.push(costInfo);
    }

    return { daily: dailyTotal, monthly: monthlyTotal, bySource };
  }

  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalCost = this.getTotalCost();

    // Check for high-cost sources
    for (const [sourceId, costInfo] of this.costStore) {
      if (costInfo.dailyCost > 100) { // More than $1/day
        recommendations.push(
          `Consider reducing usage of ${sourceId} - current daily cost: $${(costInfo.dailyCost / 100).toFixed(2)}`
        );
      }
    }

    // Check for rate limit issues
    for (const [sourceId, store] of this.rateLimitStore) {
      if (store.requests.length > 50) {
        recommendations.push(
          `${sourceId} has high request volume - consider caching results`
        );
      }
    }

    // General recommendations
    if (totalCost.monthly > 1000) {
      recommendations.push(
        'Monthly costs exceeding $10 - consider implementing request caching'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Current usage is well-optimized');
    }

    return recommendations;
  }

  getRateLimitConfig(sourceId: string): RateLimitConfig {
    const sourceType = this.getSourceType(sourceId);
    const defaultConfig = this.defaultRateLimits[sourceType] || this.defaultRateLimits.generic_scraper;

    return {
      requestsPerMinute: defaultConfig.requestsPerMinute || 10,
      requestsPerHour: defaultConfig.requestsPerHour || 100,
      requestsPerDay: defaultConfig.requestsPerDay || 1000,
      burstLimit: defaultConfig.burstLimit || 5,
      retryAfterMs: defaultConfig.retryAfterMs || 5000,
    };
  }

  getCostPerRequest(sourceId: string): number {
    const sourceType = this.getSourceType(sourceId);
    return this.costPerRequest[sourceType] || 1;
  }

  private getSourceType(sourceId: string): string {
    const knownSources = Object.keys(this.costPerRequest);
    for (const source of knownSources) {
      if (sourceId.toLowerCase().includes(source)) {
        return source;
      }
    }
    return 'generic_scraper';
  }

  async waitForRateLimit(sourceId: string): Promise<void> {
    const rateLimitInfo = this.checkRateLimit(sourceId);
    
    if (rateLimitInfo.retryAfter) {
      this.logger.debug(`Waiting ${rateLimitInfo.retryAfter}ms for ${sourceId} rate limit`);
      await this.delay(rateLimitInfo.retryAfter);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(sourceId?: string): void {
    if (sourceId) {
      this.rateLimitStore.delete(sourceId);
      this.costStore.delete(sourceId);
      this.logger.debug(`Reset rate limit for ${sourceId}`);
    } else {
      this.rateLimitStore.clear();
      this.costStore.clear();
      this.logger.debug('Reset all rate limits');
    }
  }
}
