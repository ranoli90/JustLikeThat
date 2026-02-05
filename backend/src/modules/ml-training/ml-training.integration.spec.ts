import { Test, TestingModule } from '@nestjs/testing';
import { MlTrainingController } from './ml-training.controller';
import { LLMFineTuningService } from './llm-fine-tuning.service';
import { RLMatchingService } from './rl-matching.service';
import { TransferLearningService } from './transfer-learning.service';
import { ModelVersioningService } from './model-versioning.service';
import { AutoRetrainingService } from './auto-retraining.service';
import { ModelExplainabilityService } from './model-explainability.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('MlTrainingController Integration', () => {
  let controller: MlTrainingController;
  let llmService: LLMFineTuningService;
  let rlService: RLMatchingService;
  let transferService: TransferLearningService;
  let versioningService: ModelVersioningService;
  let retrainingService: AutoRetrainingService;
  let explainabilityService: ModelExplainabilityService;

  beforeEach(async () => {
    const mockPrismaService = {
      mLModel: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'model-1' }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      modelVersion: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      aBTest: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'test-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'test-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      trainingJob: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
      },
      dataDriftDetection: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      modelExplanation: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MlTrainingController],
      providers: [
        LLMFineTuningService,
        RLMatchingService,
        TransferLearningService,
        ModelVersioningService,
        AutoRetrainingService,
        ModelExplainabilityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<MlTrainingController>(MlTrainingController);
    llmService = module.get<LLMFineTuningService>(LLMFineTuningService);
    rlService = module.get<RLMatchingService>(RLMatchingService);
    transferService = module.get<TransferLearningService>(TransferLearningService);
    versioningService = module.get<ModelVersioningService>(ModelVersioningService);
    retrainingService = module.get<AutoRetrainingService>(AutoRetrainingService);
    explainabilityService = module.get<ModelExplainabilityService>(ModelExplainabilityService);
  });

  describe('Model Management Flow', () => {
    it('should create and retrieve model', async () => {
      // Create model
      const createResult = await controller.createModel({
        name: 'Test Matching Model',
        type: 'MATCHING',
        baseModel: 'llama-3.1-70b',
      });

      expect(createResult).toHaveProperty('id');

      // Get models
      const models = await controller.getModels();
      expect(Array.isArray(models)).toBe(true);
    });
  });

  describe('Fine-Tuning Flow', () => {
    it('should start fine-tuning and check status', async () => {
      // Start fine-tuning
      const startResult = await controller.startFineTuning({
        modelId: 'model-1',
        trainingDataPath: '/data/training',
        epochs: 3,
      });

      expect(startResult).toHaveProperty('jobId');

      // Check status
      const statusResult = await controller.getFineTuningStatus(startResult.jobId);
      expect(statusResult).toBeDefined();
    });
  });

  describe('A/B Testing Flow', () => {
    it('should create and manage A/B test', async () => {
      // Create A/B test
      const createResult = await controller.createABTest({
        name: 'Model Comparison Test',
        modelAId: 'model-1',
        modelBId: 'model-2',
        trafficSplit: { modelA: 50, modelB: 50 },
      });

      expect(createResult).toHaveProperty('id');

      // Get A/B tests
      const tests = await controller.getABTests();
      expect(Array.isArray(tests)).toBe(true);

      // Stop A/B test
      const stopResult = await controller.stopABTest(createResult.id);
      expect(stopResult).toBeDefined();
    });
  });

  describe('Retraining Flow', () => {
    it('should trigger and monitor retraining', async () => {
      // Trigger retraining
      const triggerResult = await controller.triggerRetraining({
        modelId: 'model-1',
        reason: 'drift detected',
      });

      expect(triggerResult).toHaveProperty('id');

      // Get retraining jobs
      const jobs = await controller.getRetrainingJobs();
      expect(Array.isArray(jobs)).toBe(true);
    });

    it('should get drift detections', async () => {
      const driftResult = await controller.getDriftDetections('model-1');
      expect(Array.isArray(driftResult)).toBe(true);
    });
  });

  describe('Explainability Flow', () => {
    it('should generate and retrieve explanation', async () => {
      // Generate explanation
      const generateResult = await controller.generateExplanation({
        modelId: 'model-1',
        predictionId: 'pred-1',
        explanationType: 'shap',
      });

      expect(generateResult).toHaveProperty('baseValue');

      // Get explanation (will fail as prediction doesn't exist)
      await expect(
        controller.getExplanation('non-existent'),
      ).rejects.toThrow();
    });
  });

  describe('Transfer Learning Flow', () => {
    it('should adapt model to new domain', async () => {
      const adaptResult = await controller.adaptModel({
        modelId: 'model-1',
        targetDomain: 'healthcare',
      });

      expect(adaptResult).toHaveProperty('adaptationId');
      expect(adaptResult).toHaveProperty('targetDomain', 'healthcare');
    });

    it('should get available domains', async () => {
      const domains = await controller.getAvailableDomains();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
    });
  });

  describe('RL Matching Flow', () => {
    it('should update rewards and get policy status', async () => {
      // Update reward
      await controller.updateRewards({
        matchId: 'match-1',
        reward: 0.85,
      });

      // Get policy status
      const status = await controller.getPolicyStatus();
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('explorationRate');
    });
  });

  describe('Model Registry Flow', () => {
    it('should get registered models', async () => {
      const models = await controller.getRegisteredModels();
      expect(models).toHaveProperty('models');
      expect(Array.isArray(models.models)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent model', async () => {
      const { HttpException } = await import('@nestjs/common');
      
      await expect(controller.getModel('non-existent')).rejects.toThrow(HttpException);
    });
  });
});
