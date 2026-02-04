import { Controller, Post, Get, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackType, FeedbackTrigger } from '../../entities/feedback.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createFeedback(
    @Request() req,
    @Body() body: { type: FeedbackType; trigger: FeedbackTrigger; rating?: number; comment?: string; metadata?: any },
  ) {
    const feedback = await this.feedbackService.createFeedback(
      req.user,
      body.type,
      body.trigger,
      body.rating,
      body.comment,
      body.metadata,
    );
    return { success: true, data: feedback };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserFeedback(@Request() req) {
    const feedback = await this.feedbackService.getFeedbackByUser(req.user.id);
    return { success: true, data: feedback };
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  async getFeedbackAnalytics() {
    const analytics = await this.feedbackService.getFeedbackAnalytics();
    return { success: true, data: analytics };
  }

  @Get('segments')
  @UseGuards(JwtAuthGuard)
  async getUserSegments() {
    const segments = await this.feedbackService.getUserSegments();
    return { success: true, data: segments };
  }

  @Get('trigger/:trigger')
  @UseGuards(JwtAuthGuard)
  async getFeedbackByTrigger(@Param('trigger') trigger: FeedbackTrigger) {
    const feedback = await this.feedbackService.getFeedbackByTrigger(trigger);
    return { success: true, data: feedback };
  }
}
