import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = 3600; // 1 hour

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Cache get failed for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redisService.setex(key, ttl, serialized);
      } else {
        await this.redisService.set(key, serialized);
        // Set expiration on the key
        await this.redisService.expire(key, this.defaultTtl);
      }
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${key}: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete failed for key ${key}: ${error.message}`);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        for (const key of keys) {
          await this.redisService.del(key);
        }
      }
    } catch (error) {
      this.logger.warn(`Cache deletePattern failed for pattern ${pattern}: ${error.message}`);
    }
  }

  async invalidateNamespace(namespace: string): Promise<void> {
    await this.deletePattern(`*:${namespace}:*`);
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.redisService.incr(key);
    } catch (error) {
      this.logger.warn(`Cache increment failed for key ${key}: ${error.message}`);
      return 0;
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      return await this.redisService.decr(key);
    } catch (error) {
      this.logger.warn(`Cache decrement failed for key ${key}: ${error.message}`);
      return 0;
    }
  }

  async addToSet(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redisService.sadd(key, ...values);
    } catch (error) {
      this.logger.warn(`Cache sadd failed for key ${key}: ${error.message}`);
      return 0;
    }
  }

  async getSetMembers(key: string): Promise<string[]> {
    try {
      return await this.redisService.smembers(key);
    } catch (error) {
      this.logger.warn(`Cache smembers failed for key ${key}: ${error.message}`);
      return [];
    }
  }
}
