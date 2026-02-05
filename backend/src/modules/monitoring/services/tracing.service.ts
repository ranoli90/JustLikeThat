import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: Date;
  duration: number;
  tags: Record<string, string | number | boolean>;
  logs: SpanLog[];
}

export interface SpanLog {
  timestamp: Date;
  fields: Record<string, string | number | boolean>;
}

export interface TraceSearchParams {
  serviceName?: string;
  operationName?: string;
  startTime?: Date;
  endTime?: Date;
  minDuration?: number;
  limit?: number;
  offset?: number;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private readonly jaegerEndpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268';
  private readonly maxSpansPerTrace = 10000;
  private samplingRate = 0.1; // 10% default

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new trace span
   */
  async createSpan(span: TraceSpan): Promise<string> {
    const spanId = uuidv4();
    
    try {
      await this.prisma.trace.create({
        data: {
          traceId: span.traceId,
          spanId,
          parentSpanId: span.parentSpanId,
          operationName: span.operationName,
          serviceName: span.serviceName,
          startTime: span.startTime,
          duration: span.duration,
          tags: span.tags as any,
          logs: span.logs as any,
        },
      });

      this.logger.debug(`Created span ${spanId} for trace ${span.traceId}`);
      return spanId;
    } catch (error) {
      this.logger.error(`Failed to create span: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get trace by ID with all spans
   */
  async getTrace(traceId: string) {
    return this.prisma.trace.findMany({
      where: { traceId },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Search traces with filters
   */
  async searchTraces(params: TraceSearchParams) {
    const where: any = {};

    if (params.serviceName) {
      where.serviceName = params.serviceName;
    }

    if (params.operationName) {
      where.operationName = params.operationName;
    }

    if (params.startTime || params.endTime) {
      where.startTime = {};
      if (params.startTime) {
        where.startTime.gte = params.startTime;
      }
      if (params.endTime) {
        where.startTime.lte = params.endTime;
      }
    }

    if (params.minDuration) {
      where.duration = { gte: params.minDuration };
    }

    const [traces, total] = await Promise.all([
      this.prisma.trace.findMany({
        where,
        take: params.limit || 100,
        skip: params.offset || 0,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.trace.count({ where }),
    ]);

    return { traces, total };
  }

  /**
   * Get all services with their operation counts
   */
  async getServices() {
    const services = await this.prisma.trace.groupBy({
      by: ['serviceName'],
      _count: true,
    });

    return services.map(s => ({
      name: s.serviceName,
      spanCount: s._count,
    }));
  }

  /**
   * Get operations for a service
   */
  async getOperations(serviceName: string) {
    const operations = await this.prisma.trace.groupBy({
      by: ['operationName'],
      where: { serviceName },
      _count: true,
    });

    return operations.map(o => ({
      name: o.operationName,
      spanCount: o._count,
    }));
  }

  /**
   * Get trace duration statistics
   */
  async getTraceStats(traceId: string) {
    const spans = await this.prisma.trace.findMany({
      where: { traceId },
    });

    if (spans.length === 0) return null;

    const durations = spans.map(s => s.duration);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      traceId,
      spanCount: spans.length,
      minDuration: min,
      maxDuration: max,
      avgDuration: avg,
    };
  }

  /**
   * Determine if a trace should be sampled
   */
  shouldSample(): boolean {
    return Math.random() < this.samplingRate;
  }

  /**
   * Set sampling rate
   */
  setSamplingRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Sampling rate must be between 0 and 1');
    }
    this.samplingRate = rate;
  }

  /**
   * Generate trace context for propagation
   */
  generateTraceContext(): { traceId: string; spanId: string } {
    return {
      traceId: uuidv4().replace(/-/g, ''),
      spanId: uuidv4().replace(/-/g, '').substring(0, 16),
    };
  }

  /**
   * Cleanup old traces (retention: 7 days)
   */
  async cleanupOldTraces(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const result = await this.prisma.trace.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old traces`);
    return result.count;
  }
}
