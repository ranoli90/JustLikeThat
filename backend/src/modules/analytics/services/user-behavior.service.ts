import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from './clickhouse.service';
import { v4 as uuidv4 } from 'uuid';
import {
  Session,
  SessionEvent,
  FunnelConfig,
  FunnelStepConfig,
  FunnelConversion,
} from '../interfaces/analytics.interface';

@Injectable()
export class UserBehaviorService {
  private readonly logger = new Logger(UserBehaviorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  // Session Management
  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const created = await this.prisma.session.create({
      data: {
        userId: session.userId,
        sessionKey: session.sessionKey,
        deviceInfo: session.deviceInfo as any,
        browserInfo: session.browserInfo as any,
        ipAddress: session.ipAddress,
        location: session.location as any,
      },
    });

    // Also store in ClickHouse
    await this.clickhouse.insertSession({
      userId: session.userId,
      sessionKey: session.sessionKey,
      deviceInfo: session.deviceInfo,
      browserInfo: session.browserInfo,
      ipAddress: session.ipAddress,
      location: session.location,
    });

    return this.mapPrismaSession(created);
  }

  async getSession(sessionId: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { events: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return this.mapPrismaSession(session);
  }

  async getSessionByKey(sessionKey: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { sessionKey },
      include: { events: true },
    });

    return session ? this.mapPrismaSession(session) : null;
  }

  async endSession(sessionId: string): Promise<Session> {
    const endedAt = new Date();
    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt,
        duration: this.calculateDuration(sessionId, endedAt),
      },
    });

    return this.mapPrismaSession(session);
  }

  async incrementPageCount(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { pageCount: { increment: 1 } },
    });
  }

  private calculateDuration(sessionId: string, endedAt: Date): number {
    // This would need to be calculated properly - simplified for now
    return 0;
  }

  // Session Events
  async recordEvent(event: Omit<SessionEvent, 'id' | 'timestamp'>): Promise<SessionEvent> {
    const created = await this.prisma.sessionEvent.create({
      data: {
        sessionId: event.sessionId,
        eventType: event.eventType,
        elementId: event.elementId,
        elementType: event.elementType,
        pageUrl: event.pageUrl,
        x: event.x,
        y: event.y,
        metadata: event.metadata as any,
      },
    });

    // Also store in ClickHouse
    await this.clickhouse.insertSessionEvent({
      sessionId: event.sessionId,
      eventType: event.eventType,
      elementId: event.elementId,
      elementType: event.elementType,
      pageUrl: event.pageUrl,
      x: event.x,
      y: event.y,
      metadata: event.metadata,
    });

    return this.mapPrismaSessionEvent(created);
  }

  async getSessionEvents(
    sessionId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ events: SessionEvent[]; total: number }> {
    const [events, total] = await Promise.all([
      this.prisma.sessionEvent.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.sessionEvent.count({ where: { sessionId } }),
    ]);

    return {
      events: events.map((e) => this.mapPrismaSessionEvent(e)),
      total,
    };
  }

  async getUserSessions(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ sessions: Session[]; total: number }> {
    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.session.count({ where: { userId } }),
    ]);

    return {
      sessions: sessions.map((s) => this.mapPrismaSession(s)),
      total,
    };
  }

  // Heatmap Data
  async recordHeatmapData(data: {
    pageUrl: string;
    x: number;
    y: number;
    weight?: number;
    eventType?: string;
  }): Promise<void> {
    await this.prisma.heatmapData.create({
      data: {
        pageUrl: data.pageUrl,
        x: data.x,
        y: data.y,
        weight: data.weight || 1.0,
        eventType: data.eventType || 'click',
      },
    });
  }

  async getHeatmapData(
    pageUrl: string,
    eventType = 'click',
  ): Promise<{ x: number; y: number; weight: number }[]> {
    const data = await this.prisma.heatmapData.findMany({
      where: { pageUrl, eventType },
      select: { x: true, y: true, weight: true },
    });

    return data.map((d) => ({ x: d.x, y: d.y, weight: d.weight }));
  }

  // Funnel Analysis
  async createFunnel(userId: string, config: Omit<FunnelConfig, 'id'>): Promise<FunnelConfig> {
    const funnel = await this.prisma.funnel.create({
      data: {
        userId,
        name: config.name,
        description: config.description,
        steps: config.steps as any,
      },
    });

    // Create funnel steps
    for (const step of config.steps) {
      await this.prisma.funnelStep.create({
        data: {
          funnelId: funnel.id,
          stepOrder: step.stepOrder,
          name: step.name,
          eventType: step.eventType,
          conditions: step.conditions as any,
        },
      });
    }

    return {
      id: funnel.id,
      userId: funnel.userId,
      name: funnel.name,
      description: funnel.description || undefined,
      steps: config.steps,
    };
  }

  async getFunnels(userId: string): Promise<FunnelConfig[]> {
    const funnels = await this.prisma.funnel.findMany({
      where: { userId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    return funnels.map((f) => ({
      id: f.id,
      userId: f.userId,
      name: f.name,
      description: f.description || undefined,
      steps: f.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        name: s.name,
        eventType: s.eventType,
        conditions: s.conditions as any,
      })),
    }));
  }

  async getFunnel(funnelId: string): Promise<FunnelConfig> {
    const funnel = await this.prisma.funnel.findUnique({
      where: { id: funnelId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!funnel) {
      throw new NotFoundException(`Funnel ${funnelId} not found`);
    }

    return {
      id: funnel.id,
      userId: funnel.userId,
      name: funnel.name,
      description: funnel.description || undefined,
      steps: funnel.steps.map((s) => ({
        id: s.id,
        stepOrder: s.stepOrder,
        name: s.name,
        eventType: s.eventType,
        conditions: s.conditions as any,
      })),
    };
  }

  async recordFunnelConversion(conversion: Omit<FunnelConversion, 'id'>): Promise<FunnelConversion> {
    const record = await this.prisma.funnelConversion.create({
      data: {
        funnelId: conversion.funnelId,
        userId: conversion.userId,
        sessionId: conversion.sessionId,
        stepReached: conversion.stepReached,
        completedAt: conversion.completedAt,
        conversionTime: conversion.conpletedAt
          ? conversion.completedAt.getTime() - Date.now()
          : undefined,
      },
    });

    return {
      id: record.id,
      funnelId: record.funnelId,
      userId: record.userId || undefined,
      sessionId: record.sessionId || undefined,
      stepReached: record.stepReached,
      completedAt: record.completedAt || undefined,
      conversionTime: record.conversionTime || undefined,
    };
  }

  async getFunnelAnalytics(
    funnelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    steps: { stepOrder: number; name: string; count: number; conversionRate: number }[];
    overallConversion: number;
  }> {
    const funnel = await this.getFunnel(funnelId);
    const steps: { stepOrder: number; name: string; count: number; conversionRate: number }[] = [];

    let previousCount = 0;

    for (const step of funnel.steps) {
      const count = await this.prisma.funnelConversion.count({
        where: {
          funnelId,
          stepReached: { gte: step.stepOrder },
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;
      steps.push({
        stepOrder: step.stepOrder,
        name: step.name,
        count,
        conversionRate,
      });

      previousCount = count;
    }

    const totalStarted = await this.prisma.funnelConversion.count({
      where: {
        funnelId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const completed = await this.prisma.funnelConversion.count({
      where: {
        funnelId,
        stepReached: funnel.steps.length,
        completedAt: { not: null },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      steps,
      overallConversion: totalStarted > 0 ? (completed / totalStarted) * 100 : 0,
    };
  }

  // Helper methods
  private mapPrismaSession(session: any): Session {
    return {
      id: session.id,
      userId: session.userId,
      sessionKey: session.sessionKey,
      deviceInfo: session.deviceInfo,
      browserInfo: session.browserInfo,
      ipAddress: session.ipAddress,
      location: session.location,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      pageCount: session.pageCount,
    };
  }

  private mapPrismaSessionEvent(event: any): SessionEvent {
    return {
      id: event.id,
      sessionId: event.sessionId,
      eventType: event.eventType,
      elementId: event.elementId,
      elementType: event.elementType,
      pageUrl: event.pageUrl,
      x: event.x,
      y: event.y,
      metadata: event.metadata,
      timestamp: event.timestamp,
    };
  }
}
