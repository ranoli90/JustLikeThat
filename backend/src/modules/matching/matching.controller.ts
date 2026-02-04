import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MatchingService, MatchResult, MatchScoreBreakdown } from './matching.service';
import { EmbeddingService } from './embedding.service';
import { CulturalFitService, CulturalFitScore } from './cultural-fit.service';
import { CareerTrajectoryService, CareerTrajectoryPrediction } from './career-trajectory.service';
import { LearningToRankService, LTRMatchResult } from './learning-to-rank.service';
import { RecommendationService, JobRecommendation } from './recommendation.service';
import { MatchQualityService, MatchQualityExplanation } from './match-quality.service';
import { PreferenceModelingService } from './preference-modeling.service';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly embeddingService: EmbeddingService,
    private readonly culturalFitService: CulturalFitService,
    private readonly careerTrajectoryService: CareerTrajectoryService,
    private readonly ltrService: LearningToRankService,
    private readonly recommendationService: RecommendationService,
    private readonly matchQualityService: MatchQualityService,
    private readonly preferenceModelingService: PreferenceModelingService,
  ) {}

  // === Original Endpoints ===

  @Get(':personaId/matches')
  async findMatches(@Param('personaId') personaId: string): Promise<MatchResult[]> {
    return this.matchingService.findMatches(personaId);
  }

  @Post('score')
  async calculateMatchScore(
    @Body() body: { personaId: string; jobPostingId: string },
  ): Promise<MatchResult> {
    return this.matchingService.calculateMatchScore(
      body.personaId,
      body.jobPostingId,
    );
  }

  @Get('validation')
  async validateScoringLogic() {
    return this.matchingService.validateScoringLogic();
  }

  @Get('evaluation-plan')
  async getEvaluationPlan() {
    return this.matchingService.getEvaluationPlan();
  }

  @Get('spam-checklist')
  async getSpamChecklist() {
    return this.matchingService.getSpamChecklist();
  }

  @Get('assumptions')
  async getAssumptionsForHumanReview() {
    return this.matchingService.getAssumptionsForHumanReview();
  }

  // === Semantic Matching Endpoints ===

  @Post('embedding/generate')
  async generateEmbedding(@Body() body: { text: string }) {
    return this.embeddingService.generateEmbedding(body.text);
  }

  @Post('semantic/analyze-skills')
  async analyzeSkillsSemantically(
    @Body() body: { personaSkills: any[]; jobSkills: any[] },
  ) {
    return this.embeddingService.analyzeSkillsSemantically(
      body.personaSkills,
      body.jobSkills,
    );
  }

  // === Cultural Fit Endpoints ===

  @Get('cultural-fit/dimensions')
  getCulturalDimensions() {
    return this.culturalFitService.getCulturalDimensions();
  }

  @Get('cultural-fit/analyze/:jobPostingId')
  async analyzeCulturalFit(
    @Param('jobPostingId') jobPostingId: string,
    @Query('userPreferencesId') userPreferencesId: string,
  ) {
    // Placeholder - would need to fetch entities
    return {
      message: 'Cultural fit analysis requires full user preferences entity',
      dimensions: this.culturalFitService.getCulturalDimensions(),
    };
  }

  // === Career Trajectory Endpoints ===

  @Post('career/trajectory')
  async predictCareerTrajectory(
    @Body() body: { persona: any; jobPosting: any },
  ) {
    return this.careerTrajectoryService.predictTrajectory(
      body.persona,
      body.jobPosting,
    );
  }

  @Post('career/assess-move')
  async assessCareerMove(
    @Body() body: { currentPersona: any; targetJob: any },
  ) {
    return this.careerTrajectoryService.assessCareerMove(
      body.currentPersona,
      body.targetJob,
    );
  }

  @Get('career/path/:jobTitle')
  getCareerPath(@Param('jobTitle') jobTitle: string) {
    return this.careerTrajectoryService.getCareerPath(jobTitle);
  }

  // === Learning to Rank Endpoints ===

  @Post('ltr/rank')
  async rankJobs(@Body() body: { persona: any; jobPostings: any[] }) {
    return this.ltrService.rankJobsForPersona(
      body.persona,
      body.jobPostings,
    );
  }

  @Post('ltr/feedback')
  async recordLtrFeedback(@Body() body: {
    personaId: string;
    jobPostingId: string;
    feedback: 'positive' | 'negative' | 'neutral';
    applied?: boolean;
    interview?: boolean;
    offer?: boolean;
  }) {
    await this.ltrService.recordFeedback({
      personaId: body.personaId,
      jobPostingId: body.jobPostingId,
      feedback: body.feedback,
      applied: body.applied || false,
      interview: body.interview || false,
      offer: body.offer || false,
      timestamp: new Date(),
    });
    return { success: true };
  }

  @Get('ltr/model-parameters')
  getModelParameters() {
    return this.ltrService.getModelParameters();
  }

  // === Recommendation Endpoints ===

  @Post('recommendations')
  async getRecommendations(@Body() body: {
    userId: string;
    personaId: string;
    preferences: any;
    searchQuery?: string;
    location?: string;
    filters?: Record<string, any>;
    limit?: number;
  }) {
    return this.recommendationService.getRecommendations(body, body.limit || 20);
  }

  @Get('recommendations/similar/:jobPostingId/:personaId')
  async getSimilarJobs(
    @Param('jobPostingId') jobPostingId: string,
    @Param('personaId') personaId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getSimilarJobs(
      jobPostingId,
      personaId,
      limit || 10,
    );
  }

  @Get('recommendations/career-growth/:personaId')
  async getCareerGrowthRecommendations(
    @Param('personaId') personaId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getCareerGrowthRecommendations(
      personaId,
      limit || 10,
    );
  }

  @Get('recommendations/trending/:personaId')
  async getTrendingJobs(
    @Param('personaId') personaId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getTrendingJobs(
      personaId,
      limit || 10,
    );
  }

  @Post('recommendations/interaction')
  async recordInteraction(@Body() body: {
    personaId: string;
    jobPostingId: string;
    interaction: 'save' | 'unsave' | 'view' | 'apply' | 'dismiss';
  }) {
    await this.recommendationService.updateRecommendations(
      body.personaId,
      body.jobPostingId,
      body.interaction,
    );
    return { success: true };
  }

  @Get('recommendations/analytics/:personaId')
  async getRecommendationAnalytics(@Param('personaId') personaId: string) {
    return this.recommendationService.getRecommendationAnalytics(personaId);
  }

  // === Match Quality Explanation Endpoints ===

  @Post('explain')
  async explainMatch(@Body() body: { persona: any; jobPosting: any }) {
    return this.matchQualityService.explainMatch(
      body.persona,
      body.jobPosting,
    );
  }

  // === Real-time Updates (WebSocket would be used in production) ===

  @Get('updates/status')
  getMatchingStatus() {
    return {
      status: 'active',
      features: [
        'semantic-matching',
        'cultural-fit',
        'career-trajectory',
        'learning-to-rank',
        'recommendations',
        'match-explanations',
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  // === Preference Modeling Endpoints ===

  @Get('preferences/profile/:userId')
  async getPreferenceProfile(@Param('userId') userId: string) {
    return this.preferenceModelingService.buildPreferenceProfile(userId);
  }

  @Get('preferences/recommended/:userId')
  async getRecommendedPreferences(@Param('userId') userId: string) {
    return this.preferenceModelingService.getRecommendedPreferences(userId);
  }

  @Post('preferences/predict-match/:userId')
  async predictJobMatch(
    @Param('userId') userId: string,
    @Body() jobData: { title: string; location: string; remotePreference: string; salaryRange?: { min: number; max: number }; skills: string[] },
  ) {
    return this.preferenceModelingService.predictJobMatch(userId, jobData);
  }
}
