import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { RateLimitResult } from '../interfaces/gateway.interface';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly defaultWindowSeconds = 60;
  private readonly defaultMaxRequests = 1000;

  constructor(private readonly redisService: RedisService) {}

  async checkLimit(
    service: string,
    clientId: string,
    endpoint: string,
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${service}:${clientId}:${endpoint}`;
    const windowKey = `ratelimit:window:${service}:${endpoint}`;

    try {
      // Get rate limit configuration
      const config = await this.getRateLimitConfig(service, endpoint);
      
      // Check current count in Redis
      const [currentCount, ttl] = await Promise.all([
        this.redisService.get(key),
        this.redisService.ttl(key),
      ]);

      const now = Date.now();
      const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000);
      
      if (currentCount === null || ttl <= 0) {
        // First request in window
        await this.redisService.setex(
          key,
          config.windowSeconds,
          '1',
        );

        // Update window stats
        await this.redisService.hincrby(windowKey, 'total_requests', 1);
        await this.redisService.expire(windowKey, config.windowSeconds * 2);

        return {
          allowed: true,
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          resetAt: windowStart + (config.windowSeconds * 1000),
        };
      }

      const count = parseInt(currentCount, 10);
      
      if (count >= config.maxRequests) {
        // Rate limit exceeded
        const retryAfter = ttl;
        
        await this.redisService.incrby(windowKey, 'rate_limited_requests', 1);

        return {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetAt: windowStart + (config.windowSeconds * 1000),
          retryAfter,
        };
      }

      // Increment counter
      await this.redisService.incr(key);
      await this.redisService.hincrby(windowKey, 'total_requests', 1);

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - count - 1,
        resetAt: windowStart + (config.windowSeconds * 1000),
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error.message}`);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        limit: this.defaultMaxRequests,
        remaining: this.defaultMaxRequests - 1,
        resetAt: Date.now() + (this.defaultWindowSeconds * 1000),
      };
    }
  }

  async getRateLimitConfig(
    service: string,
    endpoint: string,
  ): Promise<{ maxRequests: number; windowSeconds: number }> {
    const configKey = `ratelimit:config:${service}:${endpoint}`;
    const defaultConfigKey = `ratelimit:config:${service}:default`;
    
    try {
      const config = await this.redisService.hgetall(configKey);
      
      if (Object.keys(config).length === 0) {
        const defaultConfig = await this.redisService.hgetall(defaultConfigKey);
        
        if (Object.keys(defaultConfig).length > 0) {
          return {
            maxRequests: parseInt(defaultConfig.max_requests, 10) || this.defaultMaxRequests,
            windowSeconds: parseInt(defaultConfig.window_seconds, 10) || this.defaultWindowSeconds,
          };
        }
      }

      return {
        maxRequests: parseInt(config.max_requests, 10) || this.defaultMaxRequests,
        windowSeconds: parseInt(config.window_seconds, 10) || this.defaultWindowSeconds,
      };
    } catch {
      return {
        maxRequests: this.defaultMaxRequests,
        windowSeconds: this.defaultWindowSeconds,
      };
    }
  }

  async setRateLimitConfig(
    service: string,
    endpoint: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<void> {
    const configKey = endpoint === '*' 
      ? `ratelimit:config:${service}:default`
      : `ratelimit:config:${service}:${endpoint}`;

    await this.redisService.hset(configKey, {
      max_requests: maxRequests.toString(),
      window_seconds: windowSeconds.toString(),
    });
    await this.redisService.expire(configKey, 86400); // 24 hours
  }

  async getRateLimitStats(service: string, endpoint: string): Promise<any> {
    const windowKey = `ratelimit:window:${service}:${endpoint}`;
    
    try {
      const stats = await this.redisService.hgetall(windowKey);
      return {
        service,
        endpoint,
        stats: {
          totalRequests: parseInt(stats.total_requests || '0', 10),
          rateLimitedRequests: parseInt(stats.rate_limited_requests || '0', 10),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get rate limit stats: ${error.message}`);
      return { service, endpoint, stats: null };
    }
  }
}
