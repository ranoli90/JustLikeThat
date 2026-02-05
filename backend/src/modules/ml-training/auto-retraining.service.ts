import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../integrations/prisma/prisma.service';

export interface DriftDetectionResult {
  metricName: string;
  baselineValue: number;
  currentValue: number;
  driftDetected: boolean;
  driftScore: number;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface RetrainingConfig {
  modelId: string;
  trigger: 'scheduled' | 'drift_detected' | 'manual';
  schedule?: string;
  qualityGate: {
    minAccuracy: number;
    minF1Score: number;
    maxDriftScore: number;
  };
  useSpotInstances: boolean;
}

export interface RetrainingJob {
  id: string;
  modelId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  cost?: number;
  errorMessage?: string;
}

@Injectable()
export class AutoRetrainingService {
  private readonly logger = new Logger(AutoRetrainingService.name);
  private retrainingQueue: Map<string, RetrainingJob> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all retraining jobs
   */
  async getRetrainingJobs(): Promise<RetrainingJob[]> {
    const jobs = await this.prisma.trainingJob.findMany({
      where: {
        modelId: { not: undefined },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return jobs.map((job) => ({
      id: job.id,
      modelId: job.modelId,
      status: job.status as any,
      progress: job.progress,
      startedAt: job.startedAt,
      completedAt: job.completedAt || undefined,
      cost: job.cost || undefined,
      errorMessage: job.errorMessage || undefined,
    }));
  }

  /**
   * Trigger retraining for a model
   */
  async triggerRetraining(modelId: string, reason?: string): Promise<RetrainingJob> {
    const jobId = `retrain-${Date.now()}`;
    
    this.logger.log(`Triggering retraining for model ${modelId}. Reason: ${reason || 'manual'}`);

    // Create retraining job
    const job = await this.prisma.trainingJob.create({
      data: {
        id: jobId,
        modelId,
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
      },
    });

    // Start retraining process
    this.executeRetraining(jobId, modelId);

    return {
      id: job.id,
      modelId: job.modelId,
      status: 'pending',
      progress: 0,
      startedAt: job.startedAt,
    };
  }

  /**
   * Execute retraining process
   */
  private async executeRetraining(jobId: string, modelId: string): Promise<void> {
    try {
      // Update status to running
      await this.prisma.trainingJob.update({
        where: { id: jobId },
        data: { status: 'running' },
      });

      // Simulate retraining progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await this.delay(500);
        await this.prisma.trainingJob.update({
          where: { id: jobId },
          data: { progress },
        });
      }

      // Check quality gates
      const qualityPassed = await this.checkQualityGates(modelId);
      
      if (qualityPassed) {
        // Deploy new version
        await this.prisma.trainingJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
            cost: this.calculateSpotInstanceCost('A100', 2),
          },
        });

        // Update model version
        await this.prisma.mLModel.update({
          where: { id: modelId },
          data: {
            status: 'ready',
            trainedAt: new Date(),
          },
        });

        this.logger.log(`Retraining completed successfully for model ${modelId}`);
      } else {
        await this.prisma.trainingJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errorMessage: 'Quality gates not met',
          },
        });
      }
    } catch (error) {
      await this.prisma.trainingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });
      this.logger.error(`Retraining failed for model ${modelId}: ${error.message}`);
    }
  }

  /**
   * Detect data drift
   */
  async detectDrift(modelId: string): Promise<DriftDetectionResult[]> {
    this.logger.log(`Detecting drift for model ${modelId}`);

    // Metrics to check for drift
    const metrics = [
      'match_rate',
      'application_rate',
      'interview_rate',
      'user_satisfaction',
      'employer_satisfaction',
    ];

    const results: DriftDetectionResult[] = [];

    for (const metric of metrics) {
      const baseline = await this.getBaselineValue(modelId, metric);
      const current = await this.getCurrentValue(modelId, metric);
      
      // Calculate drift using Kolmogorov-Smirnov test simulation
      const driftScore = this.calculateDriftScore(baseline, current);
      const threshold = 0.15;

      results.push({
        metricName: metric,
        baselineValue: baseline,
        currentValue: current,
        driftDetected: driftScore > threshold,
        driftScore,
        severity: driftScore > 0.3 ? 'high' : driftScore > 0.15 ? 'medium' : 'low',
        recommendations: this.getDriftRecommendations(metric, driftScore),
      });

      // Store drift detection
      await this.prisma.dataDriftDetection.create({
        data: {
          modelId,
          metricName: metric,
          baselineValue: baseline,
          currentValue: current,
          driftDetected: driftScore > threshold,
          severity: driftScore > 0.3 ? 'high' : driftScore > 0.15 ? 'medium' : 'low',
        },
      });
    }

    return results;
  }

  /**
   * Get drift detections
   */
  async getDriftDetections(modelId?: string): Promise<any[]> {
    const where = modelId ? { modelId } : {};
    
    return this.prisma.dataDriftDetection.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Calculate drift using PSI (Population Stability Index)
   */
  async calculatePSI(modelId: string, metric: string): Promise<{
    psi: number;
    interpretation: string;
  }> {
    // Simulate PSI calculation
    const psi = Math.random() * 0.3;
    
    let interpretation: string;
    if (psi < 0.1) {
      interpretation = 'No significant drift';
    } else if (psi < 0.2) {
      interpretation = 'Minor drift - monitor';
    } else {
      interpretation = 'Significant drift - consider retraining';
    }

    return { psi, interpretation };
  }

  /**
   * Implement quality gates for deployment
   */
  async checkQualityGates(modelId: string): Promise<boolean> {
    const model = await this.prisma.mLModel.findUnique({
      where: { id: modelId },
    });

    if (!model) return false;

    const metrics = (model.metrics as Record<string, any>) || {};
    
    const thresholds = {
      accuracy: 0.85,
      f1Score: 0.80,
      precision: 0.82,
      recall: 0.78,
    };

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = metrics[metric] || 0;
      if (value < threshold) {
        this.logger.warn(`Quality gate failed for ${metric}: ${value} < ${threshold}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Schedule automatic retraining
   */
  async scheduleRetraining(config: RetrainingConfig): Promise<{
    scheduleId: string;
    nextRunAt: Date;
  }> {
    const scheduleId = `schedule-${Date.now()}`;
    
    this.logger.log(`Scheduled retraining for model ${config.modelId}`);
    
    // In real implementation, this would:
    // 1. Create a scheduled job in the task scheduler
    // 2. Calculate next run time based on schedule
    // 3. Store configuration

    const nextRunAt = new Date();
    nextRunAt.setDate(nextRunAt.getDate() + 7); // Default to weekly

    return {
      scheduleId,
      nextRunAt,
    };
  }

  /**
   * Optimize retraining costs using spot instances
   */
  async optimizeCosts(instanceType: string): Promise<{
    recommendedInstance: string;
    estimatedSavings: number;
    fallbackOptions: string[];
  }> {
    const spotPricing = {
      'A100': { onDemand: 3.50, spot: 1.50 },
      'V100': { onDemand: 2.50, spot: 1.00 },
      'T4': { onDemand: 0.50, spot: 0.20 },
    };

    const pricing = spotPricing[instanceType as keyof typeof spotPricing] || spotPricing['T4'];
    const savings = ((pricing.onDemand - pricing.spot) / pricing.onDemand) * 100;

    return {
      recommendedInstance: instanceType,
      estimatedSavings: savings,
      fallbackOptions: ['T4', 'V100', 'A100'],
    };
  }

  /**
   * Get baseline value for a metric
   */
  private async getBaselineValue(modelId: string, metric: string): Promise<number> {
    // In real implementation, get from historical data
    return 0.85 + Math.random() * 0.05;
  }

  /**
   * Get current value for a metric
   */
  private async getCurrentValue(modelId: string, metric: string): Promise<number> {
    // In real implementation, get from current data
    return 0.80 + Math.random() * 0.10;
  }

  /**
   * Calculate drift score
   */
  private calculateDriftScore(baseline: number, current: number): number {
    // Relative difference
    const diff = Math.abs(current - baseline);
    const driftScore = diff / baseline;
    return Math.min(driftScore, 1);
  }

  /**
   * Get drift recommendations
   */
  private getDriftRecommendations(metric: string, driftScore: number): string[] {
    const recommendations: string[] = [];
    
    if (driftScore > 0.15) {
      recommendations.push(`Consider investigating ${metric} trend`);
      recommendations.push(`Review recent changes in data distribution`);
    }
    if (driftScore > 0.3) {
      recommendations.push(`Schedule model retraining`);
      recommendations.push(`Check for data quality issues`);
    }
    
    return recommendations;
  }

  /**
   * Calculate spot instance cost
   */
  private calculateSpotInstanceCost(instanceType: string, hours: number): number {
    const pricing: Record<string, number> = {
      'A100': 1.50,
      'V100': 1.00,
      'T4': 0.20,
    };
    
    return (pricing[instanceType] || 0.5) * hours;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
