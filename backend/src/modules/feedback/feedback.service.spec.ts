import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Feedback } from '../../entities/feedback.entity';
import { Repository } from 'typeorm';
import { FeedbackType, FeedbackTrigger } from '../../entities/feedback.entity';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repository: Repository<Feedback>;

  const mockFeedbackRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(Feedback),
          useValue: mockFeedbackRepository,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    repository = module.get<Repository<Feedback>>(getRepositoryToken(Feedback));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFeedback', () => {
    it('should create and save feedback', async () => {
      const mockUser = { id: '1' };
      const mockFeedback = {
        id: '1',
        user: mockUser,
        type: FeedbackType.NPS,
        trigger: FeedbackTrigger.ONBOARDING,
        rating: 9,
        comment: 'Great service!',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFeedbackRepository.create.mockReturnValue(mockFeedback);
      mockFeedbackRepository.save.mockResolvedValue(mockFeedback);

      const result = await service.createFeedback(
        mockUser as any,
        FeedbackType.NPS,
        FeedbackTrigger.ONBOARDING,
        9,
        'Great service!',
        {},
      );

      expect(repository.create).toHaveBeenCalledWith({
        user: mockUser,
        type: FeedbackType.NPS,
        trigger: FeedbackTrigger.ONBOARDING,
        rating: 9,
        comment: 'Great service!',
        metadata: {},
      });
      expect(repository.save).toHaveBeenCalledWith(mockFeedback);
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('getFeedbackByUser', () => {
    it('should retrieve feedback by user ID', async () => {
      const userId = '1';
      const mockFeedback = [
        { id: '1', user: { id: userId }, type: FeedbackType.CSAT, trigger: FeedbackTrigger.APPLICATION_COMPLETED },
        { id: '2', user: { id: userId }, type: FeedbackType.NPS, trigger: FeedbackTrigger.ONBOARDING },
      ];

      mockFeedbackRepository.find.mockResolvedValue(mockFeedback);

      const result = await service.getFeedbackByUser(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockFeedback);
    });
  });

  describe('getFeedbackAnalytics', () => {
    it('should calculate NPS and CSAT scores', async () => {
      const mockNPSResponses = [
        { type: FeedbackType.NPS, rating: 9 },
        { type: FeedbackType.NPS, rating: 10 },
        { type: FeedbackType.NPS, rating: 6 },
        { type: FeedbackType.NPS, rating: 5 },
      ];

      const mockCSATResponses = [
        { type: FeedbackType.CSAT, rating: 5 },
        { type: FeedbackType.CSAT, rating: 4 },
        { type: FeedbackType.CSAT, rating: 3 },
      ];

      const allResponses = [...mockNPSResponses, ...mockCSATResponses];

      let callCount = 0;
      mockFeedbackRepository.find.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(mockNPSResponses);
        if (callCount === 2) return Promise.resolve(mockCSATResponses);
        return Promise.resolve(allResponses);
      });

      const result = await service.getFeedbackAnalytics();

      expect(result.npsScore).toBe(0); // (2 promoters - 2 detractors) / 4 * 100 = 0
      expect(result.csatScore).toBe(80); // (5+4+3)/3 = 4 → 4*20 = 80
      expect(result.totalResponses).toBe(7);
    });
  });
});
