import { Test, TestingModule } from '@nestjs/testing';
import { RLMatchingService, RLState } from './rl-matching.service';
import { PrismaService } from '../integrations/prisma/prisma.service';

describe('RLMatchingService', () => {
  let service: RLMatchingService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      aBTest: {
        create: jest.fn().mockResolvedValue({
          id: 'test-1',
          name: 'RL A/B Test',
          modelAId: 'model-1',
          modelBId: 'model-2',
          status: 'running',
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RLMatchingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RLMatchingService>(RLMatchingService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAction', () => {
    const mockState: RLState = {
      userEmbedding: [0.1, 0.2, 0.3, 0.4],
      jobEmbedding: [0.2, 0.3, 0.4, 0.5],
      userFeatures: {
        years_experience: 5,
        skill_javascript: 1,
        skill_python: 1,
      },
      jobFeatures: {
        min_experience: 3,
        max_experience: 7,
        skill_javascript: 1,
        skill_python: 1,
      },
      context: {
        culture_score: 0.8,
        growth_potential: 0.7,
      },
    };

    it('should return action with adjustment', async () => {
      const result = await service.getAction(mockState);

      expect(result).toHaveProperty('matchScoreAdjustment');
      expect(result).toHaveProperty('recommendedActions');
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });

    it('should return adjustment within reasonable range', async () => {
      const result = await service.getAction(mockState);

      expect(result.matchScoreAdjustment).toBeGreaterThanOrEqual(-0.5);
      expect(result.matchScoreAdjustment).toBeLessThanOrEqual(0.5);
    });
  });

  describe('updateReward', () => {
    it('should update reward for a match', async () => {
      await expect(service.updateReward('match-1', 0.85)).resolves.not.toThrow();
    });
  });

  describe('updateRewardDetailed', () => {
    it('should update reward with components', async () => {
      const components = {
        applicationRate: 0.8,
        interviewRate: 0.6,
        offerRate: 0.4,
        userSatisfaction: 0.9,
        employerSatisfaction: 0.85,
      };

      await expect(
        service.updateRewardDetailed('match-1', components),
      ).resolves.not.toThrow();
    });
  });

  describe('getPolicyStatus', () => {
    it('should return policy status', async () => {
      const result = await service.getPolicyStatus();

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('totalUpdates');
      expect(result).toHaveProperty('explorationRate');
      expect(result).toHaveProperty('averageReward');
      expect(result).toHaveProperty('winRate');
      expect(result.explorationRate).toBeGreaterThanOrEqual(0);
      expect(result.explorationRate).toBeLessThanOrEqual(1);
    });
  });

  describe('trainPolicy', () => {
    it('should return training results', async () => {
      const result = await service.trainPolicy();

      expect(result).toHaveProperty('epochsTrained');
      expect(result).toHaveProperty('policyLoss');
      expect(result).toHaveProperty('valueLoss');
      expect(result.epochsTrained).toBeGreaterThan(0);
      expect(result.policyLoss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('runABTest', () => {
    it('should create A/B test', async () => {
      const result = await service.runABTest({
        modelId: 'model-rl-1',
        baselineModelId: 'model-baseline',
        trafficSplit: 20,
      });

      expect(result).toHaveProperty('testId');
      expect(result.testId).toMatch(/^rl-test-\d+$/);
      expect(prismaService.aBTest.create).toHaveBeenCalled();
    });
  });

  describe('getRewardFunction', () => {
    it('should return reward function details', () => {
      const result = service.getRewardFunction();

      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('weights');
      expect(result).toHaveProperty('description');
      expect(Array.isArray(result.components)).toBe(true);
      expect(result.weights).toHaveProperty('applicationRate');
      expect(result.weights).toHaveProperty('interviewRate');
    });
  });

  describe('enableOnlineLearning', () => {
    it('should enable online learning without error', async () => {
      await expect(service.enableOnlineLearning()).resolves.not.toThrow();
    });
  });
});
