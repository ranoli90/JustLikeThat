import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogQuery {
  userId?: string;
  tenantId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  riskLevel?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    tenantId: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress: string;
    userAgent?: string;
    details?: Record<string, any>;
    riskLevel?: string;
  }): Promise<any> {
    const log = await this.prisma.securityAuditLog.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details || {},
        riskLevel: data.riskLevel || 'low',
      },
    });

    return log;
  }

  async getAuditLogs(query: AuditLogQuery): Promise<{ logs: any[]; total: number }> {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.resource) where.resource = query.resource;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.riskLevel) where.riskLevel = query.riskLevel;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getAuditLog(id: string): Promise<any> {
    return this.prisma.securityAuditLog.findUnique({ where: { id } });
  }

  async exportAuditLogs(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ data: any[]; exportedAt: string }> {
    const logs = await this.prisma.securityAuditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: logs,
      exportedAt: new Date().toISOString(),
    };
  }

  async getAuditStatistics(
    tenantId: string,
    days: number = 30,
  ): Promise<{
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byRiskLevel: Record<string, number>;
    trend: { date: string; count: number }[];
    topUsers: { userId: string; count: number }[];
    totalLogs: number;
  }> {
    const startDate = new Date(Date.now() - days * 86400000);

    const logs = await this.prisma.securityAuditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
    });

    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    logs.forEach((log) => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
      byRiskLevel[log.riskLevel] = (byRiskLevel[log.riskLevel] || 0) + 1;

      const day = log.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate trend data
    const trend: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      trend.push({ date: dateStr, count: byDay[dateStr] || 0 });
    }

    return {
      byAction,
      byResource,
      byRiskLevel,
      trend,
      topUsers,
      totalLogs: logs.length,
    };
  }

  async searchAuditLogs(
    tenantId: string,
    searchParams: {
      query?: string;
      filters?: Record<string, any>;
      dateRange?: { start: string; end: string };
    },
  ): Promise<{ logs: any[]; total: number }> {
    const where: any = { tenantId };

    if (searchParams.query) {
      where.OR = [
        { action: { contains: searchParams.query, mode: 'insensitive' } },
        { resource: { contains: searchParams.query, mode: 'insensitive' } },
        { resourceId: { contains: searchParams.query, mode: 'insensitive' } },
        { ipAddress: { contains: searchParams.query } },
      ];
    }

    if (searchParams.filters) {
      Object.assign(where, searchParams.filters);
    }

    if (searchParams.dateRange) {
      where.createdAt = {
        gte: new Date(searchParams.dateRange.start),
        lte: new Date(searchParams.dateRange.end),
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getHighRiskLogs(
    tenantId: string,
    limit: number = 100,
  ): Promise<any[]> {
    return this.prisma.securityAuditLog.findMany({
      where: {
        tenantId,
        riskLevel: { in: ['high', 'critical'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
