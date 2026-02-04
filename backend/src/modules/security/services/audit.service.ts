import { Injectable } from '@nestjs/common';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private auditLogs: AuditLog[] = [];

  async log(data: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
    };

    this.auditLogs.push(log);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    return log;
  }

  async getAuditLogs(query: AuditQuery): Promise<{ logs: AuditLog[]; total: number }> {
    let filtered = [...this.auditLogs];

    if (query.userId) {
      filtered = filtered.filter((log) => log.userId === query.userId);
    }

    if (query.action) {
      const actionFilter = query.action;
      filtered = filtered.filter((log) => log.action && log.action.includes(actionFilter));
    }

    if (query.resourceType) {
      filtered = filtered.filter((log) => log.resourceType === query.resourceType);
    }

    if (query.startDate) {
      const start = new Date(query.startDate);
      filtered = filtered.filter((log) => log.timestamp >= start);
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      filtered = filtered.filter((log) => log.timestamp <= end);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filtered.length;

    const offset = query.offset || 0;
    const limit = query.limit || 100;

    filtered = filtered.slice(offset, offset + limit);

    return { logs: filtered, total };
  }

  async getAuditLog(id: string): Promise<AuditLog | null> {
    return this.auditLogs.find((log) => log.id === id) || null;
  }

  async exportAuditLogs(startDate: string, endDate: string): Promise<{ data: AuditLog[]; exportedAt: string }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = this.auditLogs.filter(
      (log) => log.timestamp >= start && log.timestamp <= end,
    );

    return {
      data: filtered,
      exportedAt: new Date().toISOString(),
    };
  }

  async getAuditStatistics(): Promise<{
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    byDay: { date: string; count: number }[];
    topUsers: { userId: string; count: number }[];
  }> {
    const byAction: Record<string, number> = {};
    const byResourceType: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    this.auditLogs.forEach((log) => {
      // By action
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      // By resource type
      byResourceType[log.resourceType] = (byResourceType[log.resourceType] || 0) + 1;

      // By day
      const day = log.timestamp.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;

      // By user
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({ date: dateStr, count: byDay[dateStr] || 0 });
    }

    return {
      byAction,
      byResourceType,
      byDay: last7Days,
      topUsers,
    };
  }
}
