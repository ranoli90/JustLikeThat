import { Test, TestingModule } from '@nestjs/testing';
import { TransferLearningService } from './transfer-learning.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('TransferLearningService', () => {
  let service: TransferLearningService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockModel = {
    id: 'model-1',
    name: 'Test Model',
    type: 'MATCHING',
    version: 'v1.0.0',
    status: 'training',
    baseModel: 'llama-3.1-70b',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      mLModel: {
        update: jest.fn().mockResolvedValue(mockModel),
        findUnique: jest.fn().mockResolvedValue(mockModel),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferLearningService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransferLearningService>(TransferLearningService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableDomains', () => {
    it('should return available domains', async () => {
      const result = await service.getAvailableDomains();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('domain');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('sampleCount');
      expect(result[0]).toHaveProperty('accuracy');
      expect(result[0]).toHaveProperty('availableAdaptations');
    });

    it('should include tech domain', async () => {
      const result = await service.getAvailableDomains();
      const techDomain = result.find((d) => d.domain === 'tech');

      expect(techDomain).toBeDefined();
      expect(techDomain?.availableAdaptations).toContain('healthcare');
    });
  });

  describe('adaptModel', () => {
    it('should adapt model to new domain', async () => {
      const result = await service.adaptModel('model-1', 'healthcare');

      expect(result).toHaveProperty('adaptationId');
      expect(result).toHaveProperty('sourceDomain');
      expect(result).toHaveProperty('targetDomain', 'healthcare');
      expect(result).toHaveProperty('adaptedModelPath');
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('adaptationTime');
      expect(prismaService.mLModel.update).toHaveBeenCalled();
    });

    it('should return adapted model path', async () => {
      const result = await service.adaptModel('model-1', 'finance');

      expect(result.adaptedModelPath).toContain('model-1');
      expect(result.adaptedModelPath).toContain('finance');
    });
  });

  describe('fewShotLearn', () => {
    it('should perform few-shot learning', async () => {
      const examples = [
        { input: { text: 'experience with React' }, output: { category: 'frontend' } },
        { input: { text: 'Python machine learning' }, output: { category: 'ml' } },
        { input: { text: 'AWS cloud deployment' }, output: { category: 'devops' } },
      ];

      const result = await service.fewShotLearn('model-1', examples);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('accuracy');
      expect(result.accuracy).toBeGreaterThanOrEqual(0.7);
      expect(result.accuracy).toBeLessThanOrEqual(0.95);
    });

    it('should improve accuracy with more examples', async () => {
      const fewExamples = [{ input: { text: 'a' }, output: { category: 'x' } }];
      const manyExamples = Array(50).fill({
        input: { text: 'example' },
        output: { category: 'tech' },
      });

      const fewResult = await service.fewShotLearn('model-1', fewExamples);
      const manyResult = await service.fewShotLearn('model-1', manyExamples as any);

      expect(manyResult.accuracy).toBeGreaterThan(fewResult.accuracy);
    });
  });

  describe('zeroShotClassify', () => {
    it('should perform zero-shot classification', async () => {
      const categories = ['frontend', 'backend', 'devops', 'data-science'];

      const result = await service.zeroShotClassify('model-1', { text: 'React developer' }, categories);

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('allScores');
      expect(categories).toContain(result.category);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('selectModel', () => {
    it('should select best model for domain', async () => {
      const result = await service.selectModel('healthcare');

      expect(result).toHaveProperty('modelId');
      expect(result).toHaveProperty('modelType', 'healthcare');
      expect(result).toHaveProperty('expectedAccuracy');
      expect(result).toHaveProperty('adaptationNeeded');
    });
  });

  describe('getModelLibrary', () => {
    it('should return model library', async () => {
      const result = await service.getModelLibrary();

      expect(result).toHaveProperty('models');
      expect(Array.isArray(result.models)).toBe(true);
      expect(result.models.length).toBeGreaterThan(0);
      expect(result.models[0]).toHaveProperty('id');
      expect(result.models[0]).toHaveProperty('domain');
      expect(result.models[0]).toHaveProperty('type');
      expect(result.models[0]).toHaveProperty('accuracy');
    });
  });

  describe('createProgressiveNetwork', () => {
    it('should create progressive network', async () => {
      const result = await service.createProgressiveNetwork('/models/source', 'healthcare');

      expect(result).toHaveProperty('networkPath');
      expect(result).toHaveProperty('columnsAdded');
      expect(result.columnsAdded).toBeGreaterThan(0);
    });
  });

  describe('domainAdversarialTrain', () => {
    it('should perform domain adversarial training', async () => {
      const result = await service.domainAdversarialTrain('tech', 'healthcare');

      expect(result).toHaveProperty('domainClassifierLoss');
      expect(result).toHaveProperty('taskLoss');
      expect(result.domainClassifierLoss).toBeGreaterThanOrEqual(0);
      expect(result.taskLoss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureDomainSimilarity', () => {
    it('should measure domain similarity', async () => {
      const result = await service.measureDomainSimilarity('tech', 'healthcare');

      expect(result).toHaveProperty('similarity');
      expect(result).toHaveProperty('transferability');
      expect(result).toHaveProperty('recommendations');
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
      expect(['high', 'medium', 'low']).toContain(result.transferability);
    });
  });
});
