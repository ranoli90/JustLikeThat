import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CareerService, CareerAnalysisResult, SkillGapAnalysisResult } from './career.service';
import { CareerPath } from '../../entities/career-path.entity';
import { SkillGap } from '../../entities/skill-gap.entity';
import { CareerMilestone } from '../../entities/career-milestone.entity';
import { CareerGoal } from '../../entities/career-goal.entity';
import { Certification } from '../../entities/certification.entity';
import { LearningResource } from '../../entities/learning-resource.entity';
import { MentorshipRelationship } from '../../entities/mentorship.entity';
import { SalaryProjection } from '../../entities/salary-projection.entity';
import { IndustryTrend, TrendType } from '../../entities/industry-trend.entity';

@Controller('career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  // ========== Career Paths ==========

  @Get('paths')
  async getCareerPaths(@Query('userId') userId: string) {
    return this.careerService.getCareerPaths(userId);
  }

  @Get('paths/:id')
  async getCareerPath(@Param('id') id: string) {
    return this.careerService.getCareerPath(id);
  }

  @Post('paths')
  async createCareerPath(@Body() body: { userId: string; data: Partial<CareerPath> }) {
    return this.careerService.createCareerPath(body.userId, body.data);
  }

  @Put('paths/:id')
  async updateCareerPath(@Param('id') id: string, @Body() body: Partial<CareerPath>) {
    return this.careerService.updateCareerPath(id, body);
  }

  @Post('recommendations')
  async getCareerRecommendations(
    @Body() body: { userId: string; currentRole: string; targetRole: string; industry: string },
  ) {
    return this.careerService.generateCareerRecommendations(
      body.userId,
      body.currentRole,
      body.targetRole,
      body.industry,
    );
  }

  // ========== Skill Gap Analysis ==========

  @Post('skill-gap-analysis')
  async analyzeSkillGaps(
    @Body() body: { userId: string; targetRole: string; industry: string },
  ): Promise<SkillGapAnalysisResult> {
    return this.careerService.analyzeSkillGaps(body.userId, body.targetRole, body.industry);
  }

  @Get('skill-gaps')
  async getSkillGaps(@Query('userId') userId: string) {
    const gaps = await this.careerService.analyzeSkillGaps(userId, '', '');
    return gaps.gaps;
  }

  // ========== Learning Resources ==========

  @Get('learning-resources')
  async getLearningResources(
    @Query('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.careerService.getLearningResources(
      userId,
      status as any,
    );
  }

  @Post('learning-resources')
  async addLearningResource(
    @Body() body: { userId: string; data: Partial<LearningResource> },
  ) {
    return this.careerService.addLearningResource(body.userId, body.data);
  }

  @Put('learning-resources/:id')
  async updateLearningResource(
    @Param('id') id: string,
    @Body() body: Partial<LearningResource>,
  ) {
    return this.careerService.updateLearningResource(id, body);
  }

  @Get('learning-resources/recommendations/:userId')
  async getLearningRecommendations(@Param('userId') userId: string) {
    return this.careerService.getPersonalizedRecommendations(userId);
  }

  // ========== Certifications ==========

  @Get('certifications')
  async getCertifications(@Query('userId') userId: string) {
    return this.careerService.getCertifications(userId);
  }

  @Post('certifications')
  async addCertification(
    @Body() body: { userId: string; data: Partial<Certification> },
  ) {
    return this.careerService.addCertification(body.userId, body.data);
  }

  @Get('certifications/templates')
  async getCertificationTemplates(@Query('category') category?: string) {
    return this.careerService.getCertificationTemplates(category);
  }

  @Post('certifications/recommendations')
  async getCertificationRecommendations(
    @Body() body: { userId: string; targetRole: string },
  ) {
    return this.careerService.recommendCertifications(body.userId, body.targetRole);
  }

  // ========== Milestones ==========

  @Get('milestones')
  async getMilestones(@Query('userId') userId: string) {
    return this.careerService.getMilestones(userId);
  }

  @Post('milestones')
  async createMilestone(
    @Body() body: { userId: string; data: Partial<CareerMilestone> },
  ) {
    return this.careerService.createMilestone(body.userId, body.data);
  }

  @Put('milestones/:id')
  async updateMilestone(
    @Param('id') id: string,
    @Body() body: Partial<CareerMilestone>,
  ) {
    return this.careerService.updateMilestone(id, body);
  }

  @Get('milestones/templates')
  async getMilestoneTemplates(@Query('industry') industry?: string) {
    return this.careerService.getMilestoneTemplates(industry);
  }

  // ========== Goals ==========

  @Get('goals')
  async getGoals(
    @Query('userId') userId: string,
    @Query('timeframe') timeframe?: string,
  ) {
    return this.careerService.getGoals(userId, timeframe as any);
  }

  @Post('goals')
  async createGoal(
    @Body() body: { userId: string; data: Partial<CareerGoal> },
  ) {
    return this.careerService.createGoal(body.userId, body.data);
  }

  @Put('goals/:id')
  async updateGoal(
    @Param('id') id: string,
    @Body() body: Partial<CareerGoal>,
  ) {
    return this.careerService.updateGoal(id, body);
  }

  @Put('goals/:id/progress')
  async updateGoalProgress(
    @Param('id') id: string,
    @Body() body: { progress: number },
  ) {
    return this.careerService.updateGoalProgress(id, body.progress);
  }

  // ========== Mentorship ==========

  @Get('mentorships')
  async getMentorships(@Query('userId') userId: string) {
    return this.careerService.getMentorshipRelationships(userId);
  }

  @Post('mentorships')
  async createMentorship(
    @Body() body: { userId: string; data: Partial<MentorshipRelationship> },
  ) {
    return this.careerService.createMentorshipRelationship(body.userId, body.data);
  }

  @Get('mentorships/:id')
  async getMentorshipRelationship(@Param('id') id: string) {
    return this.careerService.getMentorshipRelationship(id);
  }

  @Post('mentorships/:id/meetings')
  async addMentorMeeting(
    @Param('id') id: string,
    @Body() meeting: any,
  ) {
    return this.careerService.addMentorMeeting(id, meeting);
  }

  @Get('mentors/search')
  async findMentors(
    @Query('userId') userId: string,
    @Query('expertise') expertise?: string,
    @Query('industries') industries?: string,
    @Query('levels') levels?: string,
  ) {
    return this.careerService.findMentors(userId, {
      expertiseAreas: expertise?.split(','),
      industries: industries?.split(','),
      careerLevels: levels?.split(','),
    });
  }

  // ========== Salary Projections ==========

  @Get('salary/projections')
  async getSalaryProjections(@Query('userId') userId: string) {
    return this.careerService.getSalaryProjections(userId);
  }

  @Post('salary/projections')
  async generateSalaryProjection(
    @Body() body: { userId: string; role: string; industry: string; location: string },
  ) {
    return this.careerService.generateSalaryProjection(
      body.userId,
      body.role,
      body.industry,
      body.location,
    );
  }

  @Get('salary/history')
  async getSalaryHistory(@Query('userId') userId: string) {
    return this.careerService.getSalaryHistory(userId);
  }

  @Post('salary/history')
  async addSalaryHistory(
    @Body() body: { userId: string; data: any },
  ) {
    return this.careerService.addSalaryHistory(body.userId, body.data);
  }

  // ========== Industry Trends ==========

  @Get('trends')
  async getIndustryTrends(@Query('type') type?: string) {
    return this.careerService.getIndustryTrends(type as any);
  }

  @Get('trends/predictions')
  async getSkillPredictions() {
    return this.careerService.getSkillPredictions();
  }

  @Get('trends/relevant/:userId')
  async getRelevantTrends(@Param('userId') userId: string) {
    return this.careerService.getRelevantTrendsForUser(userId);
  }

  // ========== Dashboard ==========

  @Get('dashboard/:userId')
  async getCareerDashboard(@Param('userId') userId: string) {
    return this.careerService.getCareerDashboard(userId);
  }
}
