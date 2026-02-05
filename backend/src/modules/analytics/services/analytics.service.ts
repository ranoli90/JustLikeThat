import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from './clickhouse.service';
import { KafkaService } from '../kafka/kafka.service';
import {
  AnalyticsEvent,
  DashboardConfig,
  MetricData,
  WidgetType,
} from '../interfaces/analytics.interface';
import { v4 as uuidv4 } from 'uuid';
import { RateLimitConstants, TimeConstants } from '../../common/constants';

/**
 * Analytics service for tracking events, managing dashboards, and recording metrics
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly eventBuffer: AnalyticsEvent[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouse: ClickHouseService,
    private readonly kafka: KafkaService,
  ) {
    // Start buffer flush interval
    setInterval(() => this.flushEventBuffer(), TimeConstants.BUFFER_FLUSH_INTERVAL_MS);
  }

  /**
   * Tracks an analytics event and adds it to the processing buffer
   * @param event - The event data to track (without id and timestamp)
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(analyticsEvent);

    // Flush if buffer is full
    if (this.eventBuffer.length >= RateLimitConstants.BUFFER_MAX_SIZE) {
      await this.flushEventBuffer();
    }

    // Also publish to Kafka for real-time processing
    try {
      await this.kafka.produce('analytics-events', {
        key: event.userId || event.sessionId || uuidv4(),
        value: JSON.stringify(analyticsEvent),
      });
    } catch (error) {
      this.logger.warn('Failed to publish event to Kafka', error);
    }
  }

  async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer.length = 0;

    try {
      // Store in ClickHouse for analytics queries
      await this.clickhouse.insertEvent(
        events.map((e) => ({
          eventType: e.eventType,
          userId: e.userId || undefined,
          sessionId: e.sessionId || undefined,
          properties: e.properties,
          processedAt: e.processedAt || undefined,
        })),
      );

      // Also store in PostgreSQL for long-term persistence
      await this.prisma.analyticsEvent.createMany({
        data: events.map((e) => ({
          eventType: e.eventType,
          userId: e.userId,
          sessionId: e.sessionId,
          properties: e.properties as any,
          processedAt: e.processedAt,
        })),
      });

      this.logger.debug(`Flushed ${events.length} events to storage`);
    } catch (error) {
      this.logger.error('Failed to flush event buffer', error);
      // Re-add events to buffer on failure
      this.eventBuffer.push(...events);
    }
  }

  async getEvent(eventId: string): Promise<AnalyticsEvent | null> {
    const event = await this.prisma.analyticsEvent.findUnique({
      where: { id: eventId },
    });
    return event ? this.mapPrismaEventToAnalyticsEvent(event) : null;
  }

  async getEvents(
    filters: {
      eventType?: string;
      userId?: string;
      sessionId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: { page: number; limit: number },
  ): Promise<{ events: AnalyticsEvent[]; total: number }> {
    const where: any = {};

    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return {
      events: events.map((e) => this.mapPrismaEventToAnalyticsEvent(e)),
      total,
    };
  }

  async getEventCount(
    eventType?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    return this.clickhouse.getEventCount(eventType, startDate, endDate);
  }

  // Dashboard Management
  async createDashboard(
    userId: string,
    config: Omit<DashboardConfig, 'id' | 'userId'>,
  ): Promise<DashboardConfig> {
    const dashboard = await this.prisma.dashboard.create({
      data: {
        userId,
        name: config.name,
        description: config.description,
        layout: config.layout as any,
        widgets: config.widgets as any,
        filters: config.filters as any,
        isPublic: config.isPublic || false,
        shareToken: config.isPublic ? uuidv4() : null,
      },
    });

    return this.mapPrismaDashboardToConfig(dashboard);
  }

  async getDashboard(dashboardId: string): Promise<DashboardConfig> {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard ${dashboardId} not found`);
    }

    return this.mapPrismaDashboardToConfig(dashboard);
  }

  async getDashboards(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ dashboards: DashboardConfig[]; total: number }> {
    const [dashboards, total] = await Promise.all([
      this.prisma.dashboard.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.dashboard.count({ where: { userId } }),
    ]);

    return {
      dashboards: dashboards.map((d) => this.mapPrismaDashboardToConfig(d)),
      total,
    };
  }

  async updateDashboard(
    dashboardId: string,
    userId: string,
    updates: Partial<DashboardConfig>,
  ): Promise<DashboardConfig> {
    const dashboard = await this.prisma.dashboard.update({
      where: { id: dashboardId, userId },
      data: {
        name: updates.name,
        description: updates.description,
        layout: updates.layout as any,
        widgets: updates.widgets as any,
        filters: updates.filters as any,
        isPublic: updates.isPublic,
        shareToken:
          updates.isPublic && !updates.shareToken ? uuidv4() : updates.shareToken,
      },
    });

    return this.mapPrismaDashboardToConfig(dashboard);
  }

  async deleteDashboard(dashboardId: string, userId: string): Promise<void> {
    await this.prisma.dashboard.delete({
      where: { id: dashboardId, userId },
    });
  }

  async getPublicDashboard(shareToken: string): Promise<DashboardConfig> {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { shareToken, isPublic: true },
    });

    if (!dashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    return this.mapPrismaDashboardToConfig(dashboard);
  }

  // Metrics
  async recordMetric(metric: Omit<MetricData, 'id' | 'timestamp'>): Promise<void> {
    await this.clickhouse.insertMetric({
      name: metric.name,
      type: metric.type,
      value: metric.value,
      dimensions: metric.dimensions,
    });

    await this.prisma.metric.create({
      data: {
        name: metric.name,
        type: metric.type,
        value: metric.value,
        dimensions: metric.dimensions as any,
      },
    });
  }

  async getMetrics(
    name: string,
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, unknown>[]> {
    return this.clickhouse.getAggregatedMetrics(
      name,
      granularity,
      startDate,
      endDate,
    );
  }

  // Widget Templates
  async getWidgetTemplates(): Promise<any[]> {
    const templates = await this.prisma.widgetTemplate.findMany({
      where: { isPublic: true },
      orderBy: { category: 'asc' },
    });
    return templates;
  }

  async createWidgetTemplate(
    userId: string,
    template: {
      name: string;
      description?: string;
      type: WidgetType;
      category: string;
      config: Record<string, unknown>;
      preview?: string;
    },
  ): Promise<any> {
    return this.prisma.widgetTemplate.create({
      data: {
        ...template,
        userId,
      },
    });
  }

  // Helper methods
  private mapPrismaEventToAnalyticsEvent(
    event: any,
  ): AnalyticsEvent {
    return {
      id: event.id,
      eventType: event.eventType,
      userId: event.userId,
      sessionId: event.sessionId,
      properties: event.properties,
      timestamp: event.timestamp,
      processedAt: event.processedAt,
    };
  }

  private mapPrismaDashboardToConfig(
    dashboard: any,
  ): DashboardConfig {
    return {
      id: dashboard.id,
      userId: dashboard.userId,
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      filters: dashboard.filters,
      isPublic: dashboard.isPublic,
      shareToken: dashboard.shareToken,
    };
  }
}
