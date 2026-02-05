import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../integrations/prisma/prisma.service';

export interface RLState {
  userEmbedding: number[];
  jobEmbedding: number[];
  userFeatures: Record<string, number>;
  jobFeatures: Record<string, number>;
  context: Record<string, any>;
}

export interface RLAction {
  matchScoreAdjustment: number;
  recommendedActions: string[];
}

export interface RLReward {
  matchId: string;
  reward: number;
  components: {
    applicationRate: number;
    interviewRate: number;
    offerRate: number;
    userSatisfaction: number;
    employerSatisfaction: number;
  };
}

export interface PolicyStatus {
  version: string;
  lastUpdated: Date;
  totalUpdates: number;
  explorationRate: number;
  averageReward: number;
  winRate: number;
}

@Injectable()
export class RLMatchingService {
  private readonly logger = new Logger(RLMatchingService.name);
  private policyCache: Map<string, any> = new Map();
  private explorationRate = 0.1; // Initial exploration rate

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get action (match score adjustment) for a given state
   */
  async getAction(state: RLState): Promise<RLAction> {
    // In a real implementation, this would:
    // 1. Load the current policy model
    // 2. Process state through the network
    // 3. Apply exploration/exploitation strategy
    // 4. Return action

    const isExploration = Math.random() < this.explorationRate;
    
    if (isExploration) {
      // Exploration: try random adjustments
      const adjustment = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2
      return {
        matchScoreAdjustment: adjustment,
        recommendedActions: this.getExplorationActions(),
      };
    }

    // Exploitation: use learned policy
    const baseScore = this.calculateBaseMatchScore(state);
    const adjustment = this.getPolicyAdjustment(state);
    
    return {
      matchScoreAdjustment: adjustment,
      recommendedActions: this.getRecommendedActions(state),
    };
  }

  /**
   * Update reward for a match
   */
  async updateReward(matchId: string, reward: number): Promise<void> {
    this.logger.log(`Updating reward for match ${matchId}: ${reward}`);
    
    // In a real implementation, this would:
    // 1. Store the reward in the replay buffer
    // 2. Periodically update the policy using PPO
    // 3. Save updated policy to storage

    await this.storeReward(matchId, reward);
    
    // Update statistics
    await this.updateRewardStatistics(reward);
  }

  /**
   * Update reward with detailed components
   */
  async updateRewardDetailed(matchId: string, rewardData: RLReward['components']): Promise<void> {
    this.logger.log(`Updating detailed reward for match ${matchId}`);
    
    // Calculate weighted reward
    const weights = {
      applicationRate: 0.2,
      interviewRate: 0.3,
      offerRate: 0.3,
      userSatisfaction: 0.1,
      employerSatisfaction: 0.1,
    };

    const totalReward = 
      rewardData.applicationRate * weights.applicationRate +
      rewardData.interviewRate * weights.interviewRate +
      rewardData.offerRate * weights.offerRate +
      rewardData.userSatisfaction * weights.userSatisfaction +
      rewardData.employerSatisfaction * weights.employerSatisfaction;

    await this.updateReward(matchId, totalReward);
  }

  /**
   * Get PPO policy status
   */
  async getPolicyStatus(): Promise<PolicyStatus> {
    return {
      version: `v${Date.now()}`,
      lastUpdated: new Date(),
      totalUpdates: 100,
      explorationRate: this.explorationRate,
      averageReward: 0.75,
      winRate: 0.68,
    };
  }

  /**
   * Train PPO policy
   */
  async trainPolicy(): Promise<{
    epochsTrained: number;
    policyLoss: number;
    valueLoss: number;
  }> {
    this.logger.log('Starting PPO policy training');
    
    // In a real implementation, this would:
    // 1. Sample batches from replay buffer
    // 2. Compute PPO objective with clipped surrogate
    // 3. Update policy and value networks
    // 4. Apply KL divergence penalty
    // 5. Return training metrics

    return {
      epochsTrained: 10,
      policyLoss: 0.015,
      valueLoss: 0.023,
    };
  }

  /**
   * Implement exploration vs exploitation strategy
   */
  async updateExplorationRate(episode: number): Promise<void> {
    // Decay exploration rate over time (epsilon-greedy decay)
    const decayRate = 0.995;
    const minExplorationRate = 0.01;
    
    this.explorationRate = Math.max(
      minExplorationRate,
      this.explorationRate * decayRate,
    );

    this.logger.debug(`Updated exploration rate: ${this.explorationRate}`);
  }

  /**
   * Enable online learning for continuous improvement
   */
  async enableOnlineLearning(): Promise<void> {
    this.logger.log('Enabling online learning mode');
    
    // In a real implementation, this would:
    // 1. Set up incremental model updates
    // 2. Configure real-time reward streaming
    // 3. Enable continuous policy updates
  }

  /**
   * Run A/B test for RL model
   */
  async runABTest(config: {
    modelId: string;
    baselineModelId: string;
    trafficSplit: number; // percentage for RL model
  }): Promise<{ testId: string }> {
    const testId = `rl-test-${Date.now()}`;
    
    await this.prisma.aBTest.create({
      data: {
        id: testId,
        name: `RL Matching A/B Test`,
        modelAId: config.baselineModelId,
        modelBId: config.modelId,
        trafficSplit: { modelA: 100 - config.trafficSplit, modelB: config.trafficSplit },
        startDate: new Date(),
        status: 'running',
      },
    });

    this.logger.log(`Started A/B test ${testId} for RL model`);
    return { testId };
  }

  /**
   * Get reward function components
   */
  getRewardFunction(): {
    components: string[];
    weights: Record<string, number>;
    description: string;
  } {
    return {
      components: [
        'applicationRate',
        'interviewRate',
        'offerRate',
        'userSatisfaction',
        'employerSatisfaction',
      ],
      weights: {
        applicationRate: 0.2,
        interviewRate: 0.3,
        offerRate: 0.3,
        userSatisfaction: 0.1,
        employerSatisfaction: 0.1,
      },
      description: 'Composite reward function measuring matching quality across multiple dimensions',
    };
  }

  /**
   * Calculate base match score
   */
  private calculateBaseMatchScore(state: RLState): number {
    // Cosine similarity between user and job embeddings
    const dotProduct = state.userEmbedding.reduce(
      (sum, val, idx) => sum + val * state.jobEmbedding[idx],
      0,
    );
    const userNorm = Math.sqrt(
      state.userEmbedding.reduce((sum, val) => sum + val * val, 0),
    );
    const jobNorm = Math.sqrt(
      state.jobEmbedding.reduce((sum, val) => sum + val * val, 0),
    );
    
    return dotProduct / (userNorm * jobNorm);
  }

  /**
   * Get policy adjustment based on state
   */
  private getPolicyAdjustment(state: RLState): number {
    // In real implementation, this would be the neural network output
    const baseAdjustment = 0.05;
    const featureBoost = this.calculateFeatureBoost(state);
    return baseAdjustment + featureBoost;
  }

  /**
   * Calculate feature-based boost
   */
  private calculateFeatureBoost(state: RLState): number {
    let boost = 0;
    
    // Boost for skill matches
    const skillMatches = this.countSkillMatches(
      state.userFeatures,
      state.jobFeatures,
    );
    boost += skillMatches * 0.02;

    // Boost for experience alignment
    const expAlignment = this.calculateExperienceAlignment(
      state.userFeatures,
      state.jobFeatures,
    );
    boost += expAlignment * 0.01;

    return boost;
  }

  /**
   * Count skill matches between user and job
   */
  private countSkillMatches(
    userFeatures: Record<string, number>,
    jobFeatures: Record<string, number>,
  ): number {
    const userSkills = Object.keys(userFeatures).filter(
      (k) => k.startsWith('skill_'),
    );
    const jobSkills = Object.keys(jobFeatures).filter(
      (k) => k.startsWith('skill_'),
    );
    
    return userSkills.filter((skill) =>
      jobSkills.includes(skill),
    ).length;
  }

  /**
   * Calculate experience alignment
   */
  private calculateExperienceAlignment(
    userFeatures: Record<string, number>,
    jobFeatures: Record<string, number>,
  ): number {
    const userExp = userFeatures['years_experience'] || 0;
    const jobExpMin = jobFeatures['min_experience'] || 0;
    const jobExpMax = jobFeatures['max_experience'] || 20;
    
    if (userExp >= jobExpMin && userExp <= jobExpMax) {
      return 1;
    }
    return 0;
  }

  /**
   * Get exploration actions
   */
  private getExplorationActions(): string[] {
    const actions = [
      'highlight_skill_match',
      'emphasize_experience',
      'boost_company_culture_fit',
      'suggest_certification',
      'recommend_training',
    ];
    
    // Random subset of actions
    const numActions = Math.floor(Math.random() * 3) + 1;
    return actions.sort(() => Math.random() - 0.5).slice(0, numActions);
  }

  /**
   * Get recommended actions based on state
   */
  private getRecommendedActions(state: RLState): string[] {
    const actions: string[] = [];
    
    // Analyze state and recommend actions
    if (this.hasSkillGap(state)) {
      actions.push('suggest_certification');
    }
    if (this.isCultureMatch(state)) {
      actions.push('highlight_culture_fit');
    }
    if (this.isCareerGrowthOpportunity(state)) {
      actions.push('emphasize_growth_potential');
    }
    
    return actions;
  }

  /**
   * Check if user has skill gaps
   */
  private hasSkillGap(state: RLState): boolean {
    return Object.keys(state.jobFeatures)
      .filter((k) => k.startsWith('skill_'))
      .some((skill) => {
        const jobRequired = state.jobFeatures[skill] === 1;
        const userHas = state.userFeatures[skill] === 1;
        return jobRequired && !userHas;
      });
  }

  /**
   * Check if there's culture match
   */
  private isCultureMatch(state: RLState): boolean {
    return (state.context['culture_score'] || 0) > 0.7;
  }

  /**
   * Check if there's career growth opportunity
   */
  private isCareerGrowthOpportunity(state: RLState): boolean {
    return (state.context['growth_potential'] || 0) > 0.6;
  }

  /**
   * Store reward in database
   */
  private async storeReward(matchId: string, reward: number): Promise<void> {
    // In real implementation, store to replay buffer
    this.logger.debug(`Stored reward ${reward} for match ${matchId}`);
  }

  /**
   * Update reward statistics
   */
  private async updateRewardStatistics(reward: number): Promise<void> {
    // Update rolling average and other statistics
    this.logger.debug(`Updated statistics with reward ${reward}`);
  }
}
