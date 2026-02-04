import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyProvider } from '../../entities/survey.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/surveys')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSurvey(
    @Body() body: {
      externalId: string;
      provider: SurveyProvider;
      name: string;
      description?: string;
      surveyUrl?: string;
    },
  ) {
    const survey = await this.surveyService.createSurvey(
      body.externalId,
      body.provider,
      body.name,
      body.description,
      body.surveyUrl,
    );
    return { success: true, data: survey };
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard)
  async sendSurvey(@Request() req, @Param('id') id: string) {
    const survey = await this.surveyService.sendSurvey(req.user, id);
    const surveyUrl = await this.surveyService.generateSurveyUrl(survey, req.user);
    return { success: true, data: { survey, surveyUrl } };
  }

  @Post('response/:externalId')
  async recordResponse(
    @Param('externalId') externalId: string,
    @Body() body: { response: any },
  ) {
    const survey = await this.surveyService.recordResponse(externalId, body.response);
    return { success: true, data: survey };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSurvey(@Param('id') id: string) {
    const survey = await this.surveyService.getSurvey(id);
    return { success: true, data: survey };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserSurveys(@Request() req) {
    const surveys = await this.surveyService.getUserSurveys(req.user.id);
    return { success: true, data: surveys };
  }

  @Get('pending/all')
  @UseGuards(JwtAuthGuard)
  async getPendingSurveys(@Request() req) {
    const surveys = await this.surveyService.getPendingSurveys(req.user.id);
    
    // Generate survey URLs
    const surveysWithUrls = await Promise.all(
      surveys.map(async (survey) => ({
        ...survey,
        surveyUrl: await this.surveyService.generateSurveyUrl(survey, req.user),
      })),
    );
    
    return { success: true, data: surveysWithUrls };
  }

  @Get('analytics/all')
  @UseGuards(JwtAuthGuard)
  async getSurveyAnalytics() {
    const analytics = await this.surveyService.getSurveyAnalytics();
    return { success: true, data: analytics };
  }
}
