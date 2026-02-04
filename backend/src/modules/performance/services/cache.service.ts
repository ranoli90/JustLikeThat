import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

interface CacheOptions {
  ttl?: number;
  prefix?: string;
  compression?: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  keys: number;
}

interface DistributedLock {
  key: string;
  token: string;
  acquiredAt: number;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private readonly defaultTTL = 3600; // 1 hour
  private readonly maxMemory = '512mb';
  private stats = { hits: 0, misses: 0 };
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private readonly localCacheTTL = 60000; // 1 minute local cache

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 10000,
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    await this.redis.connect();

    // Configure Redis memory settings
    await this.redis.config('SET', 'maxmemory', this.maxMemory);
    await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru');

    // Start local cache cleanup interval
    this.startLocalCacheCleanup();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private startLocalCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.localCache.entries()) {
        if (entry.expiresAt < now) {
          this.localCache.delete(key);
        }
      }
    }, 30000); // Clean every 30 seconds
  }

  /**
   * Get value from cache with local cache layer
   */
  async get<T>(key: string): Promise<T | null> {
    const localKey = `local:${key}`;
    const localEntry = this.localCache.get(localKey);
    
    if (localEntry && localEntry.expiresAt > Date.now()) {
      return localEntry.data as T;
    }

    try {
      const value = await this.redis.get(key);
      
      if (value) {
        this.stats.hits++;
        const parsed = JSON.parse(value);
        
        // Populate local cache
        this.localCache.set(localKey, {
          data: parsed,
          expiresAt: Date.now() + this.localCacheTTL,
          createdAt: Date.now(),
        });
        
        return parsed as T;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = this.defaultTTL, prefix = 'app' } = options;
    const prefixedKey = `${prefix}:${key}`;

    try {
      const serialized = JSON.stringify(value);
      
      await this.redis.setex(prefixedKey, ttl, serialized);
      
      // Update local cache
      const localKey = `local:${prefixedKey}`;
      this.localCache.set(localKey, {
        data: value,
        expiresAt: Date.now() + Math.min(ttl * 1000, this.localCacheTTL),
        createdAt: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Cache set error for key: ${prefixedKey}`, error);
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.localCache.delete(`local:${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      this.logger.error(`Cache delete pattern error: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Get or set - cacheaside pattern
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    return this.redis.incrby(key, amount);
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    return this.redis.decrby(key, amount);
  }

  /**
   * Set if not exists (for distributed locking)
   */
  async setNX<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    const result = await this.redis.setnx(key, JSON.stringify(value));
    if (result === 1) {
      await this.redis.expire(key, ttl);
      return true;
    }
    return false;
  }

  /**
   * Acquire distributed lock
   */
  async acquireLock(
    lockName: string,
    ttl: number = 30000,
  ): Promise<DistributedLock | null> {
    const token = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const lockKey = `lock:${lockName}`;

    const acquired = await this.setNX(lockKey, token, ttl);
    if (acquired) {
      return {
        key: lockKey,
        token,
        acquiredAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000,
      };
    }

    return null;
  }

  /**
   * Release distributed lock
   */
  async releaseLock(lock: DistributedLock): Promise<boolean> {
    const currentToken = await this.redis.get(lock.key);
    if (currentToken === lock.token) {
      await this.redis.del(lock.key);
      return true;
    }
    return false;
  }

  /**
   * Execute operations in batch
   */
  async pipeline(
    operations: Array<() => Promise<any>>,
  ): Promise<any[]> {
    const pipeline = this.redis.pipeline();
    const results: any[] = [];

    for (const operation of operations) {
      results.push(await operation());
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const info = await this.redis.info('memory');
    const dbsize = await this.redis.dbsize();

    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const size = memoryMatch ? memoryMatch[1] : 'Unknown';

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      size,
      keys: dbsize,
    };
  }

  /**
   * Cache tag-based invalidation
   */
  async invalidateByTag(tag: string): Promise<void> {
    await this.deletePattern(`*:${tag}:*`);
  }

  /**
   * Store with tags
   */
  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl: number = 3600,
  ): Promise<void> {
    await this.set(key, value, { ttl });
    
    const tagKeys = tags.map(tag => `tag:${tag}:${key}`);
    await this.redis.sadd(...tagKeys);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<number> {
    return this.redis.publish(channel, JSON.stringify(message));
  }
}
