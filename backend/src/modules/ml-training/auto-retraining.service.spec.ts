import { Test, TestingModule } from '@nestjs/testing';
import { AutoRetrainingService } from './auto-retraining.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('AutoRetrainingService', () => {
  let service: AutoRetrainingService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTrainingJob = {
    id: 'retrain-1',
    modelId: 'model-1',
    status: 'pending',
    progress: 0,
    startedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      trainingJob: {
        findMany: jest.fn().mockResolvedValue([mockTrainingJob]),
        create: jest.fn().mockResolvedValue(mockTrainingJob),
        update: jest.fn().mockResolvedValue(mockTrainingJob),
      },
      mLModel: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({
          id: 'model-1',
          metrics: { accuracy: 0.9, f1Score: 0.88 },
        }),
      },
      dataDriftDetection: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoRetrainingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AutoRetrainingService>(AutoRetrainingService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRetrainingJobs', () => {
    it('should return retraining jobs', async () => {
      const result = await service.getRetrainingJobs();

      expect(Array.isArray(result)).toBe(true);
      expect(prismaService.trainingJob.findMany).toHaveBeenCalled();
    });
  });

  describe('triggerRetraining', () => {
    it('should trigger retraining and return job', async () => {
      const result = await service.triggerRetraining('model-1', 'drift detected');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('modelId', 'model-1');
      expect(result).toHaveProperty('status', 'pending');
    });
  });

  describe('detectDrift', () => {
    it('should detect drift for model', async () => {
      const results = await service.detectDrift('model-1');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('metricName');
      expect(results[0]).toHaveProperty('driftDetected');
      expect(results[0]).toHaveProperty('driftScore');
      expect(results[0]).toHaveProperty('severity');
    });

    it('should store drift detection', async () => {
      await service.detectDrift('model-1');

      expect(prismaService.dataDriftDetection.create).toHaveBeenCalled();
    });
  });

  describe('getDriftDetections', () => {
    it('should return drift detections', async () => {
      const result = await service.getDriftDetections();

      expect(Array.isArray(result)).toBe(true);
      expect(prismaService.dataDriftDetection.findMany).toHaveBeenCalled();
    });

    it('should filter by model ID', async () => {
      await service.getDriftDetections('model-1');

      expect(prismaService.dataDriftDetection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { modelId: 'model-1' },
        }),
      );
    });
  });

  describe('calculatePSI', () => {
    it('should calculate PSI', async () => {
      const result = await service.calculatePSI('model-1', 'match_rate');

      expect(result).toHaveProperty('psi');
      expect(result).toHaveProperty('interpretation');
      expect(result.psi).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkQualityGates', () => {
    it('should pass quality gates with good metrics', async () => {
      const result = await service.checkQualityGates('model-1');
      expect(result).toBe(true);
    });

    it('should fail quality gates with poor metrics', async () => {
      prismaService.mLModel.findUnique.mockResolvedValueOnce({
        id: 'model-1',
        metrics: { accuracy: 0.7, f1Score: 0.65 },
      });

      const result = await service.checkQualityGates('model-1');
      expect(result).toBe(false);
    });
  });

  describe('scheduleRetraining', () => {
    it('should schedule retraining', async () => {
      const result = await service.scheduleRetraining({
        modelId: 'model-1',
        trigger: 'scheduled',
        qualityGate: {
          minAccuracy: 0.85,
          minF1Score: 0.80,
          maxDriftScore: 0.15,
        },
        useSpotInstances: true,
      });

      expect(result).toHaveProperty('scheduleId');
      expect(result).toHaveProperty('nextRunAt');
    });
  });

  describe('optimizeCosts', () => {
    it('should return cost optimization info', async () => {
      const result = await service.optimizeCosts('A100');

      expect(result).toHaveProperty('recommendedInstance');
      expect(result).toHaveProperty('estimatedSavings');
      expect(result).toHaveProperty('fallbackOptions');
      expect(result.estimatedSavings).toBeGreaterThan(0);
    });
  });
});
