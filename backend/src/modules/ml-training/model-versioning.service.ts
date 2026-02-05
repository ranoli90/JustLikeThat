import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../integrations/prisma/prisma.service';

export interface ModelInfo {
  id: string;
  name: string;
  type: string;
  version: string;
  status: string;
  baseModel: string;
  metrics: Record<string, any>;
  createdAt: Date;
  deployedAt?: Date;
}

export interface ModelRegistration {
  modelId: string;
  version: string;
  modelPath: string;
  metadata: Record<string, any>;
}

@Injectable()
export class ModelVersioningService {
  private readonly logger = new Logger(ModelVersioningService.name);
  private modelCache: Map<string, ModelInfo> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all models
   */
  async getModels(type?: string): Promise<ModelInfo[]> {
    const where = type ? { type: type as any } : {};
    
    const models = await this.prisma.mLModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    return models.map((model) => ({
      id: model.id,
      name: model.name,
      type: model.type,
      version: model.version,
      status: model.status,
      baseModel: model.baseModel,
      metrics: model.metrics as Record<string, any>,
      createdAt: model.createdAt,
      deployedAt: model.deployedAt || undefined,
    }));
  }

  /**
   * Create a new model
   */
  async createModel(data: {
    name: string;
    type: string;
    baseModel: string;
    hyperparameters?: Record<string, any>;
  }): Promise<ModelInfo> {
    const model = await this.prisma.mLModel.create({
      data: {
        name: data.name,
        type: data.type as any,
        version: 'v1.0.0',
        status: 'training',
        baseModel: data.baseModel,
        hyperparameters: data.hyperparameters || {},
      },
    });

    // Create initial version
    await this.prisma.modelVersion.create({
      data: {
        modelId: model.id,
        version: 'v1.0.0',
        description: 'Initial model version',
        isActive: true,
      },
    });

    this.logger.log(`Created new model: ${model.id}`);
    return {
      id: model.id,
      name: model.name,
      type: model.type,
      version: model.version,
      status: model.status,
      baseModel: model.baseModel,
      metrics: {},
      createdAt: model.createdAt,
    };
  }

  /**
   * Get model by ID
   */
  async getModelById(id: string): Promise<ModelInfo | null> {
    const model = await this.prisma.mLModel.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        trainingJobs: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!model) return null;

    return {
      id: model.id,
      name: model.name,
      type: model.type,
      version: model.version,
      status: model.status,
      baseModel: model.baseModel,
      metrics: (model.metrics as Record<string, any>) || {},
      createdAt: model.createdAt,
      deployedAt: model.deployedAt || undefined,
    };
  }

  /**
   * Update model
   */
  async updateModel(id: string, data: Partial<{
    name: string;
    hyperparameters: Record<string, any>;
  }>): Promise<ModelInfo> {
    const model = await this.prisma.mLModel.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.hyperparameters && { hyperparameters: data.hyperparameters }),
      },
    });

    return {
      id: model.id,
      name: model.name,
      type: model.type,
      version: model.version,
      status: model.status,
      baseModel: model.baseModel,
      metrics: {},
      createdAt: model.createdAt,
    };
  }

  /**
   * Delete model
   */
  async deleteModel(id: string): Promise<void> {
    await this.prisma.mLModel.delete({ where: { id } });
    this.logger.log(`Deleted model: ${id}`);
  }

  /**
   * Get A/B tests
   */
  async getABTests(): Promise<any[]> {
    return this.prisma.aBTest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create A/B test
   */
  async createABTest(data: {
    name: string;
    modelAId: string;
    modelBId: string;
    trafficSplit: { modelA: number; modelB: number };
  }): Promise<any> {
    const test = await this.prisma.aBTest.create({
      data: {
        name: data.name,
        modelAId: data.modelAId,
        modelBId: data.modelBId,
        trafficSplit: data.trafficSplit as any,
        startDate: new Date(),
        status: 'running',
      },
    });

    this.logger.log(`Created A/B test: ${test.id}`);
    return test;
  }

  /**
   * Get A/B test by ID
   */
  async getABTestById(id: string): Promise<any> {
    return this.prisma.aBTest.findUnique({ where: { id } });
  }

  /**
   * Stop A/B test
   */
  async stopABTest(id: string): Promise<any> {
    const test = await this.prisma.aBTest.update({
      where: { id },
      data: {
        status: 'stopped',
        endDate: new Date(),
      },
    });

    // Determine winner
    const results = test.results as Record<string, any>;
    if (results) {
      const winner = results.modelAWinRate > results.modelBWinRate ? 'modelA' : 'modelB';
      await this.prisma.aBTest.update({
        where: { id },
        data: { winner },
      });
    }

    return test;
  }

  /**
   * Deploy model to production
   */
  async deployModel(modelId: string, version: string): Promise<{
    deploymentId: string;
    endpoint: string;
  }> {
    const deploymentId = `deploy-${Date.now()}`;
    const endpoint = `https://api.example.com/v1/models/${modelId}/${version}`;

    // Update model status
    await this.prisma.mLModel.update({
      where: { id: modelId },
      data: {
        status: 'ready',
        deployedAt: new Date(),
      },
    });

    // Deactivate other versions
    await this.prisma.modelVersion.updateMany({
      where: { modelId, isActive: true },
      data: { isActive: false },
    });

    // Activate target version
    await this.prisma.modelVersion.updateMany({
      where: { modelId, version },
      data: { isActive: true, deployedAt: new Date() },
    });

    this.logger.log(`Deployed model ${modelId} version ${version}`);
    return { deploymentId, endpoint };
  }

  /**
   * Rollback model to previous version
   */
  async rollbackModel(modelId: string, targetVersion: string): Promise<{
    success: boolean;
    rolledBackTo: string;
  }> {
    // Find the target version
    const version = await this.prisma.modelVersion.findFirst({
      where: { modelId, version: targetVersion },
    });

    if (!version) {
      throw new Error(`Version ${targetVersion} not found for model ${modelId}`);
    }

    // Deactivate current active version
    await this.prisma.modelVersion.updateMany({
      where: { modelId, isActive: true },
      data: { isActive: false, deprecatedAt: new Date() },
    });

    // Activate target version
    await this.prisma.modelVersion.update({
      where: { id: version.id },
      data: { isActive: true, deployedAt: new Date() },
    });

    this.logger.log(`Rolled back model ${modelId} to version ${targetVersion}`);
    return {
      success: true,
      rolledBackTo: targetVersion,
    };
  }

  /**
   * Get registered models
   */
  async getRegisteredModels(): Promise<{
    models: Array<{
      id: string;
      name: string;
      version: string;
      status: string;
      lastUsed?: Date;
    }>;
  }> {
    const models = await this.prisma.mLModel.findMany({
      where: { status: 'ready' },
      orderBy: { deployedAt: 'desc' },
    });

    return {
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        version: model.version,
        status: model.status,
        lastUsed: model.deployedAt || undefined,
      })),
    };
  }

  /**
   * Register model version
   */
  async registerModelVersion(data: ModelRegistration): Promise<any> {
    const version = await this.prisma.modelVersion.create({
      data: {
        modelId: data.modelId,
        version: data.version,
        description: `Registered from ${data.modelPath}`,
        metrics: data.metadata,
        isActive: false,
      },
    });

    this.logger.log(`Registered version ${data.version} for model ${data.modelId}`);
    return version;
  }

  /**
   * Get model lineage
   */
  async getModelLineage(modelId: string): Promise<{
    currentVersion: string;
    versions: Array<{
      version: string;
      createdAt: Date;
      metrics: Record<string, any>;
      parentVersion?: string;
    }>;
  }> {
    const versions = await this.prisma.modelVersion.findMany({
      where: { modelId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      currentVersion: versions[versions.length - 1]?.version || 'v1.0.0',
      versions: versions.map((v) => ({
        version: v.version,
        createdAt: v.createdAt,
        metrics: (v.metrics as Record<string, any>) || {},
      })),
    };
  }

  /**
   * Track model performance by version
   */
  async trackVersionPerformance(modelId: string, version: string, metrics: Record<string, any>): Promise<void> {
    this.logger.debug(`Tracking performance for model ${modelId} version ${version}`);
    // In real implementation, store performance metrics in time-series database
  }

  /**
   * Canary deployment support
   */
  async startCanaryDeployment(
    modelId: string,
    version: string,
    trafficPercentage: number,
  ): Promise<{
    canaryId: string;
    trafficSplit: { stable: number; canary: number };
  }> {
    const canaryId = `canary-${Date.now()}`;
    
    // Update A/B test for canary
    await this.prisma.aBTest.create({
      data: {
        id: canaryId,
        name: `Canary Deployment - ${modelId}`,
        modelAId: modelId, // stable
        modelBId: `${modelId}-${version}`, // canary
        trafficSplit: { stable: 100 - trafficPercentage, canary: trafficPercentage },
        startDate: new Date(),
        status: 'running',
      },
    });

    return {
      canaryId,
      trafficSplit: {
        stable: 100 - trafficPercentage,
        canary: trafficPercentage,
      },
    };
  }
}
