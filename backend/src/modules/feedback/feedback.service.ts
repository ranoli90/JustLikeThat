import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback, FeedbackType, FeedbackTrigger } from '../../entities/feedback.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async createFeedback(
    user: User,
    type: FeedbackType,
    trigger: FeedbackTrigger,
    rating?: number,
    comment?: string,
    metadata?: any,
  ): Promise<Feedback> {
    const feedback = this.feedbackRepository.create({
      user,
      type,
      trigger,
      rating,
      comment,
      metadata,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getFeedbackByUser(userId: string): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getFeedbackByTrigger(trigger: FeedbackTrigger): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      where: { trigger },
      order: { createdAt: 'DESC' },
    });
  }

  async getFeedbackAnalytics() {
    const [npsResponses, csatResponses, allResponses] = await Promise.all([
      this.feedbackRepository.find({ where: { type: FeedbackType.NPS } }),
      this.feedbackRepository.find({ where: { type: FeedbackType.CSAT } }),
      this.feedbackRepository.find(),
    ]);

    const promoters = npsResponses.filter((r) => r.rating >= 9).length;
    const detractors = npsResponses.filter((r) => r.rating <= 6).length;
    const npsScore = npsResponses.length > 0
      ? Math.round(((promoters - detractors) / npsResponses.length) * 100)
      : 0;

    const csatScore = csatResponses.length > 0
      ? Math.round((csatResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / csatResponses.length) * 20)
      : 0;

    const triggerDistribution = allResponses.reduce((acc, feedback) => {
      acc[feedback.trigger] = (acc[feedback.trigger] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      npsScore,
      csatScore,
      totalResponses: allResponses.length,
      responseByType: {
        NPS: npsResponses.length,
        CSAT: csatResponses.length,
        OPEN_ENDED: allResponses.filter((r) => r.type === FeedbackType.OPEN_ENDED).length,
      },
      responseByTrigger: triggerDistribution,
    };
  }

  async getUserSegments() {
    const responses = await this.feedbackRepository.find({
      relations: ['user'],
    });

    // Simple user segmentation based on application behavior and feedback
    const segments = {
      powerUsers: responses.filter(
        (r) => r.user && r.rating && r.rating >= 8,
      ).map(r => r.user.id),
      atRiskUsers: responses.filter(
        (r) => r.user && r.rating && r.rating <= 3,
      ).map(r => r.user.id),
      newUsers: responses.filter(
        (r) => r.user && r.trigger === FeedbackTrigger.ONBOARDING,
      ).map(r => r.user.id),
    };

    return segments;
  }
}
