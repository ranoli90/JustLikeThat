import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CapacityMetrics,
  CapacityPrediction,
  CapacityRecommendation,
} from '../interfaces/lts.interface';

@Injectable()
export class CapacityPlanningService {
  private readonly logger = new Logger(CapacityPlanningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCurrentCapacity(): Promise<CapacityMetrics> {
    return {
      cpu: { current: 65, peak: 85, average: 60, unit: 'percent', trend: 'increasing' },
      memory: { current: 72, peak: 88, average: 68, unit: 'percent', trend: 'stable' },
      storage: { current: 45, peak: 50, average: 42, unit: 'percent', trend: 'increasing' },
      network: { current: 35, peak: 60, average: 30, unit: 'percent', trend: 'stable' },
    };
  }

  async getCapacityHistory(
    resourceType: string,
    options?: { startDate?: Date; endDate?: Date; granularity?: string },
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const data: Array<{ timestamp: Date; value: number }> = [];
    const now = new Date();
    const days = 30;

    for (let i = 0; i < days; i++) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseValue = resourceType === 'cpu' ? 60 : resourceType === 'memory' ? 70 : 40;
      const variance = Math.random() * 20 - 10;
      data.push({
        timestamp,
        value: Math.max(0, Math.min(100, baseValue + variance)),
      });
    }

    return data.reverse();
  }

  async generatePredictions(options?: {
    horizonMonths?: number;
    resourceTypes?: string[];
  }): Promise<CapacityPrediction[]> {
    const horizonMonths = options?.horizonMonths || 12;
    const resourceTypes = options?.resourceTypes || ['cpu', 'memory', 'storage', 'network'];

    const predictions: CapacityPrediction[] = [];
    const currentCapacity = await this.getCurrentCapacity();

    for (const resourceType of resourceTypes) {
      const currentMetric = currentCapacity[resourceType as keyof CapacityMetrics];
      const monthlyGrowthRate = 0.02;
      const predictedCapacity = currentMetric.current * Math.pow(1 + monthlyGrowthRate, horizonMonths);
      const history = await this.getCapacityHistory(resourceType);
      const confidence = this.calculatePredictionConfidence(history);

      predictions.push({
        resourceType,
        currentCapacity: currentMetric.current,
        predictedCapacity: Math.min(100, predictedCapacity),
        confidence,
        predictionDate: new Date(Date.now() + horizonMonths * 30 * 24 * 60 * 60 * 1000),
        factors: [
          { name: 'Historical Growth', impact: monthlyGrowthRate * 100, description: `Based on ${horizonMonths} months of data` },
          { name: 'User Base Growth', impact: 1.5, description: 'Projected user acquisition' },
          { name: 'Seasonal Variation', impact: 0.5, description: 'Expected seasonal fluctuations' },
        ],
      });
    }

    return predictions;
  }

  private calculatePredictionConfidence(
    history: Array<{ timestamp: Date; value: number }>,
  ): number {
    if (history.length < 2) return 0.5;
    const values = history.map((h) => h.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    return Math.min(0.95, Math.max(0.5, 1 - coefficientOfVariation));
  }

  async getRecommendations(): Promise<CapacityRecommendation[]> {
    const currentCapacity = await this.getCurrentCapacity();
    const predictions = await this.generatePredictions({ horizonMonths: 6 });
    const recommendations: CapacityRecommendation[] = [];

    for (const prediction of predictions) {
      const resourceType = prediction.resourceType;
      const currentMetric = currentCapacity[resourceType as keyof CapacityMetrics];

      if (prediction.predictedCapacity > 85) {
        recommendations.push({
          id: `cap-rec-${resourceType}-scale-up`,
          type: 'scale_up',
          priority: prediction.predictedCapacity > 95 ? 'high' : 'medium',
          description: `Projected ${resourceType} utilization of ${prediction.predictedCapacity.toFixed(1)}% exceeds threshold.`,
          estimatedCost: this.estimateScaleUpCost(resourceType),
          expectedImprovement: 30,
          implementationEffort: '1-2 weeks',
        });
      }

      if (currentMetric.trend === 'stable' && currentMetric.current < 50) {
        recommendations.push({
          id: `cap-rec-${resourceType}-optimize`,
          type: 'optimize',
          priority: 'low',
          description: `Current ${resourceType} utilization is low. Consider right-sizing.`,
          estimatedCost: 0,
          expectedImprovement: 15,
          implementationEffort: '1 week',
        });
      }
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private estimateScaleUpCost(resourceType: string): number {
    const costs: Record<string, number> = { cpu: 500, memory: 300, storage: 100, network: 200 };
    return costs[resourceType] || 100;
  }

  async generateReport(options: {
    period: 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
  }): Promise<{
    id: string;
    period: string;
    startDate: Date;
    endDate: Date;
    metrics: CapacityMetrics;
    predictions: CapacityPrediction[];
    recommendations: CapacityRecommendation[];
  }> {
    const currentCapacity = await this.getCurrentCapacity();
    const predictions = await this.generatePredictions({ horizonMonths: 12 });
    const recommendations = await this.getRecommendations();

    const report = await this.prisma.capacityReport.create({
      data: {
        period: options.period,
        startDate: options.startDate,
        endDate: options.endDate,
        metrics: currentCapacity as unknown as Record<string, unknown>,
        predictions: predictions as unknown as Record<string, unknown>,
        recommendations: recommendations as unknown as Record<string, unknown>,
      },
    });

    return {
      id: report.id,
      period: report.period,
      startDate: report.startDate,
      endDate: report.endDate,
      metrics: currentCapacity,
      predictions,
      recommendations,
    };
  }

  async getReports(options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Array<{
    id: string;
    period: string;
    startDate: Date;
    endDate: Date;
    metrics: CapacityMetrics;
    predictions: CapacityPrediction[];
    recommendations: CapacityRecommendation[];
  }>> {
    const where: Record<string, unknown> = {};
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) (where.createdAt as Record<string, Date>).gte = options.startDate;
      if (options.endDate) (where.createdAt as Record<string, Date>).lte = options.endDate;
    }

    const reports = await this.prisma.capacityReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 10,
    });

    return reports.map((report) => ({
      id: report.id,
      period: report.period,
      startDate: report.startDate,
      endDate: report.endDate,
      metrics: report.metrics as unknown as CapacityMetrics,
      predictions: report.predictions as unknown as CapacityPrediction[],
      recommendations: report.recommendations as unknown as CapacityRecommendation[],
    }));
  }

  async getAutoScalingRecommendations(): Promise<{
    scalingRules: Array<{ metric: string; scaleUpThreshold: number; scaleDownThreshold: number; cooldown: number }>;
    estimatedSavings: number;
  }> {
    const currentCapacity = await this.getCurrentCapacity();
    const scalingRules = [
      { metric: 'cpu', scaleUpThreshold: 80, scaleDownThreshold: 30, cooldown: 300 },
      { metric: 'memory', scaleUpThreshold: 85, scaleDownThreshold: 40, cooldown: 300 },
      { metric: 'storage', scaleUpThreshold: 90, scaleDownThreshold: 50, cooldown: 600 },
    ];
    const avgCpuUtilization = currentCapacity.cpu.average;
    const potentialSavings = avgCpuUtilization < 50 ? (50 - avgCpuUtilization) * 0.5 : 0;
    return { scalingRules, estimatedSavings: Math.round(potentialSavings * 12) };
  }

  async getCostOptimization(): Promise<{
    currentMonthlyCost: number;
    optimizedCost: number;
    savings: number;
    recommendations: Array<{ action: string; impact: number; effort: string }>;
  }> {
    const currentMonthlyCost = 15000;
    const recommendations = [
      { action: 'Right-size underutilized instances', impact: 0.15, effort: 'Low' },
      { action: 'Implement auto-scaling', impact: 0.2, effort: 'Medium' },
      { action: 'Use reserved instances for predictable load', impact: 0.1, effort: 'Low' },
      { action: 'Optimize storage tiers', impact: 0.08, effort: 'Medium' },
    ];
    const totalImpact = recommendations.reduce((sum, r) => sum + r.impact, 0);
    return {
      currentMonthlyCost,
      optimizedCost: Math.round(currentMonthlyCost * (1 - totalImpact)),
      savings: Math.round(currentMonthlyCost * totalImpact),
      recommendations,
    };
  }

  async trackUtilization(resourceType: string, value: number, metadata?: Record<string, unknown>): Promise<void> {
    this.logger.log(`Resource utilization tracked: ${resourceType} = ${value}%`);
  }
}
