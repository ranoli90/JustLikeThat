import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ML Infrastructure Service - Base infrastructure for ML model serving
 * Provides model loading, caching, and performance monitoring
 */
@Injectable()
export class MLInfrastructureService implements OnModuleInit {
  private readonly logger = new Logger(MLInfrastructureService.name);
  private modelCache: Map<string, any> = new Map();
  private inferenceStats: Map<string, { count: number; totalTime: number }> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.initializeModelCache();
  }

  /**
   * Initialize model cache with deployed models
   */
  private async initializeModelCache(): Promise<void> {
    try {
      const activeModels = await this.prisma.mLModelVersion.findMany({
        where: { isActive: true },
      });

      for (const model of activeModels) {
        this.logger.log(`Loaded model: ${model.modelType} v${model.version}`);
        this.modelCache.set(`${model.modelType}`, {
          version: model.version,
          accuracy: model.accuracy,
          path: model.modelPath,
          loadedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.warn('Could not load models from database, using fallback implementations');
    }
  }

  /**
   * Get or create a model from cache
   */
  async getModel(modelType: string): Promise<any> {
    const cached = this.modelCache.get(modelType);
    if (cached) {
      return cached;
    }

    // Load from database if not in cache
    const modelVersion = await this.prisma.mLModelVersion.findFirst({
      where: { modelType: modelType as any, isActive: true },
    });

    if (modelVersion) {
      const model = {
        version: modelVersion.version,
        accuracy: modelVersion.accuracy,
        path: modelVersion.modelPath,
        loadedAt: new Date(),
      };
      this.modelCache.set(modelType, model);
      return model;
    }

    return null;
  }

  /**
   * Record inference statistics
   */
  recordInference(modelType: string, duration: number): void {
    const stats = this.inferenceStats.get(modelType) || { count: 0, totalTime: 0 };
    stats.count += 1;
    stats.totalTime += duration;
    this.inferenceStats.set(modelType, stats);
  }

  /**
   * Get inference statistics
   */
  getInferenceStats(): Record<string, { count: number; avgTime: number }> {
    const result: Record<string, { count: number; avgTime: number }> = {};
    for (const [modelType, stats] of this.inferenceStats) {
      result[modelType] = {
        count: stats.count,
        avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
      };
    }
    return result;
  }

  /**
   * Get embedding for text using OpenAI embeddings API
   */
  async getEmbedding(text: string): Promise<number[]> {
    const startTime = Date.now();
    
    try {
      // This will be implemented with OpenAI embeddings
      const mockEmbedding = this.generateMockEmbedding(text);
      const duration = Date.now() - startTime;
      this.recordInference('EMBEDDING', duration);
      
      return mockEmbedding;
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate mock 768-dimensional embedding for development
   * In production, this would use OpenAI text-embedding-3-small
   */
  private generateMockEmbedding(text: string): number[] {
    const embedding: number[] = [];
    const seed = this.hashString(text);
    
    for (let i = 0; i < 768; i++) {
      const pseudoRandom = Math.sin(seed + i) * 10000;
      embedding.push((pseudoRandom - Math.floor(pseudoRandom)) * 2 - 1);
    }
    
    // Normalize embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple string hash for deterministic pseudo-random generation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate Euclidean distance between two embeddings
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(sum);
  }
}
