import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface AlertRule {
  id?: string;
  name: string;
  expr: string;
  for: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  isActive?: boolean;
}

export interface Alert {
  id?: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'firing' | 'pending' | 'resolved';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  firedBy: string;
  ruleId: string;
}

export interface AlertSilence {
  id?: string;
  matchers: Array<{ name: string; value: string; isEqual: boolean }>;
  startsAt: Date;
  endsAt: Date;
  createdBy: string;
  comment?: string;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly alertThresholds = {
    critical: 0.95, // 95% threshold
    warning: 0.85,  // 85% threshold
    info: 0.75,    // 75% threshold
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an alert rule
   */
  async createAlertRule(rule: AlertRule): Promise<string> {
    const id = uuidv4();

    await this.prisma.alertRule.create({
      data: {
        id,
        name: rule.name,
        expr: rule.expr,
        for: rule.for,
        labels: rule.labels as any,
        annotations: rule.annotations as any,
        isActive: rule.isActive ?? true,
      },
    });

    this.logger.log(`Created alert rule: ${rule.name}`);
    return id;
  }

  /**
   * Get all alert rules
   */
  async getAlertRules(): Promise<any[]> {
    return this.prisma.alertRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update an alert rule
   */
  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<void> {
    await this.prisma.alertRule.update({
      where: { id },
      data: {
        ...updates,
        labels: updates.labels as any,
        annotations: updates.annotations as any,
      },
    });
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(id: string): Promise<void> {
    await this.prisma.alertRule.delete({
      where: { id },
    });
  }

  /**
   * Create an alert
   */
  async createAlert(alert: Alert): Promise<string> {
    const id = uuidv4();

    await this.prisma.alert.create({
      data: {
        id,
        name: alert.name,
        severity: alert.severity,
        status: alert.status,
        labels: alert.labels as any,
        annotations: alert.annotations as any,
        startsAt: alert.startsAt,
        endsAt: alert.endsAt,
        firedBy: alert.firedBy,
        ruleId: alert.ruleId,
      },
    });

    this.logger.log(`Alert created: ${alert.name} (${alert.severity})`);
    return id;
  }

  /**
   * Get all alerts with optional filters
   */
  async getAlerts(params: {
    status?: string;
    severity?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: any[]; total: number }> {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.severity) {
      where.severity = params.severity;
    }

    if (params.startTime || params.endTime) {
      where.startsAt = {};
      if (params.startTime) {
        where.startsAt.gte = params.startTime;
      }
      if (params.endTime) {
        where.startsAt.lte = params.endTime;
      }
    }

    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        take: params.limit || 100,
        skip: params.offset || 0,
        orderBy: { startsAt: 'desc' },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return { alerts, total };
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        endsAt: new Date(),
      },
    });
  }

  /**
   * Create an alert silence
   */
  async createSilence(silence: AlertSilence): Promise<string> {
    const id = uuidv4();

    await this.prisma.alertSilence.create({
      data: {
        id,
        matchers: silence.matchers as any,
        startsAt: silence.startsAt,
        endsAt: silence.endsAt,
        createdBy: silence.createdBy,
        comment: silence.comment,
      },
    });

    this.logger.log(`Alert silence created by ${silence.createdBy}`);
    return id;
  }

  /**
   * Check if an alert is silenced
   */
  async isSilenced(labels: Record<string, string>): Promise<boolean> {
    const silences = await this.prisma.alertSilence.findMany({
      where: {
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });

    for (const silence of silences) {
      const matchers = silence.matchers as Array<{ name: string; value: string; isEqual: boolean }>;
      
      let allMatch = true;
      for (const matcher of matchers) {
        const labelValue = labels[matcher.name];
        if (matcher.isEqual) {
          if (labelValue !== matcher.value) {
            allMatch = false;
            break;
          }
        } else {
          if (!labelValue?.includes(matcher.value)) {
            allMatch = false;
            break;
          }
        }
      }

      if (allMatch) return true;
    }

    return false;
  }

  /**
   * Evaluate an alert rule and fire alerts if necessary
   */
  async evaluateRule(ruleId: string): Promise<Alert[]> {
    const rule = await this.prisma.alertRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || !rule.isActive) {
      return [];
    }

    // In a real implementation, this would execute the PromQL expression
    // against Prometheus and check the result
    const isFiring = await this.checkRuleExpression(rule.expr);

    const firedAlerts: Alert[] = [];

    if (isFiring) {
      const alert = await this.createAlert({
        name: rule.name,
        severity: (rule.labels as any).severity || 'warning',
        status: 'firing',
        labels: rule.labels as Record<string, string>,
        annotations: rule.annotations as Record<string, string>,
        startsAt: new Date(),
        firedBy: 'system',
        ruleId: rule.id!,
      });

      firedAlerts.push(alert);
    }

    return firedAlerts;
  }

  /**
   * Check if a rule expression is firing (simplified)
   */
  private async checkRuleExpression(expr: string): Promise<boolean> {
    // In production, this would query Prometheus
    // For now, return a simplified check
    return false;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    total: number;
    firing: number;
    pending: number;
    resolved: number;
    bySeverity: Record<string, number>;
  }> {
    const [total, firing, pending, resolved] = await Promise.all([
      this.prisma.alert.count(),
      this.prisma.alert.count({ where: { status: 'firing' } }),
      this.prisma.alert.count({ where: { status: 'pending' } }),
      this.prisma.alert.count({ where: { status: 'resolved' } }),
    ]);

    const critical = await this.prisma.alert.count({ where: { severity: 'critical' } });
    const warning = await this.prisma.alert.count({ where: { severity: 'warning' } });
    const info = await this.prisma.alert.count({ where: { severity: 'info' } });

    return {
      total,
      firing,
      pending,
      resolved,
      bySeverity: { critical, warning, info },
    };
  }

  /**
   * Clean up old alerts
   */
  async cleanupOldAlerts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);

    const result = await this.prisma.alert.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'resolved',
      },
    });

    this.logger.log(`Cleaned up ${result.count} old alerts`);
    return result.count;
  }
}
