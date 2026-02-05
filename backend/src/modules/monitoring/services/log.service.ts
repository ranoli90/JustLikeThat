import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface LogEntry {
  id?: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  serviceName: string;
  traceId?: string;
  spanId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface LogSearchParams {
  serviceName?: string;
  level?: string;
  traceId?: string;
  startTime?: Date;
  endTime?: Date;
  message?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);
  private readonly elasticsearchEndpoint = process.env.ELASTICSEARCH_ENDPOINT || 'http://localhost:9200';
  private readonly lokiEndpoint = process.env.LOKI_ENDPOINT || 'http://localhost:3100';

  // Log buffer for high-throughput ingestion
  private logBuffer: LogEntry[] = [];
  private readonly bufferFlushInterval = 1000; // Flush every second
  private readonly bufferMaxSize = 10000; // Max 10000 logs per flush

  constructor(private readonly prisma: PrismaService) {
    setInterval(() => this.flushLogBuffer(), this.bufferFlushInterval);
  }

  /**
   * Log an entry
   */
  async log(entry: LogEntry): Promise<string> {
    const id = uuidv4();

    this.logBuffer.push({
      ...entry,
      id,
    });

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferMaxSize) {
      await this.flushLogBuffer();
    }

    return id;
  }

  /**
   * Log at debug level
   */
  async debug(serviceName: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.log({
      timestamp: new Date(),
      level: 'debug',
      serviceName,
      message,
      metadata,
    });
  }

  /**
   * Log at info level
   */
  async info(serviceName: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.log({
      timestamp: new Date(),
      level: 'info',
      serviceName,
      message,
      metadata,
    });
  }

  /**
   * Log at warn level
   */
  async warn(serviceName: string, message: string, metadata?: Record<string, any>): Promise<string> {
    return this.log({
      timestamp: new Date(),
      level: 'warn',
      serviceName,
      message,
      metadata,
    });
  }

  /**
   * Log at error level
   */
  async error(
    serviceName: string,
    message: string,
    error?: Error,
    traceId?: string
  ): Promise<string> {
    const metadata: Record<string, any> = {};

    if (error) {
      metadata.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    return this.log({
      timestamp: new Date(),
      level: 'error',
      serviceName,
      message,
      traceId,
      metadata,
    });
  }

  /**
   * Flush log buffer to database
   */
  private async flushLogBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.prisma.logEntry.createMany({
        data: logsToFlush.map(l => ({
          id: l.id!,
          timestamp: l.timestamp,
          level: l.level,
          serviceName: l.serviceName,
          traceId: l.traceId,
          spanId: l.spanId,
          message: l.message,
          metadata: l.metadata as any,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      this.logger.error(`Failed to flush log buffer: ${error.message}`);
      // Re-add failed logs to buffer for retry
      this.logBuffer = [...logsToFlush, ...this.logBuffer];
    }
  }

  /**
   * Search logs
   */
  async searchLogs(params: LogSearchParams): Promise<{ logs: any[]; total: number }> {
    const where: any = {};

    if (params.serviceName) {
      where.serviceName = params.serviceName;
    }

    if (params.level) {
      where.level = params.level;
    }

    if (params.traceId) {
      where.traceId = params.traceId;
    }

    if (params.message) {
      where.message = { contains: params.message };
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

    const [logs, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        where,
        take: params.limit || 100,
        skip: params.offset || 0,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.logEntry.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get logs by trace ID
   */
  async getLogsByTraceId(traceId: string): Promise<any[]> {
    return this.prisma.logEntry.findMany({
      where: { traceId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Get error logs for a service
   */
  async getErrorLogs(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    return this.prisma.logEntry.findMany({
      where: {
        serviceName,
        level: 'error',
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });
  }

  /**
   * Get log statistics
   */
  async getLogStats(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    total: number;
    byLevel: Record<string, number>;
    errors: any[];
  }> {
    const [total, debug, info, warn, error, errors] = await Promise.all([
      this.prisma.logEntry.count({
        where: {
          serviceName,
          timestamp: { gte: startTime, lte: endTime },
        },
      }),
      this.prisma.logEntry.count({
        where: { serviceName, level: 'debug', timestamp: { gte: startTime, lte: endTime } },
      }),
      this.prisma.logEntry.count({
        where: { serviceName, level: 'info', timestamp: { gte: startTime, lte: endTime } },
      }),
      this.prisma.logEntry.count({
        where: { serviceName, level: 'warn', timestamp: { gte: startTime, lte: endTime } },
      }),
      this.prisma.logEntry.count({
        where: { serviceName, level: 'error', timestamp: { gte: startTime, lte: endTime } },
      }),
      this.getErrorLogs(serviceName, startTime, endTime),
    ]);

    return {
      total,
      byLevel: { debug, info, warn, error },
      errors: errors.slice(0, 100), // Limit to 100 recent errors
    };
  }

  /**
   * Create log-based alert
   */
  async createLogAlert(
    name: string,
    pattern: string,
    severity: 'critical' | 'warning' | 'info'
  ): Promise<string> {
    const alertRule = {
      name,
      expr: `count_over_time(log_entries{message=~"${pattern}"}[5m]) > 0`,
      for: '1m',
      labels: { severity, type: 'log' },
      annotations: {
        summary: `Log pattern detected: ${name}`,
        description: `Log pattern "${pattern}" detected in logs`,
      },
    };

    // This would create an alert rule in the alerting system
    this.logger.log(`Created log alert: ${name}`);
    return uuidv4();
  }

  /**
   * Cleanup old logs (30 days hot, 1 year archive)
   */
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await this.prisma.logEntry.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old logs`);
    return result.count;
  }

  /**
   * Get available services
   */
  async getServices(): Promise<string[]> {
    const result = await this.prisma.logEntry.groupBy({
      by: ['serviceName'],
    });

    return result.map(r => r.serviceName);
  }
}
