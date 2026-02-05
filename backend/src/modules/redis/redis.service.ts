import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private clusterMode: boolean = false;

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const isCluster = process.env.REDIS_CLUSTER === 'true';
    
    if (isCluster) {
      this.clusterMode = true;
      await this.connectCluster();
    } else {
      await this.connectStandalone();
    }
  }

  private async connectStandalone(): Promise<void> {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD;

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis connected to ${host}:${port}`);
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });

    await this.client.connect();
  }

  private async connectCluster(): Promise<void> {
    const nodes = (process.env.REDIS_CLUSTER_NODES || 'localhost:6379,localhost:6380,localhost:6381')
      .split(',')
      .map(node => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port, 10) };
      });

    this.client = new Redis.Cluster(nodes, {
      scaleReads: 'slave',
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
      },
      clusterRetryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('ready', () => {
      this.logger.log('Redis cluster ready');
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis cluster error: ${error.message}`);
    });
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  // ========== BASIC OPERATIONS ==========

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.client.setex(key, seconds, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrby(key: string, amount: number): Promise<number> {
    return this.client.incrby(key, amount);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // ========== HASH OPERATIONS ==========

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hincrby(key: string, field: string, amount: number): Promise<number> {
    return this.client.hincrby(key, field, amount);
  }

  async hexists(key: string, field: string): Promise<boolean> {
    const result = await this.client.hexists(key, field);
    return result === 1;
  }

  // ========== LIST OPERATIONS ==========

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  // ========== SET OPERATIONS ==========

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  // ========== SORTED SET OPERATIONS ==========

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.client.zrem(key, ...members);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  // ========== PUB/SUB ==========

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  // ========== UTILITY ==========

  async ping(): Promise<'PONG'> {
    return this.client.ping();
  }

  async info(section?: string): Promise<string> {
    return this.client.info(section);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushdb(): Promise<'OK'> {
    return this.client.flushdb();
  }

  async select(database: number): Promise<'OK'> {
    return this.client.select(database);
  }

  // ========== SCRIPTING ==========

  async eval(script: string, keys: string[], args: (string | number)[]): Promise<any> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  async evalsha(sha1: string, keys: string[], args: (string | number)[]): Promise<any> {
    return this.client.evalsha(sha1, keys.length, ...keys, ...args);
  }

  async scriptLoad(script: string): Promise<string> {
    return this.client.script('LOAD', script);
  }

  async scriptExists(...sha1s: string[]): Promise<number[]> {
    return this.client.script('EXISTS', ...sha1s);
  }

  // ========== TRANSACTIONS ==========

  async multi(): Promise<Redis.Transaction> {
    return this.client.multi();
  }

  // ========== STREAM OPERATIONS ==========

  async xadd(key: string, id: string, field: string, value: string): Promise<string> {
    return this.client.xadd(key, id, field, value);
  }

  async xread(count: number, block: number, ...streams: string[]): Promise<any> {
    return this.client.xread('COUNT', count, 'BLOCK', block, 'STREAMS', ...streams);
  }

  async xgroupCreate(key: string, group: string, id: string, mkstream?: boolean): Promise<'OK'> {
    return this.client.xgroup('CREATE', key, group, id, mkstream ? 'MKSTREAM' : undefined);
  }

  async xreadgroup(group: string, consumer: string, count: number, block: number, ...streams: string[]): Promise<any> {
    return this.client.xreadgroup('GROUP', group, consumer, 'COUNT', count, 'BLOCK', block, 'STREAMS', ...streams);
  }

  async xack(key: string, group: string, ...ids: string[]): Promise<number> {
    return this.client.xack(key, group, ...ids);
  }

  getClient(): Redis {
    return this.client;
  }

  isClusterMode(): boolean {
    return this.clusterMode;
  }
}
