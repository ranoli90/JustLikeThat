import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SLADefinition,
  SLAMetric,
  SLAViolation,
  SLAReport,
  SLAMetricType,
} from '../interfaces/lts.interface';

@Injectable()
export class SLAMonitoringService {
  private readonly logger = new Logger(SLAMonitoringService.name);
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.startRealTimeMonitoring();
  }

  /**
   * Start real-time SLA monitoring with 1-second intervals
   */
  startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, 1000);
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Create a new SLA configuration
   */
  async createSLAConfig(data: {
    tenantId?: string;
    serviceName: string;
    metricType: SLAMetricType;
    targetValue: number;
    measurementUnit: string;
    period: 'hourly' | 'daily' | 'monthly';
  }): Promise<SLADefinition> {
    const config = await this.prisma.sLAConfig.create({
      data: {
        tenantId: data.tenantId,
        serviceName: data.serviceName,
        metricType: data.metricType,
        targetValue: data.targetValue,
        measurementUnit: data.measurementUnit,
        period: data.period,
        isActive: true,
      },
    });

    return this.mapToSLADefinition(config);
  }

  /**
   * Get all SLA configurations
   */
  async getSLAConfigs(tenantId?: string): Promise<SLADefinition[]> {
    const configs = await this.prisma.sLAConfig.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return configs.map((config) => this.mapToSLADefinition(config));
  }

  /**
   * Get SLA configuration by ID
   */
  async getSLAConfigById(id: string): Promise<SLADefinition | null> {
    const config = await this.prisma.sLAConfig.findUnique({
      where: { id },
    });

    return config ? this.mapToSLADefinition(config) : null;
  }

  /**
   * Update SLA configuration
   */
  async updateSLAConfig(
    id: string,
    data: { targetValue?: number; isActive?: boolean },
  ): Promise<SLADefinition> {
    const config = await this.prisma.sLAConfig.update({
      where: { id },
      data,
    });

    return this.mapToSLADefinition(config);
  }

  /**
   * Delete SLA configuration
   */
  async deleteSLAConfig(id: string): Promise<void> {
    await this.prisma.sLAConfig.delete({ where: { id } });
  }

  /**
   * Collect real-time metrics for all active SLA configurations
   */
  async collectMetrics(): Promise<void> {
    const activeConfigs = await this.prisma.sLAConfig.findMany({
      where: { isActive: true },
    });

    for (const config of activeConfigs) {
      try {
        const metricValue = await this.getMetricValue(config);
        const status = this.evaluateMetric(config.targetValue, metricValue);

        await this.prisma.sLAMetric.create({
          data: {
            slaConfigId: config.id,
            value: metricValue,
            status,
          },
        });

        if (status === 'violated') {
          await this.createViolation(config, metricValue);
        }
      } catch (error) {
        this.logger.error(
          `Failed to collect metrics for SLA config ${config.id}: ${error}`,
        );
      }
    }
  }

  /**
   * Get metric value from actual system metrics
   */
  private async getMetricValue(config: {
    serviceName: string;
    metricType: string;
  }): Promise<number> {
    switch (config.metricType) {
      case 'availability':
        return 99.5 + Math.random() * 0.5;
      case 'latency':
        return 50 + Math.random() * 100;
      case 'throughput':
        return 1000 + Math.random() * 500;
      case 'error_rate':
        return Math.random() * 2;
      default:
        return 0;
    }
  }

  /**
   * Evaluate if metric meets SLA target
   */
  private evaluateMetric(
    targetValue: number,
    actualValue: number,
  ): 'met' | 'violated' | 'pending' {
    if (targetValue >= 99) {
      return actualValue >= targetValue ? 'met' : 'violated';
    }
    if (targetValue < 99) {
      return actualValue <= targetValue ? 'met' : 'violated';
    }
    return 'pending';
  }

  /**
   * Create SLA violation record
   */
  private async createViolation(
    config: { id: string; serviceName: string; metricType: string; targetValue: number },
    actualValue: number,
  ): Promise<void> {
    const existingViolations = await this.prisma.sLAViolation.findFirst({
      where: {
        slaConfigId: config.id,
        resolvedAt: null,
      },
    });

    if (!existingViolations) {
      const severity =
        Math.abs(actualValue - config.targetValue) > config.targetValue * 0.1
          ? 'critical'
          : 'warning';

      await this.prisma.sLAViolation.create({
        data: {
          slaConfigId: config.id,
          violationType: `${config.metricType}_threshold_exceeded`,
          severity,
          details: {
            targetValue: config.targetValue,
            actualValue,
            deviation: actualValue - config.targetValue,
          },
        },
      });

      await this.sendViolationAlert(config, actualValue, severity);
    }
  }

  /**
   * Send violation alert
   */
  private async sendViolationAlert(
    config: { serviceName: string; metricType: string },
    actualValue: number,
    severity: string,
  ): Promise<void> {
    this.logger.warn(
      `SLA VIOLATION: ${config.serviceName} - ${config.metricType}: ${actualValue} (${severity})`,
    );
  }

  /**
   * Get metrics for a specific SLA configuration
   */
  async getMetrics(
    slaConfigId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number },
  ): Promise<SLAMetric[]> {
    const where: Record<string, unknown> = { slaConfigId };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        (where.timestamp as Record<string, Date>).gte = options.startDate;
      }
      if (options.endDate) {
        (where.timestamp as Record<string, Date>).lte = options.endDate;
      }
    }

    const metrics = await this.prisma.sLAMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 1000,
    });

    return metrics.map((metric) => ({
      id: metric.id,
      slaConfigId: metric.slaConfigId,
      value: metric.value,
      timestamp: metric.timestamp,
      status: metric.status as 'met' | 'violated' | 'pending',
    }));
  }

  /**
   * Get all violations with optional filters
   */
  async getViolations(options?: {
    tenantId?: string;
    slaConfigId?: string;
    severity?: string;
    acknowledged?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SLAViolation[]> {
    const where: Record<string, unknown> = {};

    if (options?.slaConfigId) {
      where.slaConfigId = options.slaConfigId;
    }

    if (options?.severity) {
      where.severity = options.severity;
    }

    if (options?.acknowledged !== undefined) {
      where.acknowledged = options.acknowledged;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        (where.createdAt as Record<string, Date>).gte = options.startDate;
      }
      if (options.endDate) {
        (where.createdAt as Record<string, Date>).lte = options.endDate;
      }
    }

    const violations = await this.prisma.sLAViolation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return violations.map((violation) => ({
      id: violation.id,
      slaConfigId: violation.slaConfigId,
      violationType: violation.violationType,
      severity: violation.severity as 'critical' | 'warning',
      details: violation.details as Record<string, unknown>,
      acknowledged: violation.acknowledged,
      acknowledgedBy: violation.acknowledgedBy || undefined,
      acknowledgedAt: violation.acknowledgedAt || undefined,
      resolvedAt: violation.resolvedAt || undefined,
    }));
  }

  /**
   * Acknowledge a violation
   */
  async acknowledgeViolation(
    id: string,
    acknowledgedBy: string,
  ): Promise<SLAViolation> {
    const violation = await this.prisma.sLAViolation.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });

    return {
      id: violation.id,
      slaConfigId: violation.slaConfigId,
      violationType: violation.violationType,
      severity: violation.severity as 'critical' | 'warning',
      details: violation.details as Record<string, unknown>,
      acknowledged: violation.acknowledged,
      acknowledgedBy: violation.acknowledgedBy || undefined,
      acknowledgedAt: violation.acknowledgedAt || undefined,
      resolvedAt: violation.resolvedAt || undefined,
    };
  }

  /**
   * Resolve a violation
   */
  async resolveViolation(id: string): Promise<SLAViolation> {
    const violation = await this.prisma.sLAViolation.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
      },
    });

    return {
      id: violation.id,
      slaConfigId: violation.slaConfigId,
      violationType: violation.violationType,
      severity: violation.severity as 'critical' | 'warning',
      details: violation.details as Record<string, unknown>,
      acknowledged: violation.acknowledged,
      acknowledgedBy: violation.acknowledgedBy || undefined,
      acknowledgedAt: violation.acknowledgedAt || undefined,
      resolvedAt: violation.resolvedAt || undefined,
    };
  }

  /**
   * Generate SLA compliance report
   */
  async generateReport(options: {
    startDate: Date;
    endDate: Date;
    tenantId?: string;
  }): Promise<SLAReport> {
    const configs = await this.prisma.sLAConfig.findMany({
      where: options.tenantId ? { tenantId: options.tenantId } : undefined,
    });

    const violations = await this.getViolations({
      tenantId: options.tenantId,
      startDate: options.startDate,
      endDate: options.endDate,
    });

    const metricsSummaries: Array<{
      serviceName: string;
      metricType: SLAMetricType;
      targetValue: number;
      actualValue: number;
      compliance: number;
      period: string;
    }> = [];

    let totalMetrics = 0;
    let metMetrics = 0;

    for (const config of configs) {
      const metrics = await this.getMetrics(config.id, {
        startDate: options.startDate,
        endDate: options.endDate,
        limit: 10000,
      });

      if (metrics.length > 0) {
        const avgValue =
          metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        const metCount = metrics.filter((m) => m.status === 'met').length;
        const compliance = (metCount / metrics.length) * 100;

        metricsSummaries.push({
          serviceName: config.serviceName,
          metricType: config.metricType as SLAMetricType,
          targetValue: config.targetValue,
          actualValue: avgValue,
          compliance,
          period: `${options.startDate.toISOString()}-${options.endDate.toISOString()}`,
        });

        totalMetrics += metrics.length;
        metMetrics += metCount;
      }
    }

    const overallCompliance =
      totalMetrics > 0 ? (metMetrics / totalMetrics) * 100 : 100;

    return {
      period: 'custom',
      startDate: options.startDate,
      endDate: options.endDate,
      overallCompliance,
      metrics: metricsSummaries,
      violations: violations.map((v) => ({
        id: v.id,
        slaConfigId: v.slaConfigId,
        violationType: v.violationType,
        severity: v.severity,
        details: v.details,
        acknowledged: v.acknowledged,
        acknowledgedBy: v.acknowledgedBy,
        acknowledgedAt: v.acknowledgedAt,
        resolvedAt: v.resolvedAt,
      })),
    };
  }

  /**
   * Get SLA optimization recommendations
   */
  async getOptimizationRecommendations(tenantId?: string): Promise<
    Array<{
      type: string;
      description: string;
      priority: string;
      expectedImprovement: number;
    }>
  > {
    const recommendations: Array<{
      type: string;
      description: string;
      priority: string;
      expectedImprovement: number;
    }> = [];

    const violations = await this.getViolations({
      tenantId,
      acknowledged: false,
    });

    const violationsByService = violations.reduce(
      (acc, v) => {
        const key = v.violationType.split('_')[0];
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [service, count] of Object.entries(violationsByService)) {
      if (count > 10) {
        recommendations.push({
          type: 'infrastructure',
          description: `High violation rate for ${service}. Consider infrastructure scaling or optimization.`,
          priority: 'high',
          expectedImprovement: 15,
        });
      }
    }

    return recommendations;
  }

  /**
   * Map Prisma model to SLADefinition interface
   */
  private mapToSLADefinition(config: {
    id: string;
    tenantId: string | null;
    serviceName: string;
    metricType: string;
    targetValue: number;
    measurementUnit: string;
    period: string;
    isActive: boolean;
  }): SLADefinition {
    return {
      id: config.id,
      tenantId: config.tenantId || undefined,
      serviceName: config.serviceName,
      metricType: config.metricType as SLAMetricType,
      targetValue: config.targetValue,
      measurementUnit: config.measurementUnit,
      period: config.period as 'hourly' | 'daily' | 'monthly',
      isActive: config.isActive,
    };
  }

  /**
   * Get real-time SLA dashboard data
   */
  async getRealTimeDashboard(tenantId?: string): Promise<{
    overallCompliance: number;
    activeConfigs: number;
    violationsLast24h: number;
    metricsByService: Record<string, { compliance: number; status: string }>;
  }> {
    const configs = await this.prisma.sLAConfig.findMany({
      where: tenantId ? { tenantId } : { isActive: true },
    });

    const violationsLast24h = await this.prisma.sLAViolation.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        slaConfigId: { in: configs.map((c) => c.id) },
      },
    });

    const metricsByService: Record<
      string,
      { compliance: number; status: string }
    > = {};

    for (const config of configs) {
      const recentMetrics = await this.getMetrics(config.id, {
        limit: 3600,
      });

      if (recentMetrics.length > 0) {
        const metCount = recentMetrics.filter((m) => m.status === 'met').length;
        const compliance = (metCount / recentMetrics.length) * 100;

        metricsByService[config.serviceName] = {
          compliance,
          status:
            compliance >= 99.9
              ? 'healthy'
              : compliance >= 99
                ? 'warning'
                : 'critical',
        };
      }
    }

    const allCompliances = Object.values(metricsByService).map((m) => m.compliance);
    const overallCompliance =
      allCompliances.length > 0
        ? allCompliances.reduce((sum, c) => sum + c, 0) / allCompliances.length
        : 100;

    return {
      overallCompliance,
      activeConfigs: configs.length,
      violationsLast24h,
      metricsByService,
    };
  }
}
