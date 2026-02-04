import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

interface MetricSeries {
  name: string;
  tags: Record<string, string>;
  data: Array<{ value: number; timestamp: Date }>;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  gc: {
    pauseCount: number;
    pauseTime: number;
  };
  eventLoop: {
    lag: number;
  };
  requests: {
    total: number;
    active: number;
    rate: number;
  };
  database: {
    connectionsActive: number;
    connectionsIdle: number;
    queryTime: number;
  };
}

interface PerformanceSnapshot {
  timestamp: Date;
  uptime: number;
  metrics: SystemMetrics;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, MetricPoint[]> = new Map();
  private startTime: Date;
  private requestCount: number = 0;
  private activeRequests: number = 0;
  private eventLoopLag: number[] = [];
  private readonly maxDataPoints = 1000;

  constructor(private readonly configService: ConfigService) {
    this.startTime = new Date();
  }

  async onModuleInit() {
    this.startMetricsCollection();
    this.logger.log('Metrics service initialized');
  }

  /**
   * Start collecting system metrics
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // Collect every 10 seconds
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.recordMetric('system.cpu.usage', cpuUsage.user / 1000000, {});
    this.recordMetric('system.memory.heapUsed', memoryUsage.heapUsed, {});
    this.recordMetric('system.memory.heapTotal', memoryUsage.heapTotal, {});
    this.recordMetric('system.memory.external', memoryUsage.external, {});
    this.recordMetric('system.memory.rss', memoryUsage.rss, {});

    // Calculate GC metrics if available
    if (global.gc) {
      global.gc();
    }

    // Calculate event loop lag
    const start = Date.now();
    setImmediate(() => {
      this.eventLoopLag.push(Date.now() - start);
      if (this.eventLoopLag.length > 100) {
        this.eventLoopLag.shift();
      }
    });
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const series = this.metrics.get(key)!;
    series.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    });

    // Keep only recent data points
    if (series.length > this.maxDataPoints) {
      series.shift();
    }
  }

  /**
   * Increment a counter metric
   */
  incrementMetric(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags);
  }

  /**
   * Record timing metric
   */
  recordTiming(name: string, duration: number, tags: Record<string, string> = {}): void {
    this.recordMetric(`${name}.timing`, duration, tags);
  }

  /**
   * Record request
   */
  recordRequest(duration: number, statusCode: number, path: string): void {
    this.requestCount++;
    
    this.recordMetric('http.requests.total', 1, {
      path: this.normalizePath(path),
      statusCode: statusCode.toString(),
    });
    
    this.recordMetric('http.requests.duration', duration, {
      path: this.normalizePath(path),
      statusCode: statusCode.toString(),
    });
  }

  /**
   * Normalize path for metrics (remove IDs, etc.)
   */
  private normalizePath(path: string): string {
    return path.replace(/\/[0-9a-f-]{36}/g, '/:id').replace(/\/\d+/g, '/:id');
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = require('os').loadavg();

    const avgEventLoopLag = this.eventLoopLag.length > 0
      ? this.eventLoopLag.reduce((a, b) => a + b, 0) / this.eventLoopLag.length
      : 0;

    return {
      cpu: {
        usage: cpuUsage.user / 1000000,
        cores: require('os').cpus().length,
        loadAverage: loadAvg,
      },
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      gc: {
        pauseCount: 0, // Would be collected from GC hooks
        pauseTime: 0,
      },
      eventLoop: {
        lag: avgEventLoopLag,
      },
      requests: {
        total: this.requestCount,
        active: this.activeRequests,
        rate: this.requestCount / (Date.now() - this.startTime.getTime()) * 1000,
      },
      database: {
        connectionsActive: 0, // Would be from connection pool
        connectionsIdle: 0,
        queryTime: 0,
      },
    };
  }

  /**
   * Get performance snapshot
   */
  getSnapshot(): PerformanceSnapshot {
    return {
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      metrics: this.getSystemMetrics(),
    };
  }

  /**
   * Get metric series
   */
  getMetricSeries(name: string, tags?: Record<string, string>, duration?: number): MetricSeries {
    const filterTags = tags || {};
    const filterKey = `${name}:${JSON.stringify(filterTags)}`;
    
    const series: MetricSeries = {
      name,
      tags: filterTags,
      data: [],
    };

    // Find matching series
    for (const [key, points] of this.metrics.entries()) {
      const pointTags = JSON.parse(key.split(':')[1] || '{}');
      
      const matches = Object.entries(filterTags).every(
        ([k, v]) => pointTags[k] === v
      ) && (name === key.split(':')[0] || points.some(p => p.name === name));

      if (matches) {
        const cutoff = duration ? Date.now() - duration : 0;
        series.data.push(...points
          .filter(p => p.timestamp.getTime() > cutoff)
          .map(p => ({ value: p.value, timestamp: p.timestamp }))
        );
      }
    }

    // Sort by timestamp
    series.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return series;
  }

  /**
   * Get all metrics summary
   */
  getSummary(): {
    uptime: number;
    requestCount: number;
    memoryUsage: number;
    cpuUsage: number;
    eventLoopLag: number;
  } {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const avgEventLoopLag = this.eventLoopLag.length > 0
      ? this.eventLoopLag.reduce((a, b) => a + b, 0) / this.eventLoopLag.length
      : 0;

    return {
      uptime: Date.now() - this.startTime.getTime(),
      requestCount: this.requestCount,
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: cpuUsage.user / 1000000,
      eventLoopLag: avgEventLoopLag,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheusFormat(): string {
    let output = '';
    const now = Date.now();

    for (const [key, points] of this.metrics.entries()) {
      const [name, tagsJson] = key.split(':');
      const tags = JSON.parse(tagsJson || '{}');
      
      const tagString = Object.entries(tags)
        .map(([k, v]) => `${k}="${v}"`)
        .join(', ');

      for (const point of points.slice(-100)) { // Last 100 points
        output += `# TYPE ${name} gauge\n`;
        output += `${name}{${tagString}} ${point.value} ${now}\n`;
      }
    }

    return output;
  }

  /**
   * Calculate percentiles
   */
  calculatePercentiles(name: string, percentile: number, tags?: Record<string, string>): number {
    const series = this.getMetricSeries(name, tags);
    const values = series.data.map(d => d.value).sort((a, b) => a - b);
    
    if (values.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      memory: boolean;
      cpu: boolean;
      eventLoop: boolean;
    };
  } {
    const metrics = this.getSystemMetrics();
    const memoryPercentage = metrics.memory.percentage;
    const cpuUsage = metrics.cpu.usage;
    const eventLoopLag = metrics.eventLoop.lag;

    const checks = {
      memory: memoryPercentage < 90,
      cpu: cpuUsage < 90,
      eventLoop: eventLoopLag < 100,
    };

    const status = Object.values(checks).every(v => v)
      ? 'healthy'
      : Object.values(checks).some(v => !v)
        ? 'degraded'
        : 'unhealthy';

    return { status, checks };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.requestCount = 0;
    this.eventLoopLag = [];
  }
}
