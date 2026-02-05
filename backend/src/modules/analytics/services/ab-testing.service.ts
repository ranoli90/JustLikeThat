import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ABExperiment,
  ABVariant,
  ABResult,
  ABTargeting,
  FeatureFlag,
} from '../interfaces/analytics.interface';
import { v4 as uuidv4 } from 'uuid';
import * as math from 'mathjs';

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Experiment Management
  async createExperiment(
    userId: string,
    experiment: Omit<ABExperiment, 'id'>,
  ): Promise<ABExperiment> {
    const created = await this.prisma.aBExperiment.create({
      data: {
        name: experiment.name,
        description: experiment.description,
        status: 'draft',
        variants: experiment.variants as any,
        targeting: experiment.targeting as any,
        trafficSplit: experiment.trafficSplit as any,
        primaryMetric: experiment.primaryMetric,
        minSampleSize: experiment.minSampleSize || 1000,
      },
    });

    // Create variants
    for (const variant of experiment.variants) {
      await this.prisma.aBVariant.create({
        data: {
          experimentId: created.id,
          name: variant.name,
          description: variant.description,
          config: variant.config as any,
          trafficWeight: variant.trafficWeight,
          isControl: variant.isControl || false,
        },
      });
    }

    return this.mapPrismaExperiment(created);
  }

  async getExperiment(experimentId: string): Promise<ABExperiment> {
    const experiment = await this.prisma.aBExperiment.findUnique({
      where: { id: experimentId },
      include: { variants: true },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    return this.mapPrismaExperiment(experiment);
  }

  async getExperiments(
    status?: string,
    pagination: { page: number; limit: number },
  ): Promise<{ experiments: ABExperiment[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;

    const [experiments, total] = await Promise.all([
      this.prisma.aBExperiment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.aBExperiment.count({ where }),
    ]);

    return {
      experiments: experiments.map((e) => this.mapPrismaExperiment(e)),
      total,
    };
  }

  async updateExperiment(
    experimentId: string,
    updates: Partial<ABExperiment>,
  ): Promise<ABExperiment> {
    const experiment = await this.prisma.aBExperiment.update({
      where: { id: experimentId },
      data: {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        targeting: updates.targeting as any,
        trafficSplit: updates.trafficSplit as any,
        primaryMetric: updates.primaryMetric,
        minSampleSize: updates.minSampleSize,
        endDate: updates.endDate,
      },
    });

    return this.mapPrismaExperiment(experiment);
  }

  async startExperiment(experimentId: string): Promise<ABExperiment> {
    const experiment = await this.getExperiment(experimentId);
    
    if (experiment.status !== 'draft') {
      throw new BadRequestException('Experiment can only be started from draft status');
    }

    const updated = await this.prisma.aBExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'running',
        startDate: new Date(),
      },
    });

    this.logger.log(`Experiment ${experimentId} started`);
    return this.mapPrismaExperiment(updated);
  }

  async pauseExperiment(experimentId: string): Promise<ABExperiment> {
    const updated = await this.prisma.aBExperiment.update({
      where: { id: experimentId },
      data: { status: 'paused' },
    });

    return this.mapPrismaExperiment(updated);
  }

  async completeExperiment(experimentId: string): Promise<ABExperiment> {
    const updated = await this.prisma.aBExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'completed',
        endDate: new Date(),
      },
    });

    return this.mapPrismaExperiment(updated);
  }

  async deleteExperiment(experimentId: string): Promise<void> {
    await this.prisma.aBExperiment.delete({
      where: { id: experimentId },
    });
  }

  // Variant Management
  async addVariant(
    experimentId: string,
    variant: Omit<ABVariant, 'id' | 'experimentId'>,
  ): Promise<ABVariant> {
    const created = await this.prisma.aBVariant.create({
      data: {
        experimentId,
        name: variant.name,
        description: variant.description,
        config: variant.config as any,
        trafficWeight: variant.trafficWeight,
        isControl: variant.isControl || false,
      },
    });

    return {
      id: created.id,
      experimentId: created.experimentId,
      name: created.name,
      description: created.description || undefined,
      config: created.config as any,
      trafficWeight: created.trafficWeight,
      isControl: created.isControl,
    };
  }

  async updateVariant(
    variantId: string,
    updates: Partial<ABVariant>,
  ): Promise<ABVariant> {
    const variant = await this.prisma.aBVariant.update({
      where: { id: variantId },
      data: {
        name: updates.name,
        description: updates.description,
        config: updates.config as any,
        trafficWeight: updates.trafficWeight,
      },
    });

    return {
      id: variant.id,
      experimentId: variant.experimentId,
      name: variant.name,
      description: variant.description || undefined,
      config: variant.config as any,
      trafficWeight: variant.trafficWeight,
      isControl: variant.isControl,
    };
  }

  // Traffic Assignment
  async assignVariant(
    experimentId: string,
    userId: string,
  ): Promise<{ variantId: string; variant: ABVariant }> {
    const experiment = await this.getExperiment(experimentId);

    if (experiment.status !== 'running') {
      throw new BadRequestException('Experiment is not running');
    }

    // Check for existing assignment
    const existing = await this.prisma.aBAssignment.findFirst({
      where: { experimentId, userId },
    });

    if (existing) {
      const variant = await this.prisma.aBVariant.findUnique({
        where: { id: existing.variantId },
      });
      return {
        variantId: existing.variantId,
        variant: variant! as any,
      };
    }

    // Get variant weights and assign
    const variants = experiment.variants;
    const variantId = this.selectVariant(variants, userId);

    await this.prisma.aBAssignment.create({
      data: {
        experimentId,
        variantId,
        userId,
      },
    });

    // Update sample size
    await this.prisma.aBExperiment.update({
      where: { id: experimentId },
      data: { currentSample: { increment: 1 } },
    });

    const variant = await this.prisma.aBVariant.findUnique({
      where: { id: variantId },
    });

    return {
      variantId,
      variant: variant! as any,
    };
  }

  private selectVariant(
    variants: ABVariant[],
    userId: string,
  ): string {
    // Consistent hashing for user-based assignment
    const hash = this.hashUser(userId);
    const normalizedHash = hash % 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.trafficWeight;
      if (normalizedHash < cumulative) {
        return variant.id!;
      }
    }

    return variants[0]?.id || '';
  }

  private hashUser(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Conversion Tracking
  async recordConversion(
    experimentId: string,
    userId: string,
    value?: number,
  ): Promise<void> {
    const assignment = await this.prisma.aBAssignment.findFirst({
      where: { experimentId, userId },
    });

    if (!assignment) {
      throw new BadRequestException('User not assigned to experiment');
    }

    await this.prisma.aBAssignment.update({
      where: { id: assignment.id },
      data: {
        converted: true,
        convertedAt: new Date(),
        metadata: { value } as any,
      },
    });
  }

  // Results Analysis
  async calculateResults(experimentId: string): Promise<ABResult[]> {
    const experiment = await this.getExperiment(experimentId);
    const results: ABResult[] = [];

    for (const variant of experiment.variants) {
      const assignments = await this.prisma.aBAssignment.findMany({
        where: { experimentId, variantId: variant.id },
      });

      const converted = assignments.filter((a) => a.converted);
      const sampleSize = assignments.length;
      const conversions = converted.length;

      const conversionRate = sampleSize > 0 ? conversions / sampleSize : 0;
      
      // Calculate statistical significance against control
      const controlVariant = experiment.variants.find((v) => v.isControl);
      let pValue: number | undefined;
      let isSignificant = false;
      let confidenceLow: number | undefined;
      let confidenceHigh: number | undefined;

      if (controlVariant && variant.id !== controlVariant.id && sampleSize >= 1000) {
        const controlConversions = assignments.filter(
          (a) => a.converted && a.variantId === controlVariant.id,
        ).length;
        const controlSample = await this.prisma.aBAssignment.count({
          where: { experimentId, variantId: controlVariant.id },
        });

        const controlRate = controlSample > 0 ? controlConversions / controlSample : 0;

        // Calculate p-value using z-test for proportions
        const pVal = this.calculateZTest(
          conversionRate,
          controlRate,
          sampleSize,
          controlSample,
        );
        pValue = pVal;
        isSignificant = pVal < 0.05;

        // Calculate confidence interval
        const se = Math.sqrt(
          (conversionRate * (1 - conversionRate)) / sampleSize,
        );
        const z = 1.96; // 95% confidence
        confidenceLow = conversionRate - z * se;
        confidenceHigh = conversionRate + z * se;
      }

      const result = await this.prisma.aBResult.create({
        data: {
          experimentId,
          variantId: variant.id!,
          metricName: experiment.primaryMetric || 'conversion_rate',
          sampleSize,
          mean: conversionRate,
          variance: conversionRate * (1 - conversionRate),
          confidenceLow,
          confidenceHigh,
          pValue,
          isSignificant,
        },
      });

      results.push({
        id: result.id,
        experimentId: result.experimentId,
        variantId: result.variantId,
        metricName: result.metricName,
        sampleSize: result.sampleSize,
        mean: result.mean,
        variance: result.variance || undefined,
        confidenceLow: result.confidenceLow || undefined,
        confidenceHigh: result.confidenceHigh || undefined,
        pValue: result.pValue || undefined,
        isSignificant: result.isSignificant,
      });
    }

    // Update experiment results
    const winner = this.determineWinner(results, experiment.variants);
    await this.prisma.aBExperiment.update({
      where: { id: experimentId },
      data: {
        results: {
          winner: winner?.variantId,
          improvement: winner?.improvement || 0,
          confidence: winner?.confidence || 0,
          isSignificant: winner?.isSignificant || false,
        } as any,
      },
    });

    return results;
  }

  private calculateZTest(
    rate1: number,
    rate2: number,
    n1: number,
    n2: number,
  ): number {
    const pooledRate = (rate1 * n1 + rate2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / n1 + 1 / n2));
    const z = (rate1 - rate2) / se;

    // Convert z-score to p-value (two-tailed)
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private determineWinner(
    results: ABResult[],
    variants: ABVariant[],
  ): { variantId: string; improvement: number; confidence: number; isSignificant: boolean } | null {
    const control = results.find((r) => {
      const variant = variants.find((v) => v.id === r.variantId);
      return variant?.isControl;
    });

    if (!control) return null;

    const best = results.reduce((best, current) => {
      if (current.variantId === control.variantId) return best;
      if (!best) return current;
      return current.mean > best.mean ? current : best;
    }, null as ABResult | null);

    if (!best) return null;

    const improvement = best.mean > control.mean
      ? ((best.mean - control.mean) / control.mean) * 100
      : 0;

    return {
      variantId: best.variantId,
      improvement,
      confidence: best.pValue ? (1 - best.pValue) * 100 : 0,
      isSignificant: best.isSignificant || false,
    };
  }

  // Feature Flags
  async createFeatureFlag(flag: Omit<FeatureFlag, 'id'>): Promise<FeatureFlag> {
    const created = await this.prisma.featureFlag.create({
      data: {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        rolloutPct: flag.rolloutPct,
        targeting: flag.targeting as any,
      },
    });

    return this.mapPrismaFeatureFlag(created);
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return flags.map((f) => this.mapPrismaFeatureFlag(f));
  }

  async getFeatureFlag(key: string): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag ${key} not found`);
    }

    return this.mapPrismaFeatureFlag(flag);
  }

  async updateFeatureFlag(
    key: string,
    updates: Partial<FeatureFlag>,
  ): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.update({
      where: { key },
      data: {
        name: updates.name,
        description: updates.description,
        enabled: updates.enabled,
        rolloutPct: updates.rolloutPct,
        targeting: updates.targeting as any,
      },
    });

    return this.mapPrismaFeatureFlag(flag);
  }

  async isFeatureEnabled(
    key: string,
    userId?: string,
  ): Promise<boolean> {
    const flag = await this.getFeatureFlag(key);

    if (!flag.enabled) return false;

    // Check rollout percentage
    if (flag.rolloutPct < 100 && userId) {
      const hash = this.hashUser(userId);
      const normalized = hash % 100;
      if (normalized >= flag.rolloutPct) return false;
    }

    return true;
  }

  // Helper methods
  private mapPrismaExperiment(experiment: any): ABExperiment {
    return {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description || undefined,
      status: experiment.status,
      variants: experiment.variants || [],
      targeting: experiment.targeting,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      results: experiment.results,
      trafficSplit: experiment.trafficSplit,
      primaryMetric: experiment.primaryMetric || undefined,
      minSampleSize: experiment.minSampleSize,
      currentSample: experiment.currentSample,
    };
  }

  private mapPrismaFeatureFlag(flag: any): FeatureFlag {
    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description || undefined,
      enabled: flag.enabled,
      rolloutPct: flag.rolloutPct,
      targeting: flag.targeting,
    };
  }
}
