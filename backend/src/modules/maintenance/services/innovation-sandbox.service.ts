// Innovation Sandbox Service - Sprint 48
// Implements feature testing, A/B testing framework, and feature flags

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InnovationExperiment,
  FeatureFlag,
  ExperimentParticipant,
  UserFeedback,
} from '../entities/innovation-sandbox.entity';

export interface CreateExperimentDto {
  name: string;
  description: string;
  hypothesis: string;
  featureFlagKey: string;
  metrics: Record<string, any>;
}

export interface CreateFeatureFlagDto {
  key: string;
  name: string;
  description: string;
  rolloutPercentage?: number;
  targeting?: Record<string, any>;
}

export interface ABMetrics {
  controlConversion: number;
  treatmentAConversion: number;
  treatmentBConversion?: number;
  confidenceLevel: number;
  statisticallySignificant: boolean;
  winner?: 'control' | 'treatment_a' | 'treatment_b';
}

@Injectable()
export class InnovationSandboxService {
  private readonly logger = new Logger(InnovationSandboxService.name);

  constructor(
    @InjectRepository(InnovationExperiment)
    private readonly experimentRepository: Repository<InnovationExperiment>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(ExperimentParticipant)
    private readonly participantRepository: Repository<ExperimentParticipant>,
    @InjectRepository(UserFeedback)
    private readonly feedbackRepository: Repository<UserFeedback>,
  ) {}

  // ==================== EXPERIMENTS ====================

  async createExperiment(data: CreateExperimentDto): Promise<InnovationExperiment> {
    this.logger.log(`Creating experiment: ${data.name}`);
    
    const experiment = this.experimentRepository.create({
      name: data.name,
      description: data.description,
      hypothesis: data.hypothesis,
      featureFlagKey: data.featureFlagKey,
      metrics: data.metrics,
      status: 'draft',
    });

    return this.experimentRepository.save(experiment);
  }

  async getAllExperiments(status?: string): Promise<InnovationExperiment[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.experimentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getExperimentById(id: string): Promise<InnovationExperiment | null> {
    return this.experimentRepository.findOne({ where: { id } });
  }

  async updateExperiment(id: string, data: Partial<CreateExperimentDto>): Promise<InnovationExperiment | null> {
    await this.experimentRepository.update(id, data);
    return this.getExperimentById(id);
  }

  async startExperiment(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Starting experiment: ${id}`);
    
    const experiment = await this.getExperimentById(id);
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    // Enable the feature flag
    await this.enableFeatureFlag(experiment.featureFlagKey);

    await this.experimentRepository.update(id, {
      status: 'running',
      startDate: new Date(),
    });

    return {
      success: true,
      message: `Experiment ${experiment.name} started`,
    };
  }

  async pauseExperiment(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Pausing experiment: ${id}`);
    
    const experiment = await this.getExperimentById(id);
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    await this.experimentRepository.update(id, {
      status: 'paused',
    });

    return {
      success: true,
      message: `Experiment ${experiment.name} paused`,
    };
  }

  async stopExperiment(id: string, results?: Record<string, any>): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Stopping experiment: ${id}`);
    
    const experiment = await this.getExperimentById(id);
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    await this.experimentRepository.update(id, {
      status: 'completed',
      endDate: new Date(),
      results: results || {},
    });

    return {
      success: true,
      message: `Experiment ${experiment.name} completed`,
    };
  }

  async cancelExperiment(id: string): Promise<{ success: boolean; message: string }> {
    await this.experimentRepository.update(id, {
      status: 'cancelled',
      endDate: new Date(),
    });

    return {
      success: true,
      message: `Experiment ${id} cancelled`,
    };
  }

  // ==================== A/B TESTING ====================

  async assignVariant(experimentId: string, userId: string): Promise<string> {
    const experiment = await this.getExperimentById(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return 'control';
    }

    // Check if user is already assigned
    const existing = await this.participantRepository.findOne({
      where: { experimentId, userId },
    });

    if (existing) {
      return existing.variant;
    }

    // Random assignment (50/50 split for A/B, 33/33/33 for A/B/C)
    const variants = ['control', 'treatment_a', 'treatment_b'];
    const variant = variants[Math.floor(Math.random() * 2)]; // A/B test

    await this.participantRepository.save({
      experimentId,
      userId,
      variant,
    });

    return variant;
  }

  async getExperimentResults(id: string): Promise<ABMetrics> {
    const participants = await this.participantRepository.find({
      where: { experimentId: id },
    });

    const controlParticipants = participants.filter(p => p.variant === 'control');
    const treatmentAParticipants = participants.filter(p => p.variant === 'treatment_a');
    const treatmentBParticipants = participants.filter(p => p.variant === 'treatment_b');

    // Mock conversion rates
    return {
      controlConversion: 12.5,
      treatmentAConversion: 15.2,
      treatmentBConversion: 14.8,
      confidenceLevel: 95.5,
      statisticallySignificant: true,
      winner: 'treatment_a',
    };
  }

  async trackConversion(experimentId: string, userId: string, value?: number): Promise<void> {
    this.logger.log(`Tracking conversion for experiment ${experimentId}, user ${userId}`);
    // In production, this would record conversion events
  }

  // ==================== FEATURE FLAGS ====================

  async createFeatureFlag(data: CreateFeatureFlagDto): Promise<FeatureFlag> {
    this.logger.log(`Creating feature flag: ${data.key}`);
    
    const flag = this.featureFlagRepository.create({
      key: data.key,
      name: data.name,
      description: data.description,
      rolloutPercentage: data.rolloutPercentage || 0,
      targeting: data.targeting,
      isEnabled: false,
    });

    return this.featureFlagRepository.save(flag);
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getFeatureFlagById(id: string): Promise<FeatureFlag | null> {
    return this.featureFlagRepository.findOne({ where: { id } });
  }

  async getFeatureFlagByKey(key: string): Promise<FeatureFlag | null> {
    return this.featureFlagRepository.findOne({ where: { key } });
  }

  async updateFeatureFlag(id: string, data: Partial<CreateFeatureFlagDto>): Promise<FeatureFlag | null> {
    await this.featureFlagRepository.update(id, data);
    return this.getFeatureFlagById(id);
  }

  async toggleFeatureFlag(id: string): Promise<FeatureFlag | null> {
    const flag = await this.getFeatureFlagById(id);
    if (!flag) return null;

    await this.featureFlagRepository.update(id, {
      isEnabled: !flag.isEnabled,
    });

    return this.getFeatureFlagById(id);
  }

  async enableFeatureFlag(key: string): Promise<void> {
    await this.featureFlagRepository.update(
      { key },
      { isEnabled: true },
    );
  }

  async disableFeatureFlag(key: string): Promise<void> {
    await this.featureFlagRepository.update(
      { key },
      { isEnabled: false },
    );
  }

  async isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
    const flag = await this.getFeatureFlagByKey(key);
    if (!flag) return false;

    if (!flag.isEnabled) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(userId || 'anonymous');
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  async setRolloutPercentage(id: string, percentage: number): Promise<FeatureFlag | null> {
    await this.featureFlagRepository.update(id, {
      rolloutPercentage: percentage,
    });

    return this.getFeatureFlagById(id);
  }

  async setTargetingRules(id: string, targeting: Record<string, any>): Promise<FeatureFlag | null> {
    await this.featureFlagRepository.update(id, {
      targeting,
    });

    return this.getFeatureFlagById(id);
  }

  // ==================== USER FEEDBACK ====================

  async collectFeedback(data: {
    experimentId?: string;
    featureFlagKey?: string;
    userId: string;
    feedback: string;
    rating?: number;
    metadata?: Record<string, any>;
  }): Promise<UserFeedback> {
    this.logger.log(`Collecting feedback from user: ${data.userId}`);
    
    const feedback = this.feedbackRepository.create({
      experimentId: data.experimentId,
      featureFlagKey: data.featureFlagKey,
      userId: data.userId,
      feedback: data.feedback,
      rating: data.rating,
      metadata: data.metadata,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getFeedback(filters?: {
    experimentId?: string;
    featureFlagKey?: string;
    minRating?: number;
  }): Promise<UserFeedback[]> {
    const where: any = {};
    if (filters?.experimentId) where.experimentId = filters.experimentId;
    if (filters?.featureFlagKey) where.featureFlagKey = filters.featureFlagKey;

    return this.feedbackRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getFeedbackSummary(experimentId?: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    sentimentBreakdown: { positive: number; neutral: number; negative: number };
    topThemes: string[];
  }> {
    // Mock feedback analysis
    return {
      averageRating: 4.2,
      totalFeedback: 156,
      sentimentBreakdown: {
        positive: 89,
        neutral: 45,
        negative: 22,
      },
      topThemes: [
        'Easy to use',
        'Faster workflow',
        'Good onboarding',
        'Needs better documentation',
      ],
    };
  }

  // ==================== SANDBOX MANAGEMENT ====================

  async getSandboxEnvironments(): Promise<Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'provisioning';
    features: string[];
    createdAt: Date;
  }>> {
    return [
      {
        id: 'sandbox-1',
        name: 'Feature Testing',
        status: 'active',
        features: ['A/B Testing', 'Feature Flags', 'User Feedback'],
        createdAt: new Date(),
      },
      {
        id: 'sandbox-2',
        name: 'Performance Testing',
        status: 'active',
        features: ['Load Testing', 'Stress Testing'],
        createdAt: new Date(),
      },
      {
        id: 'sandbox-3',
        name: 'Security Testing',
        status: 'active',
        features: ['Vulnerability Scanning', 'Penetration Testing'],
        createdAt: new Date(),
      },
    ];
  }

  // ==================== HELPER METHODS ====================

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
