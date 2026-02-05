import { Test, TestingModule } from '@nestjs/testing';
import { ModelVersioningService } from './model-versioning.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('ModelVersioningService', () => {
  let service: ModelVersioningService;
  let prismaService: jest.Mocked<PrismaService>;

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
      mLModel: {
        findMany: jest.fn().mockResolvedValue([mockModel]),
        findUnique: jest.fn().mockResolvedValue(mockModel),
        create: jest.fn().mockResolvedValue(mockModel),
        update: jest.fn().mockResolvedValue(mockModel),
        delete: jest.fn().mockResolvedValue(mockModel),
      },
      modelVersion: {
        create: jest.fn().mockResolvedValue({
          id: 'version-1',
          modelId: 'model-1',
          version: 'v1.0.0',
        }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'version-1',
          modelId: 'model-1',
          version: 'v1.0.0',
        }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
      },
      aBTest: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'test-1',
          name: 'A/B Test',
          status: 'running',
        }),
        create: jest.fn().mockResolvedValue({
          id: 'test-1',
          name: 'A/B Test',
          status: 'running',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelVersioningService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ModelVersioningService>(ModelVersioningService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getModels', () => {
    it('should return list of models', async () => {
      const result = await service.getModels();

      expect(Array.isArray(result)).toBe(true);
      expect(prismaService.mLModel.findMany).toHaveBeenCalled();
    });

    it('should filter by type when provided', async () => {
      await service.getModels('MATCHING');

      expect(prismaService.mLModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'MATCHING' },
        }),
      );
    });
  });

  describe('createModel', () => {
    it('should create a new model', async () => {
      const result = await service.createModel({
        name: 'New Model',
        type: 'MATCHING',
        baseModel: 'llama-3.1-70b',
        hyperparameters: { epochs: 3 },
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('New Model');
      expect(result.type).toBe('MATCHING');
      expect(prismaService.mLModel.create).toHaveBeenCalled();
      expect(prismaService.modelVersion.create).toHaveBeenCalled();
    });
  });

  describe('getModelById', () => {
    it('should return model by ID', async () => {
      const result = await service.getModelById('model-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('model-1');
      expect(prismaService.mLModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'model-1' },
        include: expect.any(Object),
      });
    });

    it('should return null for non-existent model', async () => {
      prismaService.mLModel.findUnique.mockResolvedValueOnce(null);
      const result = await service.getModelById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateModel', () => {
    it('should update model', async () => {
      const result = await service.updateModel('model-1', {
        name: 'Updated Model',
      });

      expect(result).toHaveProperty('id', 'model-1');
      expect(prismaService.mLModel.update).toHaveBeenCalled();
    });
  });

  describe('deleteModel', () => {
    it('should delete model', async () => {
      await expect(service.deleteModel('model-1')).resolves.not.toThrow();
      expect(prismaService.mLModel.delete).toHaveBeenCalledWith({
        where: { id: 'model-1' },
      });
    });
  });

  describe('getABTests', () => {
    it('should return A/B tests', async () => {
      const result = await service.getABTests();

      expect(Array.isArray(result)).toBe(true);
      expect(prismaService.aBTest.findMany).toHaveBeenCalled();
    });
  });

  describe('createABTest', () => {
    it('should create A/B test', async () => {
      const result = await service.createABTest({
        name: 'Test A/B',
        modelAId: 'model-1',
        modelBId: 'model-2',
        trafficSplit: { modelA: 50, modelB: 50 },
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'running');
      expect(prismaService.aBTest.create).toHaveBeenCalled();
    });
  });

  describe('deployModel', () => {
    it('should deploy model', async () => {
      const result = await service.deployModel('model-1', 'v1.0.0');

      expect(result).toHaveProperty('deploymentId');
      expect(result).toHaveProperty('endpoint');
      expect(prismaService.mLModel.update).toHaveBeenCalled();
      expect(prismaService.modelVersion.updateMany).toHaveBeenCalled();
    });
  });

  describe('rollbackModel', () => {
    it('should rollback to specified version', async () => {
      const result = await service.rollbackModel('model-1', 'v0.9.0');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('rolledBackTo', 'v0.9.0');
    });

    it('should throw error for non-existent version', async () => {
      prismaService.modelVersion.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.rollbackModel('model-1', 'v0.8.0'),
      ).rejects.toThrow('Version v0.8.0 not found');
    });
  });

  describe('getRegisteredModels', () => {
    it('should return registered models', async () => {
      const result = await service.getRegisteredModels();

      expect(result).toHaveProperty('models');
      expect(Array.isArray(result.models)).toBe(true);
    });
  });

  describe('getModelLineage', () => {
    it('should return model lineage', async () => {
      const result = await service.getModelLineage('model-1');

      expect(result).toHaveProperty('currentVersion');
      expect(result).toHaveProperty('versions');
      expect(Array.isArray(result.versions)).toBe(true);
    });
  });
});
