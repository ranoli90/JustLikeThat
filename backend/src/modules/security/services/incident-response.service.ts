import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  affectedUsers: number;
  affectedSystems: string[];
  timeline: any[];
  rootCause?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

@Injectable()
export class IncidentResponseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getIncidents(
    tenantId: string,
    filters?: {
      status?: string;
      severity?: string;
      category?: string;
    },
  ): Promise<any[]> {
    const where: any = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.category) where.category = filters.category;

    return this.prisma.securityIncident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getIncident(id: string): Promise<any> {
    return this.prisma.securityIncident.findUnique({ where: { id } });
  }

  async reportIncident(
    tenantId: string,
    data: {
      title: string;
      description: string;
      severity: string;
      category: string;
      affectedUsers?: number;
      affectedSystems?: string[];
      reportedBy?: string;
      ipAddress?: string;
    },
  ): Promise<any> {
    const incident = await this.prisma.securityIncident.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: 'open',
        category: data.category,
        affectedUsers: data.affectedUsers || 0,
        affectedSystems: data.affectedSystems || [],
        timeline: [
          {
            timestamp: new Date().toISOString(),
            action: 'Incident reported',
            performedBy: data.reportedBy || 'system',
          },
        ],
      },
    });

    await this.auditService.log({
      tenantId,
      userId: data.reportedBy,
      action: 'INCIDENT_REPORTED',
      resource: 'security_incident',
      resourceId: incident.id,
      ipAddress: data.ipAddress || '127.0.0.1',
      details: {
        title: data.title,
        severity: data.severity,
        category: data.category,
      },
      riskLevel: data.severity,
    });

    return incident;
  }

  async updateIncident(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      severity: string;
      status: string;
      affectedUsers: number;
      affectedSystems: string[];
      rootCause: string;
      resolution: string;
    }>,
  ): Promise<any> {
    return this.prisma.securityIncident.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateIncidentStatus(
    id: string,
    status: string,
    performedBy?: string,
    notes?: string,
  ): Promise<any> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      timeline: {
        push: [
          {
            timestamp: new Date().toISOString(),
            action: `Status changed to ${status}`,
            performedBy: performedBy || 'system',
            notes: notes,
          },
        ],
      },
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = performedBy;
    }

    return this.prisma.securityIncident.update({
      where: { id },
      data: updateData,
    });
  }

  async addTimelineEntry(
    id: string,
    entry: {
      action: string;
      performedBy?: string;
      notes?: string;
    },
  ): Promise<any> {
    return this.prisma.securityIncident.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        timeline: {
          push: [
            {
              timestamp: new Date().toISOString(),
              ...entry,
            },
          ],
        },
      },
    });
  }

  async resolveIncident(
    id: string,
    resolution: string,
    rootCause: string,
    resolvedBy?: string,
  ): Promise<any> {
    const incident = await this.updateIncidentStatus(
      id,
      'resolved',
      resolvedBy,
      resolution,
    );

    await this.updateIncident(id, {
      resolution,
      rootCause,
    });

    return incident;
  }

  async getOpenIncidentsCount(tenantId: string): Promise<number> {
    return this.prisma.securityIncident.count({
      where: {
        tenantId,
        status: { in: ['open', 'investigating', 'contained'] },
      },
    });
  }

  async getIncidentStatistics(
    tenantId: string,
    days: number = 30,
  ): Promise<{
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    averageResolutionTime: number;
    incidentsLast30Days: number;
    mttr: number;
    criticalIncidents: number;
  }> {
    const startDate = new Date(Date.now() - days * 86400000);

    const incidents = await this.prisma.securityIncident.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
    });

    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    incidents.forEach((incident) => {
      bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
      byStatus[incident.status] = (byStatus[incident.status] || 0) + 1;
      byCategory[incident.category] = (byCategory[incident.category] || 0) + 1;
    });

    // Calculate MTTR (Mean Time To Resolution)
    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
    let mttr = 0;

    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, i) => {
        return sum + (i.resolvedAt!.getTime() - i.createdAt.getTime());
      }, 0);
      mttr = totalResolutionTime / resolvedIncidents.length / (1000 * 60 * 60); // hours
    }

    return {
      bySeverity,
      byStatus,
      byCategory,
      averageResolutionTime: Math.round(mttr * 10) / 10,
      incidentsLast30Days: incidents.length,
      mttr: Math.round(mttr * 10) / 10,
      criticalIncidents: incidents.filter((i) => i.severity === 'critical').length,
    };
  }

  // Automated Containment
  async autoContainIncident(
    id: string,
    actions: string[],
  ): Promise<any> {
    const incident = await this.getIncident(id);
    if (!incident) return null;

    const containmentActions: string[] = [];

    for (const action of actions) {
      switch (action) {
        case 'block_ip':
          // In production, this would call firewall API
          containmentActions.push('IP address blocked');
          break;
        case 'disable_account':
          containmentActions.push('Affected user account disabled');
          break;
        case 'isolate_system':
          containmentActions.push('Affected system isolated from network');
          break;
        case 'revoke_tokens':
          containmentActions.push('Session tokens revoked');
          break;
        case 'alert_team':
          containmentActions.push('Security team alerted');
          break;
      }
    }

    await this.addTimelineEntry(id, {
      action: 'Automated containment initiated',
      performedBy: 'system',
      notes: `Actions taken: ${containmentActions.join(', ')}`,
    });

    await this.updateIncidentStatus(id, 'contained', 'system');

    return {
      actions: containmentActions,
      status: 'contained',
    };
  }

  // Forensics Collection
  async collectForensics(
    id: string,
    scope: 'full' | 'partial' = 'full',
  ): Promise<{
    collected: string[];
    snapshotId: string;
  } | null> {
    const incident = await this.getIncident(id);
    if (!incident) return null;

    const snapshotId = `forensics-${Date.now()}`;

    const collected: string[] = [];

    if (scope === 'full' || scope === 'partial') {
      collected.push('System logs');
      collected.push('Network traffic captures');
      collected.push('Memory snapshots');
      collected.push('Disk images');
    }

    if (scope === 'full') {
      collected.push('Application logs');
      collected.push('Database audit logs');
      collected.push('Access logs');
      collected.push('Configuration files');
    }

    await this.addTimelineEntry(id, {
      action: 'Forensics collected',
      performedBy: 'system',
      notes: `Scope: ${scope}, Items: ${collected.length}, Snapshot: ${snapshotId}`,
    });

    return {
      collected,
      snapshotId,
    };
  }

  // Post-Incident Review
  async createPostIncidentReview(
    id: string,
    data: {
      summary: string;
      rootCause: string;
      lessonsLearned: string[];
      improvements: string[];
      timeline: any[];
    },
  ): Promise<any> {
    await this.addTimelineEntry(id, {
      action: 'Post-incident review completed',
      performedBy: 'security-team',
      notes: `Review completed with ${data.lessonsLearned.length} lessons learned`,
    });

    await this.updateIncident(id, {
      rootCause: data.rootCause,
    });

    return {
      incidentId: id,
      review: data,
      completedAt: new Date().toISOString(),
    };
  }

  // Escalation
  async escalateIncident(
    id: string,
    escalationLevel: string,
    reason: string,
  ): Promise<any> {
    await this.addTimelineEntry(id, {
      action: `Escalated to ${escalationLevel}`,
      performedBy: 'system',
      notes: reason,
    });

    // In production, this would trigger notifications
    return {
      escalated: true,
      level: escalationLevel,
      reason,
    };
  }

  // Get incident metrics for dashboard
  async getIncidentMetrics(tenantId: string): Promise<{
    openIncidents: number;
    criticalIncidents: number;
    mttr: number;
    incidentsThisWeek: number;
    incidentsThisMonth: number;
    resolutionRate: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const [open, critical, weekIncidents, monthIncidents, resolved] =
      await Promise.all([
        this.prisma.securityIncident.count({
          where: { tenantId, status: { in: ['open', 'investigating'] } },
        }),
        this.prisma.securityIncident.count({
          where: { tenantId, severity: 'critical', status: { not: 'resolved' } },
        }),
        this.prisma.securityIncident.count({
          where: { tenantId, createdAt: { gte: weekAgo } },
        }),
        this.prisma.securityIncident.count({
          where: { tenantId, createdAt: { gte: monthAgo } },
        }),
        this.prisma.securityIncident.count({
          where: { tenantId, status: 'resolved' },
        }),
      ]);

    const total = open + resolved;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 100;

    const stats = await this.getIncidentStatistics(tenantId);

    return {
      openIncidents: open,
      criticalIncidents: critical,
      mttr: stats.mttr,
      incidentsThisWeek: weekIncidents,
      incidentsThisMonth: monthIncidents,
      resolutionRate: Math.round(resolutionRate),
    };
  }
}
