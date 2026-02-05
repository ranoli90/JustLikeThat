import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private client: ClickHouseClient;
  private readonly logger = new Logger(ClickHouseService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const password = this.configService.get<string>('CLICKHOUSE_PASSWORD');
    if (!password) {
      throw new Error('CLICKHOUSE_PASSWORD environment variable is required');
    }
    
    this.client = createClient({
      host: this.configService.get('CLICKHOUSE_HOST', 'http://localhost:8123'),
      username: this.configService.get('CLICKHOUSE_USER', 'admin'),
      password,
      database: this.configService.get('CLICKHOUSE_DATABASE', 'analytics'),
      request_timeout: 30000,
      max_open_connections: 100,
      compression: true,
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('ClickHouse connected successfully');
      await this.initializeDatabase();
    } catch (error) {
      this.logger.error('Failed to connect to ClickHouse', error);
      // Continue without throwing - analytics can work with reduced functionality
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('ClickHouse connection closed');
    }
  }

  private async initializeDatabase() {
    // Create analytics database and tables if they don't exist
    const createDatabaseQuery = `
      CREATE DATABASE IF NOT EXISTS analytics ON CLUSTER default
    `;
    
    const createEventsTableQuery = `
      CREATE TABLE IF NOT EXISTS analytics.events ON CLUSTER default (
        id UUID DEFAULT generateUUIDv4(),
        eventType String,
        userId String,
        sessionId String,
        properties String,
        timestamp DateTime64(3) DEFAULT now64(3),
        processedAt DateTime64(3),
        _date Date DEFAULT today()
      ) ENGINE = ReplacingMergeTree(timestamp)
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (eventType, userId, sessionId, timestamp)
      TTL _date + INTERVAL 2 YEAR
      SETTINGS index_granularity = 8192
    `;

    const createSessionsTableQuery = `
      CREATE TABLE IF NOT EXISTS analytics.sessions ON CLUSTER default (
        id UUID DEFAULT generateUUIDv4(),
        userId String,
        sessionKey String,
        deviceInfo String,
        browserInfo String,
        ipAddress String,
        location String,
        startedAt DateTime64(3) DEFAULT now64(3),
        endedAt DateTime64(3),
        duration Int64,
        pageCount Int32 DEFAULT 0,
        _date Date DEFAULT today()
      ) ENGINE = ReplacingMergeTree(startedAt)
      PARTITION BY toYYYYMM(startedAt)
      ORDER BY (sessionKey, userId, startedAt)
      TTL _date + INTERVAL 2 YEAR
      SETTINGS index_granularity = 8192
    `;

    const createSessionEventsTableQuery = `
      CREATE TABLE IF NOT EXISTS analytics.session_events ON CLUSTER default (
        id UUID DEFAULT generateUUIDv4(),
        sessionId String,
        eventType String,
        elementId String,
        elementType String,
        pageUrl String,
        x Float64,
        y Float64,
        metadata String,
        timestamp DateTime64(3) DEFAULT now64(3),
        _date Date DEFAULT today()
      ) ENGINE = ReplacingMergeTree(timestamp)
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (sessionId, eventType, timestamp)
      TTL _date + INTERVAL 1 YEAR
      SETTINGS index_granularity = 8192
    `;

    const createMetricsTableQuery = `
      CREATE TABLE IF NOT EXISTS analytics.metrics ON CLUSTER default (
        id UUID DEFAULT generateUUIDv4(),
        name String,
        type String,
        value Float64,
        dimensions String,
        timestamp DateTime64(3) DEFAULT now64(3),
        _date Date DEFAULT today()
      ) ENGINE = ReplacingMergeTree(timestamp)
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (name, timestamp)
      TTL _date + INTERVAL 1 YEAR
      SETTINGS index_granularity = 8192
    `;

    const createAggregationsTableQuery = `
      CREATE TABLE IF NOT EXISTS analytics.aggregations ON CLUSTER default (
        name String,
        dimensions String,
        value Float64,
        timestamp DateTime64(3) DEFAULT now64(3),
        granularity String
      ) ENGINE = SummingMergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (name, dimensions, timestamp, granularity)
      SETTINGS index_granularity = 8192
    `;

    try {
      await this.client.command({ query: createDatabaseQuery });
      await this.client.command({ query: createEventsTableQuery });
      await this.client.command({ query: createSessionsTableQuery });
      await this.client.command({ query: createSessionEventsTableQuery });
      await this.client.command({ query: createMetricsTableQuery });
      await this.client.command({ query: createAggregationsTableQuery });
      
      this.logger.log('ClickHouse database and tables initialized');
    } catch (error) {
      this.logger.error('Failed to initialize ClickHouse database', error);
    }
  }

  async query<T = unknown>(query: string, params?: Record<string, unknown>): Promise<T[]> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse not connected, query skipped');
      return [];
    }

    try {
      const result = await this.client.query({
        query,
        query_params: params,
        format: 'JSONEachRow',
      });
      return result.json<T[]>();
    } catch (error) {
      this.logger.error(`Query failed: ${query}`, error);
      throw error;
    }
  }

  async insert(table: string, values: Record<string, unknown>[]): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('ClickHouse not connected, insert skipped');
      return;
    }

    try {
      await this.client.insert({
        table: `analytics.${table}`,
        values,
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Insert failed for table: ${table}`, error);
      throw error;
    }
  }

  async insertEvent(event: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    properties: Record<string, unknown>;
    processedAt?: Date;
  }): Promise<void> {
    await this.insert('events', [{
      eventType: event.eventType,
      userId: event.userId || null,
      sessionId: event.sessionId || null,
      properties: JSON.stringify(event.properties),
      processedAt: event.processedAt || null,
    }]);
  }

  async insertSession(session: {
    userId?: string;
    sessionKey: string;
    deviceInfo?: Record<string, unknown>;
    browserInfo?: Record<string, unknown>;
    ipAddress?: string;
    location?: Record<string, unknown>;
    duration?: number;
    pageCount?: number;
  }): Promise<void> {
    await this.insert('sessions', [{
      userId: session.userId || null,
      sessionKey: session.sessionKey,
      deviceInfo: session.deviceInfo ? JSON.stringify(session.deviceInfo) : null,
      browserInfo: session.browserInfo ? JSON.stringify(session.browserInfo) : null,
      ipAddress: session.ipAddress || null,
      location: session.location ? JSON.stringify(session.location) : null,
      duration: session.duration || null,
      pageCount: session.pageCount || 0,
    }]);
  }

  async insertSessionEvent(event: {
    sessionId: string;
    eventType: string;
    elementId?: string;
    elementType?: string;
    pageUrl?: string;
    x?: number;
    y?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.insert('session_events', [{
      sessionId: event.sessionId,
      eventType: event.eventType,
      elementId: event.elementId || null,
      elementType: event.elementType || null,
      pageUrl: event.pageUrl || null,
      x: event.x || null,
      y: event.y || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    }]);
  }

  async insertMetric(metric: {
    name: string;
    type: string;
    value: number;
    dimensions?: Record<string, string>;
  }): Promise<void> {
    await this.insert('metrics', [{
      name: metric.name,
      type: metric.type,
      value: metric.value,
      dimensions: metric.dimensions ? JSON.stringify(metric.dimensions) : null,
    }]);
  }

  async getEventCount(
    eventType?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let query = 'SELECT count() as count FROM analytics.events WHERE 1=1';
    const params: Record<string, unknown> = {};

    if (eventType) {
      query += ' AND eventType = {eventType:String}';
      params.eventType = eventType;
    }

    if (startDate) {
      query += ' AND timestamp >= {startDate:DateTime64(3)}';
      params.startDate = startDate;
    }

    if (endDate) {
      query += ' AND timestamp <= {endDate:DateTime64(3)}';
      params.endDate = endDate;
    }

    const result = await this.query<{ count: number }>(query, params);
    return result[0]?.count || 0;
  }

  async getEventsByUser(
    userId: string,
    limit = 100,
    offset = 0,
  ): Promise<Record<string, unknown>[]> {
    const query = `
      SELECT * FROM analytics.events
      WHERE userId = {userId:String}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;
    return this.query(query, { userId, limit, offset });
  }

  async getEventsBySession(
    sessionId: string,
    limit = 100,
    offset = 0,
  ): Promise<Record<string, unknown>[]> {
    const query = `
      SELECT * FROM analytics.session_events
      WHERE sessionId = {sessionId:String}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;
    return this.query(query, { sessionId, limit, offset });
  }

  async getAggregatedMetrics(
    metricName: string,
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, unknown>[]> {
    const dateTrunc = this.getDateTruncFunction(granularity);
    
    const query = `
      SELECT 
        ${dateTrunc}(timestamp) as period,
        count() as count,
        avg(value) as avg_value,
        sum(value) as sum_value
      FROM analytics.metrics
      WHERE name = {name:String}
        AND timestamp >= {startDate:DateTime64(3)}
        AND timestamp <= {endDate:DateTime(3)}
      GROUP BY period
      ORDER BY period
    `;

    return this.query(query, {
      name: metricName,
      startDate,
      endDate,
    });
  }

  private getDateTruncFunction(granularity: string): string {
    switch (granularity) {
      case 'minute': return 'toStartOfMinute';
      case 'hour': return 'toStartOfHour';
      case 'day': return 'toStartOfDay';
      case 'week': return 'toStartOfWeek';
      case 'month': return 'toStartOfMonth';
      default: return 'toStartOfDay';
    }
  }

  async getRetentionData(
    cohortType: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, unknown>[]> {
    const dateTrunc = this.getDateTruncFunction(cohortType);

    const query = `
      SELECT 
        ${dateTrunc}(timestamp) as cohort_date,
        toDayOfWeek(timestamp) as day_of_week,
        uniqExact(userId) as users,
        countIf(eventType = 'page_view') as page_views,
        countIf(eventType = 'signup') as signups
      FROM analytics.events
      WHERE timestamp >= {startDate:DateTime64(3)}
        AND timestamp <= {endDate:DateTime64(3)}
      GROUP BY cohort_date, day_of_week
      ORDER BY cohort_date
    `;

    return this.query(query, { startDate, endDate });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
