import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';

interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
  connectionTimeout: number;
  maxRetries: number;
}

interface PoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  averageAcquireTime: number;
  connectionErrors: number;
}

interface ConnectionMetrics {
  timestamp: Date;
  acquireTime: number;
  queryTime: number;
  connectionId: string;
}

@Injectable()
export class ConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private pool: QueryRunner[] = [];
  private availableConnections: QueryRunner[] = [];
  private waitingQueue: Array<{
    resolve: (runner: QueryRunner) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private metrics: ConnectionMetrics[] = [];
  private connectionErrors: number = 0;
  private config: PoolConfig;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      minConnections: this.configService.get<number>('DB_MIN_POOL_SIZE', 5),
      maxConnections: this.configService.get<number>('DB_MAX_POOL_SIZE', 20),
      acquireTimeout: this.configService.get<number>('DB_ACQUIRE_TIMEOUT', 30000),
      idleTimeout: this.configService.get<number>('DB_IDLE_TIMEOUT', 60000),
      connectionTimeout: this.configService.get<number>('DB_CONNECTION_TIMEOUT', 10000),
      maxRetries: this.configService.get<number>('DB_MAX_RETRIES', 3),
    };
  }

  async onModuleInit() {
    await this.initializePool();
    this.startPoolMonitor();
  }

  async onModuleDestroy() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    await this.closeAllConnections();
  }

  /**
   * Initialize the connection pool
   */
  private async initializePool(): Promise<void> {
    this.logger.log(`Initializing connection pool with ${this.config.minConnections} connections`);

    for (let i = 0; i < this.config.minConnections; i++) {
      try {
        const runner = await this.createConnection();
        this.pool.push(runner);
        this.availableConnections.push(runner);
      } catch (error) {
        this.logger.error(`Failed to create initial connection ${i}`, error);
        this.connectionErrors++;
      }
    }

    this.logger.log(`Connection pool initialized with ${this.availableConnections.length} connections`);
  }

  /**
   * Create a new database connection
   */
  private async createConnection(): Promise<QueryRunner> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    return runner;
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<QueryRunner> {
    const startTime = Date.now();

    // Check for available connection
    if (this.availableConnections.length > 0) {
      const runner = this.availableConnections.shift()!;
      this.recordMetrics(startTime, runner);
      return runner;
    }

    // Check if we can create more connections
    if (this.pool.length < this.config.maxConnections) {
      try {
        const runner = await this.createConnection();
        this.pool.push(runner);
        this.recordMetrics(startTime, runner);
        return runner;
      } catch (error) {
        this.logger.error('Failed to create new connection', error);
        this.connectionErrors++;
        throw error;
      }
    }

    // Wait for an available connection
    return this.waitForConnection(startTime);
  }

  /**
   * Wait for an available connection
   */
  private waitForConnection(startTime: number): Promise<QueryRunner> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(w => w.reject === reject);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  /**
   * Release a connection back to the pool
   */
  async releaseConnection(runner: QueryRunner): Promise<void> {
    if (this.waitingQueue.length > 0) {
      // Give to waiting request
      const waiting = this.waitingQueue.shift()!;
      clearTimeout(waiting.timeout);
      waiting.resolve(runner);
    } else {
      // Return to available pool
      this.availableConnections.push(runner);
    }
  }

  /**
   * Execute a transaction with connection pooling
   */
  async withTransaction<T>(
    callback: (runner: QueryRunner) => Promise<T>,
    retries: number = this.config.maxRetries,
  ): Promise<T> {
    let runner: QueryRunner | null = null;
    
    try {
      runner = await this.getConnection();
      return await callback(runner);
    } catch (error) {
      if (retries > 0) {
        this.logger.warn(`Transaction failed, retrying... (${retries} retries left)`);
        // Create new connection in case of failure
        if (runner) {
          await this.removeConnection(runner);
          runner = await this.getConnection();
        }
        return this.withTransaction(callback, retries - 1);
      }
      throw error;
    } finally {
      if (runner) {
        await this.releaseConnection(runner);
      }
    }
  }

  /**
   * Remove a connection from the pool
   */
  private async removeConnection(runner: QueryRunner): Promise<void> {
    const index = this.pool.indexOf(runner);
    if (index !== -1) {
      this.pool.splice(index, 1);
      await runner.release();
    }
  }

  /**
   * Record connection metrics
   */
  private recordMetrics(startTime: number, runner: QueryRunner): void {
    this.metrics.push({
      timestamp: new Date(),
      acquireTime: Date.now() - startTime,
      queryTime: 0,
      connectionId: runner.connection.name,
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Start pool monitoring
   */
  private startPoolMonitor(): void {
    this.monitorInterval = setInterval(async () => {
      await this.maintainPool();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Maintain pool size
   */
  private async maintainPool(): Promise<void> {
    // Check for idle connections to close
    while (this.pool.length > this.config.minConnections && 
           this.availableConnections.length > this.config.minConnections) {
      const runner = this.availableConnections.pop()!;
      await this.removeConnection(runner);
    }

    // Check for idle connections that should be released
    const now = Date.now();
    const toRemove: QueryRunner[] = [];

    for (const runner of this.availableConnections) {
      const idleTime = now - (runner as any).lastUsed || 0;
      if (idleTime > this.config.idleTimeout) {
        toRemove.push(runner);
      }
    }

    for (const runner of toRemove) {
      this.availableConnections = this.availableConnections.filter(r => r !== runner);
      await this.removeConnection(runner);
    }

    // Log pool status
    this.logger.debug(`Pool status: total=${this.pool.length}, available=${this.availableConnections.length}, waiting=${this.waitingQueue.length}`);
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const acquireTimes = this.metrics.map(m => m.acquireTime);
    const avgAcquireTime = acquireTimes.length > 0
      ? acquireTimes.reduce((a, b) => a + b, 0) / acquireTimes.length
      : 0;

    return {
      totalConnections: this.pool.length,
      idleConnections: this.availableConnections.length,
      activeConnections: this.pool.length - this.availableConnections.length,
      waitingRequests: this.waitingQueue.length,
      averageAcquireTime: Math.round(avgAcquireTime),
      connectionErrors: this.connectionErrors,
    };
  }

  /**
   * Get detailed pool metrics
   */
  getMetrics(): {
    acquireTimeDistribution: { p50: number; p90: number; p99: number };
    recentErrors: number;
    poolUtilization: number;
  } {
    const acquireTimes = this.metrics.map(m => m.acquireTime).sort((a, b) => a - b);
    
    const percentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    return {
      acquireTimeDistribution: {
        p50: percentile(acquireTimes, 50),
        p90: percentile(acquireTimes, 90),
        p99: percentile(acquireTimes, 99),
      },
      recentErrors: this.connectionErrors,
      poolUtilization: this.pool.length > 0
        ? ((this.pool.length - this.availableConnections.length) / this.config.maxConnections) * 100
        : 0,
    };
  }

  /**
   * Health check for pool
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: PoolStats;
  }> {
    const stats = this.getStats();
    
    if (stats.totalConnections === 0) {
      return { status: 'unhealthy', details: stats };
    }
    
    if (stats.waitingRequests > 0 || stats.activeConnections >= stats.totalConnections) {
      return { status: 'degraded', details: stats };
    }
    
    return { status: 'healthy', details: stats };
  }

  /**
   * Pre-warm connections
   */
  async warmConnections(count: number): Promise<void> {
    this.logger.log(`Pre-warming ${count} connections`);
    
    for (let i = 0; i < count; i++) {
      try {
        const runner = await this.createConnection();
        this.pool.push(runner);
        this.availableConnections.push(runner);
      } catch (error) {
        this.logger.error(`Failed to pre-warm connection ${i}`, error);
      }
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    this.logger.log('Closing all pool connections');
    
    for (const runner of this.pool) {
      await runner.release();
    }
    
    this.pool = [];
    this.availableConnections = [];
    
    // Reject waiting requests
    for (const waiting of this.waitingQueue) {
      clearTimeout(waiting.timeout);
      waiting.reject(new Error('Pool shutting down'));
    }
    this.waitingQueue = [];
  }

  /**
   * Get pool configuration
   */
  getConfig(): PoolConfig {
    return { ...this.config };
  }
}
