import { Test, TestingModule } from '@nestjs/testing';
import { LLMFineTuningService } from './llm-fine-tuning.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('LLMFineTuningService', () => {
  let service: LLMFineTuningService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTrainingJob = {
    id: 'ft-test-123',
    modelId: 'model-1',
    status: 'pending',
    progress: 0,
    startedAt: new Date(),
  };

  const mockModel = {
    id: 'model-1',
    name: 'Test Model',
    type: 'MATCHING',
    version: 'v1.0.0',
    status: 'training',
    baseModel: 'llama-3.1-70b',
    modelPath: null,
    metrics: {},
    trainingData: {},
    hyperparameters: {},
    trainedAt: null,
    deployedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      trainingJob: {
        create: jest.fn().mockResolvedValue(mockTrainingJob),
        update: jest.fn().mockResolvedValue(mockTrainingJob),
        findUnique: jest.fn(),
      },
      mLModel: {
        update: jest.fn().mockResolvedValue(mockModel),
      },
      modelVersion: {
        create: jest.fn().mockResolvedValue({
          id: 'version-1',
          modelId: 'model-1',
          version: 'v1.0.0',
          description: 'Initial version',
          isActive: true,
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMFineTuningService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LLMFineTuningService>(LLMFineTuningService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startFineTuning', () => {
    it('should start fine-tuning and return job ID', async () => {
      const result = await service.startFineTuning({
        modelId: 'model-1',
        trainingDataPath: '/data/training',
        epochs: 3,
        batchSize: 4,
        learningRate: 2e-5,
      });

      expect(result).toHaveProperty('jobId');
      expect(result.jobId).toMatch(/^ft-\d+-[a-z0-9]+$/);
      expect(prismaService.trainingJob.create).toHaveBeenCalled();
    });

    it('should use default values when not provided', async () => {
      const result = await service.startFineTuning({
        modelId: 'model-1',
        trainingDataPath: '/data/training',
      });

      expect(result).toHaveProperty('jobId');
    });
  });

  describe('getTrainingStatus', () => {
    it('should return null for non-existent job', async () => {
      const result = await service.getTrainingStatus('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getTrainingProgress', () => {
    it('should return null for non-existent job', async () => {
      const result = await service.getTrainingProgress('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('collectTrainingData', () => {
    it('should return training data statistics', async () => {
      const result = await service.collectTrainingData('model-1');

      expect(result).toHaveProperty('sampleCount');
      expect(result).toHaveProperty('categories');
      expect(result.sampleCount).toBeGreaterThan(0);
      expect(Array.isArray(result.categories)).toBe(true);
    });
  });

  describe('preprocessData', () => {
    it('should return preprocessing statistics', async () => {
      const result = await service.preprocessData('/data/training');

      expect(result).toHaveProperty('processedSamples');
      expect(result).toHaveProperty('avgSequenceLength');
      expect(result.processedSamples).toBeGreaterThan(0);
    });
  });

  describe('getLoraConfig', () => {
    it('should return LoRA configuration', () => {
      const config = service.getLoraConfig({
        loraRank: 16,
        loraAlpha: 32,
      });

      expect(config).toHaveProperty('loraRank', 16);
      expect(config).toHaveProperty('loraAlpha', 32);
      expect(config).toHaveProperty('loraDropout');
      expect(config).toHaveProperty('targetModules');
      expect(config).toHaveProperty('bias');
      expect(config).toHaveProperty('taskType');
    });
  });

  describe('hyperparameterTuning', () => {
    it('should return optimized hyperparameters', async () => {
      const result = await service.hyperparameterTuning('model-1', '/data/training');

      expect(result).toHaveProperty('baseModel', 'model-1');
      expect(result).toHaveProperty('epochs');
      expect(result).toHaveProperty('batchSize');
      expect(result).toHaveProperty('learningRate');
      expect(result).toHaveProperty('loraRank');
      expect(result).toHaveProperty('loraAlpha');
    });
  });

  describe('evaluateModel', () => {
    it('should throw error for incomplete training', async () => {
      await expect(service.evaluateModel('non-existent')).rejects.toThrow(
        'Training job not completed',
      );
    });
  });

  describe('deployModel', () => {
    it('should throw error for incomplete training', async () => {
      await expect(service.deployModel('non-existent')).rejects.toThrow(
        'Training job not completed',
      );
    });
  });
});
