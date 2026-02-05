import { Test, TestingModule } from '@nestjs/testing';
import { ModelExplainabilityService } from './model-explainability.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('ModelExplainabilityService', () => {
  let service: ModelExplainabilityService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      modelExplanation: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue({
          id: 'explain-1',
          modelId: 'model-1',
          predictionId: 'pred-1',
          explanationType: 'shap',
          explanation: {},
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelExplainabilityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ModelExplainabilityService>(ModelExplainabilityService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExplanation', () => {
    it('should generate SHAP explanation', async () => {
      const result = await service.generateExplanation(
        'model-1',
        'pred-1',
        'shap',
      );

      expect(result).toHaveProperty('baseValue');
      expect(result).toHaveProperty('featureAttributions');
      expect(result).toHaveProperty('prediction');
      expect(prismaService.modelExplanation.create).toHaveBeenCalled();
    });

    it('should generate LIME explanation', async () => {
      const result = await service.generateExplanation(
        'model-1',
        'pred-1',
        'lime',
      );

      expect(result).toHaveProperty('prediction');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('localExplanation');
      expect(result).toHaveProperty('sampledExamples');
    });

    it('should generate attention explanation', async () => {
      const result = await service.generateExplanation(
        'model-1',
        'pred-1',
        'attention',
      );

      expect(result).toHaveProperty('layer');
      expect(result).toHaveProperty('head');
      expect(result).toHaveProperty('attentionWeights');
      expect(result).toHaveProperty('topTokens');
    });

    it('should throw error for unknown type', async () => {
      await expect(
        service.generateExplanation('model-1', 'pred-1', 'unknown' as any),
      ).rejects.toThrow('Unknown explanation type');
    });
  });

  describe('generateSHAPExplanation', () => {
    it('should return valid SHAP explanation', async () => {
      const result = await service.generateSHAPExplanation('model-1', 'pred-1');

      expect(result.baseValue).toBeGreaterThanOrEqual(0);
      expect(result.baseValue).toBeLessThanOrEqual(1);
      expect(result.prediction).toBeGreaterThanOrEqual(0);
      expect(result.prediction).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.featureAttributions)).toBe(true);
    });
  });

  describe('generateLIMEExplanation', () => {
    it('should return valid LIME explanation', async () => {
      const result = await service.generateLIMEExplanation('model-1', 'pred-1');

      expect(result.prediction).toBeGreaterThanOrEqual(0);
      expect(result.prediction).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.sampledExamples).toBeGreaterThan(0);
    });
  });

  describe('generateHumanReadableExplanation', () => {
    it('should return human-readable explanation', async () => {
      const result = await service.generateHumanReadableExplanation(
        'model-1',
        'pred-1',
      );

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('keyFactors');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.keyFactors)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('getExplanation', () => {
    it('should return explanation by prediction ID', async () => {
      const result = await service.getExplanation('pred-1');

      expect(result).toBeDefined();
      expect(prismaService.modelExplanation.findFirst).toHaveBeenCalledWith({
        where: { predictionId: 'pred-1' },
        orderBy: { generatedAt: 'desc' },
      });
    });

    it('should throw error for non-existent explanation', async () => {
      prismaService.modelExplanation.findFirst.mockResolvedValueOnce(null);

      await expect(service.getExplanation('non-existent')).rejects.toThrow(
        'No explanation found',
      );
    });
  });

  describe('getFeatureImportance', () => {
    it('should return feature importance ranking', async () => {
      const result = await service.getFeatureImportance('model-1');

      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('totalImportance');
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.totalImportance).toBeGreaterThan(0);
    });
  });

  describe('getCounterfactualExplanations', () => {
    it('should return counterfactual explanations', async () => {
      const result = await service.getCounterfactualExplanations(
        'model-1',
        'pred-1',
      );

      expect(result).toHaveProperty('currentPrediction');
      expect(result).toHaveProperty('targetPrediction');
      expect(result).toHaveProperty('changes');
      expect(Array.isArray(result.changes)).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });

  describe('getVisualizationData', () => {
    it('should return visualization data', async () => {
      const result = await service.getVisualizationData('model-1', 'pred-1');

      expect(result).toHaveProperty('barChartData');
      expect(result).toHaveProperty('waterfallData');
      expect(result).toHaveProperty('heatmapData');
      expect(Array.isArray(result.barChartData)).toBe(true);
      expect(Array.isArray(result.waterfallData)).toBe(true);
      expect(Array.isArray(result.heatmapData)).toBe(true);
    });
  });

  describe('measureTrustScore', () => {
    it('should return trust score', async () => {
      const result = await service.measureTrustScore('pred-1');

      expect(result).toHaveProperty('trustScore');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result.trustScore).toBeGreaterThanOrEqual(0);
      expect(result.trustScore).toBeLessThanOrEqual(1);
    });
  });

  describe('batchGenerateExplanations', () => {
    it('should batch generate explanations', async () => {
      const result = await service.batchGenerateExplanations(
        'model-1',
        ['pred-1', 'pred-2', 'pred-3'],
        'shap',
      );

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('averageTimeMs');
      expect(result.processed + result.failed).toBe(3);
    });
  });
});
