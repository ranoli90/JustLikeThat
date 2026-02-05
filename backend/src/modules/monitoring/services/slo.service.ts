import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface SLOConfig {
  id?: string;
  name: string;
  description: string;
  serviceName: string;
  sliType: 'availability' | 'latency' | 'quality';
  target: number;
  window: string;
  alertsEnabled?: boolean;
}

export interface SLIResult {
  sloId: string;
  timestamp: Date;
  measurement: number;
  totalRequests: number;
  successfulRequests: number;
}

@Injectable()
export class SLOService {
  private readonly logger = new Logger(SLOService.name);
  private readonly windows = {
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '365d': 365 * 24 * 60 * 60 * 1000,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an SLO configuration
   */
  async createSLO(config: SLOConfig): Promise<string> {
    const id = uuidv4();

    await this.prisma.sLOConfig.create({
      data: {
        id,
        name: config.name,
        description: config.description,
        serviceName: config.serviceName,
        sliType: config.sliType,
        target: config.target,
        window: config.window,
        alertsEnabled: config.alertsEnabled ?? true,
      },
    });

    this.logger.log(`Created SLO: ${config.name} for service ${config.serviceName}`);
    return id;
  }

  /**
   * Get all SLO configurations
   */
  async getSLOs(): Promise<any[]> {
    return this.prisma.sLOConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get SLO by ID
   */
  async getSLO(id: string): Promise<any> {
    return this.prisma.sLOConfig.findUnique({
      where: { id },
    });
  }

  /**
   * Update SLO configuration
   */
  async updateSLO(id: string, updates: Partial<SLOConfig>): Promise<void> {
    await this.prisma.sLOConfig.update({
      where: { id },
      data: updates,
    });
  }

  /**
   * Delete SLO configuration
   */
  async deleteSLO(id: string): Promise<void> {
    await this.prisma.sLOConfig.delete({
      where: { id },
    });
  }

  /**
   * Record SLI measurement
   */
  async recordSLI(result: SLIResult): Promise<string> {
    const id = uuidv4();

    await this.prisma.sLIResult.create({
      data: {
        id,
        sloId: result.sloId,
        timestamp: result.timestamp,
        measurement: result.measurement,
        totalRequests: result.totalRequests,
        successfulRequests: result.successfulRequests,
      },
    });

    return id;
  }

  /**
   * Get SLO status
   */
  async getSLOStatus(sloId: string): Promise<{
    slo: any;
    currentMeasurement: number;
    target: number;
    status: 'healthy' | 'warning' | 'critical';
    errorBudgetRemaining: number;
  }> {
    const slo = await this.getSLO(sloId);
    if (!slo) {
      throw new Error(`SLO not found: ${sloId}`);
    }

    const windowMs = this.windows[slo.window as keyof typeof this.windows] || this.windows['30d'];
    const startTime = new Date(Date.now() - windowMs);

    // Get SLI results for the window
    const results = await this.prisma.sLIResult.findMany({
      where: {
        sloId,
        timestamp: { gte: startTime },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (results.length === 0) {
      return {
        slo,
        currentMeasurement: 0,
        target: slo.target,
        status: 'warning',
        errorBudgetRemaining: 100 - (100 - slo.target),
      };
    }

    // Calculate weighted average
    const totalWeight = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const weightedSum = results.reduce(
      (sum, r) => sum + r.measurement * r.totalRequests,
      0
    );
    const currentMeasurement = weightedSum / totalWeight;

    // Calculate error budget
    const errorBudgetRemaining = Math.max(0, 100 - (100 - currentMeasurement));

    // Determine status
    let status: 'healthy' | 'warning' | 'critical';
    if (currentMeasurement >= slo.target) {
      status = 'healthy';
    } else if (currentMeasurement >= slo.target - 5) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      slo,
      currentMeasurement,
      target: slo.target,
      status,
      errorBudgetRemaining,
    };
  }

  /**
   * Get error budget for an SLO
   */
  async getErrorBudget(sloId: string): Promise<{
    budget: number;
    consumed: number;
    remaining: number;
    burnRate: number;
    windowStart: Date;
    windowEnd: Date;
  }> {
    const slo = await this.getSLO(sloId);
    if (!slo) {
      throw new Error(`SLO not found: ${sloId}`);
    }

    const windowMs = this.windows[slo.window as keyof typeof this.windows] || this.windows['30d'];
    const windowStart = new Date(Date.now() - windowMs);
    const windowEnd = new Date();

    const results = await this.prisma.sLIResult.findMany({
      where: {
        sloId,
        timestamp: { gte: windowStart },
      },
    });

    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const successfulRequests = results.reduce((sum, r) => sum + r.successfulRequests, 0);

    const budget = 100 - slo.target;
    const actual = 100 - (successfulRequests / totalRequests) * 100;
    const consumed = Math.min(budget, actual);
    const remaining = Math.max(0, budget - consumed);

    // Calculate burn rate (error budget consumed per second)
    const windowSeconds = windowMs / 1000;
    const burnRate = consumed / windowSeconds;

    return {
      budget,
      consumed,
      remaining,
      burnRate,
      windowStart,
      windowEnd,
    };
  }

  /**
   * Get SLO health dashboard data
   */
  async getSLOHealthDashboard(): Promise<{
    totalSLOs: number;
    healthy: number;
    warning: number;
    critical: number;
    sloList: Array<{
      id: string;
      name: string;
      serviceName: string;
      sliType: string;
      target: number;
      current: number;
      status: string;
      errorBudgetRemaining: number;
    }>;
  }> {
    const slos = await this.getSLOs();
    const sloList: any[] = [];

    let healthy = 0;
    let warning = 0;
    let critical = 0;

    for (const slo of slos) {
      const status = await this.getSLOStatus(slo.id);
      sloList.push({
        id: slo.id,
        name: slo.name,
        serviceName: slo.serviceName,
        sliType: slo.sliType,
        target: slo.target,
        current: status.currentMeasurement,
        status: status.status,
        errorBudgetRemaining: status.errorBudgetRemaining,
      });

      if (status.status === 'healthy') healthy++;
      else if (status.status === 'warning') warning++;
      else critical++;
    }

    return {
      totalSLOs: slos.length,
      healthy,
      warning,
      critical,
      sloList,
    };
  }

  /**
   * Calculate burn rate and alert if too high
   */
  async checkBurnRate(sloId: string): Promise<{
    isHighBurn: boolean;
    burnRate: number;
    threshold: number;
    message?: string;
  }> {
    const errorBudget = await this.getErrorBudget(sloId);
    const slo = await this.getSLO(sloId);

    // Alert if burn rate would consume more than 50% of error budget in 24 hours
    const windowSeconds = this.windows[slo.window as keyof typeof this.windows] / 1000;
    const projectedBurn = (errorBudget.burnRate * 24 * 60 * 60) / errorBudget.budget;

    const isHighBurn = projectedBurn > 0.5;
    const threshold = 0.5;

    return {
      isHighBurn,
      burnRate: errorBudget.burnRate,
      threshold,
      message: isHighBurn
        ? `High burn rate detected. Projected to consume ${(projectedBurn * 100).toFixed(1)}% of error budget in 24 hours.`
        : undefined,
    };
  }

  /**
   * Get SLO report
   */
  async generateSLOReport(sloId: string): Promise<{
    slo: any;
    period: { start: Date; end: Date };
    measurements: any[];
    summary: {
      totalRequests: number;
      successfulRequests: number;
      availability: number;
      target: number;
      compliance: boolean;
    };
    errorBudget: {
      budget: number;
      consumed: number;
      remaining: number;
      burnRate: number;
    };
  }> {
    const slo = await this.getSLO(sloId);
    const windowMs = this.windows[slo.window as keyof typeof this.windows] || this.windows['30d'];
    const windowStart = new Date(Date.now() - windowMs);
    const windowEnd = new Date();

    const measurements = await this.prisma.sLIResult.findMany({
      where: {
        sloId,
        timestamp: { gte: windowStart },
      },
      orderBy: { timestamp: 'asc' },
    });

    const totalRequests = measurements.reduce((sum, m) => sum + m.totalRequests, 0);
    const successfulRequests = measurements.reduce((sum, m) => sum + m.successfulRequests, 0);
    const availability = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const errorBudget = await this.getErrorBudget(sloId);

    return {
      slo,
      period: { start: windowStart, end: windowEnd },
      measurements,
      summary: {
        totalRequests,
        successfulRequests,
        availability,
        target: slo.target,
        compliance: availability >= slo.target,
      },
      errorBudget: {
        budget: errorBudget.budget,
        consumed: errorBudget.consumed,
        remaining: errorBudget.remaining,
        burnRate: errorBudget.burnRate,
      },
    };
  }
}
