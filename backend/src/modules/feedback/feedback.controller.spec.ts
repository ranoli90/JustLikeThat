import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackType, FeedbackTrigger } from '../../entities/feedback.entity';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let service: FeedbackService;

  const mockFeedbackService = {
    createFeedback: jest.fn(),
    getFeedbackByUser: jest.fn(),
    getFeedbackAnalytics: jest.fn(),
    getUserSegments: jest.fn(),
    getFeedbackByTrigger: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createFeedback', () => {
    it('should create feedback for authenticated user', async () => {
      const mockRequest = {
        user: { id: '1', email: 'test@example.com' },
      };

      const mockFeedbackData = {
        type: FeedbackType.NPS,
        trigger: FeedbackTrigger.ONBOARDING,
        rating: 9,
        comment: 'Great service!',
        metadata: {},
      };

      const mockResult = {
        id: '1',
        user: mockRequest.user,
        ...mockFeedbackData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFeedbackService.createFeedback.mockResolvedValue(mockResult);

      const result = await controller.createFeedback(mockRequest as any, mockFeedbackData);

      expect(service.createFeedback).toHaveBeenCalledWith(
        mockRequest.user,
        mockFeedbackData.type,
        mockFeedbackData.trigger,
        mockFeedbackData.rating,
        mockFeedbackData.comment,
        mockFeedbackData.metadata,
      );

      expect(result).toEqual({ success: true, data: mockResult });
    });
  });

  describe('getUserFeedback', () => {
    it('should retrieve user feedback', async () => {
      const mockRequest = {
        user: { id: '1', email: 'test@example.com' },
      };

      const mockFeedback = [
        { id: '1', user: mockRequest.user, type: FeedbackType.CSAT, trigger: FeedbackTrigger.APPLICATION_COMPLETED },
        { id: '2', user: mockRequest.user, type: FeedbackType.NPS, trigger: FeedbackTrigger.ONBOARDING },
      ];

      mockFeedbackService.getFeedbackByUser.mockResolvedValue(mockFeedback);

      const result = await controller.getUserFeedback(mockRequest as any);

      expect(service.getFeedbackByUser).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual({ success: true, data: mockFeedback });
    });
  });

  describe('getFeedbackAnalytics', () => {
    it('should retrieve feedback analytics', async () => {
      const mockAnalytics = {
        npsScore: 50,
        csatScore: 80,
        totalResponses: 7,
        responseByType: {
          NPS: 4,
          CSAT: 3,
          OPEN_ENDED: 0,
        },
        responseByTrigger: {},
      };

      mockFeedbackService.getFeedbackAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getFeedbackAnalytics();

      expect(service.getFeedbackAnalytics).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockAnalytics });
    });
  });
});
