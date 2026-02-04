import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../../entities/config.entity';

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'local';
export type ModelTier = 'economy' | 'standard' | 'premium';

export interface ModelConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  tier: ModelTier;
  contextWindow: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  maxTokens: number;
  capabilities: string[];
  speed: 'slow' | 'medium' | 'fast';
  quality: 'low' | 'medium' | 'high' | 'very-high';
}

export interface CostEstimate {
  modelId: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  breakdown: {
    inputCost: number;
    outputCost: number;
  };
}

export interface CachedResponse {
  key: string;
  response: string;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  costSaved: number;
}

export interface BatchRequest {
  id: string;
  items: BatchItem[];
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCost: number;
}

export interface BatchItem {
  id: string;
  prompt: string;
  priority: number;
  metadata?: Record<string, any>;
}

export interface OptimizationStrategy {
  useCache: boolean;
  useBatching: boolean;
  preferredTier: ModelTier;
  fallbackModels: string[];
  maxCostPerRequest: number;
  qualityThreshold: number;
}

@Injectable()
export class LLMOptimizationService {
  private readonly logger = new Logger(LLMOptimizationService.name);
  
  // Model configurations with pricing (as of 2024)
  private models: Map<string, ModelConfig> = new Map();
  
  // Cache for responses
  private responseCache: Map<string, CachedResponse> = new Map();
  
  // Batch processing queues
  private batchQueues: Map<string, BatchRequest> = new Map();
  
  // Cost tracking
  private totalCostToday: number = 0;
  private dailyBudget: number = 100; // Default $100/day
  private cacheHitRate: number = 0;
  private totalRequests: number = 0;

  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
  ) {
    this.initializeModels();
    this.loadCostSettings();
  }

  private initializeModels(): void {
    // Economy models (cheapest, faster)
    this.models.set('gpt-3.5-turbo', {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      tier: 'economy',
      contextWindow: 16385,
      inputCostPer1kTokens: 0.0005,
      outputCostPer1kTokens: 0.0015,
      maxTokens: 4096,
      capabilities: ['text-generation', 'summarization', 'basic-analysis'],
      speed: 'fast',
      quality: 'medium',
    });

    this.models.set('claude-haiku', {
      id: 'claude-haiku',
      name: 'Claude Haiku',
      provider: 'anthropic',
      tier: 'economy',
      contextWindow: 200000,
      inputCostPer1kTokens: 0.00025,
      outputCostPer1kTokens: 0.00125,
      maxTokens: 4096,
      capabilities: ['text-generation', 'summarization', 'fast-responses'],
      speed: 'fast',
      quality: 'medium',
    });

    // Standard models (balanced cost/quality)
    this.models.set('gpt-4-turbo', {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      tier: 'standard',
      contextWindow: 128000,
      inputCostPer1kTokens: 0.01,
      outputCostPer1kTokens: 0.03,
      maxTokens: 4096,
      capabilities: ['text-generation', 'advanced-analysis', 'code-generation', 'reasoning'],
      speed: 'medium',
      quality: 'high',
    });

    this.models.set('claude-sonnet', {
      id: 'claude-sonnet',
      name: 'Claude Sonnet',
      provider: 'anthropic',
      tier: 'standard',
      contextWindow: 200000,
      inputCostPer1kTokens: 0.003,
      outputCostPer1kTokens: 0.015,
      maxTokens: 4096,
      capabilities: ['text-generation', 'advanced-analysis', 'nuanced-writing'],
      speed: 'medium',
      quality: 'high',
    });

    // Premium models (highest quality)
    this.models.set('gpt-4o', {
      id: 'gpt-4o',
      name: 'GPT-4 Omni',
      provider: 'openai',
      tier: 'premium',
      contextWindow: 128000,
      inputCostPer1kTokens: 0.005,
      outputCostPer1kTokens: 0.015,
      maxTokens: 16384,
      capabilities: ['text-generation', 'advanced-analysis', 'multimodal', 'reasoning'],
      speed: 'fast',
      quality: 'very-high',
    });

    this.models.set('claude-opus', {
      id: 'claude-opus',
      name: 'Claude Opus',
      provider: 'anthropic',
      tier: 'premium',
      contextWindow: 200000,
      inputCostPer1kTokens: 0.015,
      outputCostPer1kTokens: 0.075,
      maxTokens: 4096,
      capabilities: ['text-generation', 'advanced-reasoning', 'complex-analysis', 'writing'],
      speed: 'slow',
      quality: 'very-high',
    });
  }

  private async loadCostSettings(): Promise<void> {
    try {
      const budgetConfig = await this.configRepository.findOne({
        where: { key: 'llm_daily_budget' },
      });
      if (budgetConfig) {
        this.dailyBudget = parseFloat(budgetConfig.value);
      }
    } catch (error) {
      this.logger.warn('Could not load LLM cost settings, using defaults');
    }
  }

  /**
   * Selects the optimal model based on task requirements and cost constraints
   */
  selectOptimalModel(
    taskType: string,
    requiredCapabilities: string[],
    qualityRequirement: number, // 0-1 scale
    costConstraint?: number,
  ): ModelConfig {
    let suitableModels = Array.from(this.models.values());

    // Filter by required capabilities
    suitableModels = suitableModels.filter(model =>
      requiredCapabilities.every(cap => model.capabilities.includes(cap))
    );

    // Filter by quality requirement
    const qualityScores: Record<string, number> = {
      'low': 0.3, 'medium': 0.6, 'high': 0.8, 'very-high': 1.0
    };
    
    suitableModels = suitableModels.filter(model =>
      qualityScores[model.quality] >= qualityRequirement
    );

    // If cost constraint exists, filter by it
    if (costConstraint) {
      suitableModels = suitableModels.filter(model => {
        const estimate = this.estimateCost(model.id, 1000, 500);
        return estimate.estimatedCost <= costConstraint;
      });
    }

    // Sort by cost (cheapest first)
    suitableModels.sort((a, b) => {
      const costA = this.estimateCost(a.id, 1000, 500).estimatedCost;
      const costB = this.estimateCost(b.id, 1000, 500).estimatedCost;
      return costA - costB;
    });

    // Return cheapest suitable model
    return suitableModels[0] || this.models.get('gpt-3.5-turbo')!;
  }

  /**
   * Estimates the cost for a given model and token usage
   */
  estimateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): CostEstimate {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const inputCost = (inputTokens / 1000) * model.inputCostPer1kTokens;
    const outputCost = (outputTokens / 1000) * model.outputCostPer1kTokens;
    const totalCost = inputCost + outputCost;

    return {
      modelId,
      estimatedInputTokens: inputTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCost: totalCost,
      breakdown: {
        inputCost,
        outputCost,
      },
    };
  }

  /**
   * Gets a cached response if available
   */
  getCachedResponse(prompt: string, context?: string): CachedResponse | null {
    const cacheKey = this.generateCacheKey(prompt, context);
    const cached = this.responseCache.get(cacheKey);
    
    if (cached && cached.expiresAt > new Date()) {
      cached.hitCount++;
      return cached;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Caches a response for future use
   */
  cacheResponse(
    prompt: string,
    response: string,
    context: string | undefined,
    ttlMinutes: number = 60,
    estimatedOriginalCost: number = 0,
  ): CachedResponse {
    const cacheKey = this.generateCacheKey(prompt, context);
    const cached: CachedResponse = {
      key: cacheKey,
      response,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      hitCount: 0,
      costSaved: estimatedOriginalCost,
    };
    
    this.responseCache.set(cacheKey, cached);
    return cached;
  }

  /**
   * Adds an item to a batch for processing
   */
  async addToBatch(
    batchId: string,
    item: BatchItem,
    priority: number = 5,
  ): Promise<BatchRequest> {
    let batch = this.batchQueues.get(batchId);
    
    if (!batch) {
      batch = {
        id: batchId,
        items: [],
        createdAt: new Date(),
        status: 'pending',
        totalCost: 0,
      };
      this.batchQueues.set(batchId, batch);
    }
    
    batch.items.push({ ...item, priority });
    
    // Sort by priority (lower = higher priority)
    batch.items.sort((a, b) => a.priority - b.priority);
    
    return batch;
  }

  /**
   * Processes a batch and returns results
   */
  async processBatch(
    batchId: string,
    modelId: string = 'gpt-4-turbo',
  ): Promise<{ results: Map<string, string>; totalCost: number }> {
    const batch = this.batchQueues.get(batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    batch.status = 'processing';
    
    const results = new Map<string, string>();
    let batchTotalCost = 0;

    // Group similar prompts for better batching efficiency
    const groupedItems = this.groupSimilarPrompts(batch.items);
    
    for (const group of groupedItems) {
      const combinedPrompt = group.prompts.join('\n\n---\n\n');
      const result = await this.processWithModel(modelId, combinedPrompt);
      
      // Distribute result to items
      group.itemIds.forEach(id => {
        results.set(id, result);
      });
      
      // Calculate cost for this group
      const cost = this.estimateCost(modelId, group.totalInputTokens, group.totalOutputTokens);
      batchTotalCost += cost.estimatedCost;
    }

    batch.totalCost = batchTotalCost;
    batch.status = 'completed';
    this.totalCostToday += batchTotalCost;

    return { results, totalCost: batchTotalCost };
  }

  /**
   * Gets the current cost statistics
   */
  getCostStatistics(): {
    totalCostToday: number;
    dailyBudget: number;
    budgetUsed: number;
    cacheHitRate: number;
    totalRequests: number;
    topModelsByUsage: { modelId: string; requestCount: number; totalCost: number }[];
  } {
    return {
      totalCostToday: this.totalCostToday,
      dailyBudget: this.dailyBudget,
      budgetUsed: (this.totalCostToday / this.dailyBudget) * 100,
      cacheHitRate: this.cacheHitRate,
      totalRequests: this.totalRequests,
      topModelsByUsage: this.getTopModelsByUsage(),
    };
  }

  /**
   * Clears the response cache
   */
  clearCache(olderThanMinutes?: number): number {
    const cutoff = olderThanMinutes 
      ? new Date(Date.now() - olderThanMinutes * 60 * 1000)
      : new Date(0);
    
    let removedCount = 0;
    
    for (const [key, entry] of this.responseCache.entries()) {
      if (entry.createdAt < cutoff) {
        this.responseCache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  /**
   * Gets all available models
   */
  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Gets models by tier
   */
  getModelsByTier(tier: ModelTier): ModelConfig[] {
    return Array.from(this.models.values()).filter(m => m.tier === tier);
  }

  /**
   * Generates an optimization strategy for a given task
   */
  getOptimizationStrategy(taskType: string): OptimizationStrategy {
    const strategies: Record<string, OptimizationStrategy> = {
      'cover-letter-generation': {
        useCache: true,
        useBatching: true,
        preferredTier: 'economy',
        fallbackModels: ['gpt-3.5-turbo', 'claude-haiku'],
        maxCostPerRequest: 0.01,
        qualityThreshold: 0.7,
      },
      'resume-tailoring': {
        useCache: true,
        useBatching: true,
        preferredTier: 'standard',
        fallbackModels: ['gpt-4-turbo', 'claude-sonnet'],
        maxCostPerRequest: 0.05,
        qualityThreshold: 0.8,
      },
      'ats-optimization': {
        useCache: true,
        useBatching: false,
        preferredTier: 'standard',
        fallbackModels: ['gpt-4-turbo', 'gpt-4o'],
        maxCostPerRequest: 0.03,
        qualityThreshold: 0.85,
      },
      'keyword-optimization': {
        useCache: true,
        useBatching: true,
        preferredTier: 'economy',
        fallbackModels: ['gpt-3.5-turbo'],
        maxCostPerRequest: 0.005,
        qualityThreshold: 0.6,
      },
      'quality-scoring': {
        useCache: false,
        useBatching: true,
        preferredTier: 'standard',
        fallbackModels: ['gpt-4-turbo', 'claude-sonnet'],
        maxCostPerRequest: 0.02,
        qualityThreshold: 0.75,
      },
    };

    return strategies[taskType] || strategies['resume-tailoring'];
  }

  // Private helper methods

  private generateCacheKey(prompt: string, context?: string): string {
    const crypto = require('crypto');
    const content = `${prompt}${context || ''}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private groupSimilarPrompts(items: BatchItem[]): {
    prompts: string[];
    itemIds: string[];
    totalInputTokens: number;
    totalOutputTokens: number;
  }[] {
    // Simple grouping: combine all items into one batch for now
    // In production, you would use semantic similarity to group related items
    return [{
      prompts: items.map(i => i.prompt),
      itemIds: items.map(i => i.id),
      totalInputTokens: items.reduce((sum, i) => sum + i.prompt.length / 4, 0),
      totalOutputTokens: items.length * 500,
    }];
  }

  private async processWithModel(modelId: string, prompt: string): Promise<string> {
    // In production, this would call the actual LLM API
    // For now, return a placeholder
    this.totalRequests++;
    return `[Generated by ${modelId}]: ${prompt.substring(0, 100)}...`;
  }

  private getTopModelsByUsage(): { modelId: string; requestCount: number; totalCost: number }[] {
    // Placeholder - in production, track actual usage
    return [];
  }

  /**
   * Checks if we should proceed with an LLM call based on budget
   */
  canAffordRequest(estimatedCost: number): boolean {
    return (this.totalCostToday + estimatedCost) <= this.dailyBudget;
  }

  /**
   * Gets cost recommendations for optimization
   */
  getCostRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.cacheHitRate < 0.3) {
      recommendations.push('Consider increasing cache TTL to improve hit rate');
    }
    
    if (this.totalCostToday > this.dailyBudget * 0.8) {
      recommendations.push('Approaching daily budget limit - consider switching to economy models');
    }
    
    const topModels = this.getTopModelsByUsage();
    const premiumUsage = topModels
      .filter(m => this.models.get(m.modelId)?.tier === 'premium')
      .reduce((sum, m) => sum + m.totalCost, 0);
    
    if (premiumUsage / this.totalCostToday > 0.5) {
      recommendations.push('High premium model usage - consider using standard models for non-critical tasks');
    }
    
    return recommendations;
  }
}
