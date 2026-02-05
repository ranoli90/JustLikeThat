import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface MetricDataPoint {
  name: string;
  labels: Record<string, string>;
  value: number;
  timestamp?: Date;
}

export interface MetricQueryParams {
  name?: string;
  labels?: Record<string, string>;
  startTime?: Date;
  endTime?: Date;
  step?: string;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly prometheusEndpoint = process.env.PROMETHEUS_ENDPOINT || 'http://localhost:9090';
  private readonly scrapeInterval = 15000; // 15 seconds

  // In-memory metrics buffer for high-throughput ingestion
  private metricsBuffer: MetricDataPoint[] = [];
  private readonly bufferFlushInterval = 1000; // Flush every second

  constructor(private readonly prisma: PrismaService) {
    // Start buffer flush interval
    setInterval(() => this.flushMetricsBuffer(), this.bufferFlushInterval);
  }

  /**
   * Record a counter metric
   */
  async recordCounter(name: string, labels: Record<string, string>, value: number = 1): Promise<void> {
    await this.recordMetric({
      name: `${name}_counter`,
      labels,
      value,
      timestamp: new Date(),
    });
  }

  /**
   * Record a gauge metric
   */
  async recordGauge(name: string, labels: Record<string, string>, value: number): Promise<void> {
    await this.recordMetric({
      name: `${name}_gauge`,
      labels,
      value,
      timestamp: new Date(),
    });
  }

  /**
   * Record a histogram metric
   */
  async recordHistogram(
    name: string,
    labels: Record<string, string>,
    value: number,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0]
  ): Promise<void> {
    // Record the sum
    await this.recordMetric({
      name: `${name}_histogram_sum`,
      labels,
      value,
      timestamp: new Date(),
    });

    // Record the count
    await this.recordMetric({
      name: `${name}_histogram_count`,
      labels,
      value: 1,
      timestamp: new Date(),
    });

    // Record bucket counts
    for (const bucket of buckets) {
      await this.recordMetric({
        name: `${name}_histogram_bucket`,
        labels: { ...labels, le: bucket.toString() },
        value: value <= bucket ? 1 : 0,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Record a metric data point
   */
  async recordMetric(dataPoint: MetricDataPoint): Promise<void> {
    this.metricsBuffer.push(dataPoint);
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.prisma.metricSeries.createMany({
        data: metricsToFlush.map(m => ({
          id: uuidv4(),
          name: m.name,
          labels: m.labels as any,
          value: m.value,
          timestamp: m.timestamp || new Date(),
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      this.logger.error(`Failed to flush metrics buffer: ${error.message}`);
      // Re-add failed metrics to buffer for retry
      this.metricsBuffer = [...metricsToFlush, ...this.metricsBuffer];
    }
  }

  /**
   * Query metrics
   */
  async query(params: MetricQueryParams): Promise<any> {
    const where: any = {};

    if (params.name) {
      where.name = params.name;
    }

    if (params.labels) {
      where.labels = params.labels as any;
    }

    if (params.startTime || params.endTime) {
      where.timestamp = {};
      if (params.startTime) {
        where.timestamp.gte = params.startTime;
      }
      if (params.endTime) {
        where.timestamp.lte = params.endTime;
      }
    }

    return this.prisma.metricSeries.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });
  }

  /**
   * Query metrics over a time range
   */
  async queryRange(params: MetricQueryParams, step: number = 15): Promise<any> {
    const where: any = {};

    if (params.name) {
      where.name = params.name;
    }

    if (params.startTime && params.endTime) {
      where.timestamp = {
        gte: params.startTime,
        lte: params.endTime,
      };
    }

    const metrics = await this.prisma.metricSeries.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    // Aggregate by step if needed
    return this.aggregateByStep(metrics, step);
  }

  /**
   * Get available metric names
   */
  async getMetricNames(): Promise<string[]> {
    const result = await this.prisma.metricSeries.groupBy({
      by: ['name'],
    });

    return result.map(r => r.name);
  }

  /**
   * Get label values for a specific label
   */
  async getLabelValues(labelName: string): Promise<string[]> {
    // This is a simplified implementation
    // In production, use a more efficient approach
    const result = await this.prisma.metricSeries.findMany({
      take: 10000,
      select: {
        labels: true,
      },
    });

    const values = new Set<string>();
    for (const r of result) {
      const labels = r.labels as Record<string, string>;
      if (labels[labelName]) {
        values.add(labels[labelName]);
      }
    }

    return Array.from(values);
  }

  /**
   * Calculate error rate
   */
  async calculateErrorRate(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const errors = await this.prisma.metricSeries.count({
      where: {
        name: 'http_requests_total',
        timestamp: { gte: startTime, lte: endTime },
        labels: {
          path: {
            contains: serviceName,
          },
        },
      },
    });

    const total = await this.prisma.metricSeries.count({
      where: {
        name: 'http_requests_total',
        timestamp: { gte: startTime, lte: endTime },
      },
    });

    return total > 0 ? errors / total : 0;
  }

  /**
   * Calculate request latency
   */
  async calculateLatency(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ p50: number; p90: number; p99: number; avg: number }> {
    const latencies = await this.prisma.metricSeries.findMany({
      where: {
        name: 'http_request_duration_seconds',
        timestamp: { gte: startTime, lte: endTime },
      },
    });

    const values = latencies.map(l => l.value).sort((a, b) => a - b);

    if (values.length === 0) {
      return { p50: 0, p90: 0, p99: 0, avg: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      p50: this.percentile(values, 50),
      p90: this.percentile(values, 90),
      p99: this.percentile(values, 99),
      avg,
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, index)] || 0;
  }

  /**
   * Aggregate metrics by time step
   */
  private aggregateByStep(metrics: any[], step: number): any[] {
    if (metrics.length === 0) return [];

    const grouped = new Map<string, { sum: number; count: number; values: number[] }>();

    for (const m of metrics) {
      const timeBucket = Math.floor(m.timestamp.getTime() / (step * 1000));
      const key = `${m.name}_${timeBucket}`;

      if (!grouped.has(key)) {
        grouped.set(key, { sum: 0, count: 0, values: [] });
      }

      const group = grouped.get(key)!;
      group.sum += m.value;
      group.count += 1;
      group.values.push(m.value);
    }

    return Array.from(grouped.entries()).map(([key, data]) => {
      const [name, timeBucket] = key.split('_');
      return {
        name,
        timestamp: new Date(parseInt(timeBucket) * step * 1000),
        value: data.sum,
        count: data.count,
        avg: data.sum / data.count,
      };
    });
  }

  /**
   * Cleanup old metrics (retention: 15 months)
   */
  async cleanupOldMetrics(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 15);

    const result = await this.prisma.metricSeries.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old metrics`);
    return result.count;
  }
}
