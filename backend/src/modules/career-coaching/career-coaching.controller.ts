import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CareerAdvisorService } from './services/career-advisor.service';
import { SkillGapAnalysisService } from './services/skill-gap-analysis.service';
import { LearningPathService } from './services/learning-path.service';
import { TrajectorySimulationService } from './services/trajectory-simulation.service';
import { InterviewChatbotService } from './services/interview-chatbot.service';
import { MarketTrendService } from './services/market-trend.service';
import { CareerGoalsService } from './services/career-goals.service';

// DTO interfaces
interface ChatDto {
  message: string;
  context?: any;
}

interface GoalDto {
  title: string;
  targetDate: Date;
  milestones?: any[];
}

interface SkillGapDto {
  currentSkills: { skill: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; years: number }[];
  targetRole: string;
  industry?: string;
  experienceYears?: number;
}

interface LearningPathDto {
  targetRole: string;
  currentSkills: string[];
  preferredPace: 'intensive' | 'moderate' | 'relaxed';
  dailyHoursAvailable: number;
  certificates: string[];
}

interface TrajectoryDto {
  currentRole: string;
  targetRole: string;
  currentSalary: number;
  experienceYears: number;
  industry: string;
  location: string;
  skills: string[];
  goals?: any[];
}

interface InterviewDto {
  jobType: string;
  focusAreas?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}

interface AnswerDto {
  questionId: string;
  answer: string;
}

interface TrendDto {
  category?: 'skill' | 'role' | 'industry' | 'salary';
  name?: string;
  region?: string;
  timeframe?: '1-month' | '3-month' | '6-month' | '1-year' | '5-year';
}

interface AlertDto {
  type: string;
  criteria: any;
}

@Controller('api/v1/career-coaching')
export class CareerCoachingController {
  constructor(
    private readonly careerAdvisorService: CareerAdvisorService,
    private readonly skillGapService: SkillGapAnalysisService,
    private readonly learningPathService: LearningPathService,
    private readonly trajectoryService: TrajectorySimulationService,
    private readonly interviewService: InterviewChatbotService,
    private readonly marketTrendService: MarketTrendService,
    private readonly goalsService: CareerGoalsService,
  ) {}

  // ============ Career Advisor ============
  @Post('advisor/chat')
  async chat(@Request() req: any, @Body() body: ChatDto) {
    const userId = req.user?.id || 'demo-user';
    return this.careerAdvisorService.chat(userId, body.message, body.context);
  }

  @Get('advisor/history')
  async getHistory(@Request() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.careerAdvisorService.getHistory(userId);
  }

  @Post('advisor/goal')
  async setGoal(@Request() req: any, @Body() body: GoalDto) {
    const userId = req.user?.id || 'demo-user';
    return this.careerAdvisorService.setGoal(userId, body);
  }

  @Get('advisor/milestones')
  async getMilestones(@Request() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.careerAdvisorService.getMilestones(userId);
  }

  @Post('advisor/milestone/:milestoneId/celebrate')
  async celebrateMilestone(@Request() req: any, @Param('milestoneId') milestoneId: string) {
    const userId = req.user?.id || 'demo-user';
    return this.careerAdvisorService.celebrateMilestone(userId, milestoneId);
  }

  // ============ Skill Gap Analysis ============
  @Post('skill-gap/analyze')
  async analyzeSkillGap(@Request() req: any, @Body() body: SkillGapDto) {
    const userId = req.user?.id || 'demo-user';
    return this.skillGapService.analyze({
      userId,
      ...body,
    });
  }

  @Get('skill-gap/:id')
  async getSkillGap(@Param('id') id: string) {
    return this.skillGapService.getAssessment(id);
  }

  @Post('skill-gap/recommendations')
  async getRecommendations(@Param('id') id: string) {
    return this.skillGapService.getRecommendations(id);
  }

  // ============ Learning Paths ============
  @Post('learning-path/generate')
  async generateLearningPath(@Request() req: any, @Body() body: LearningPathDto) {
    const userId = req.user?.id || 'demo-user';
    return this.learningPathService.generatePath({
      userId,
      ...body,
    });
  }

  @Get('learning-path/:id')
  async getLearningPath(@Param('id') id: string) {
    return this.learningPathService.getPath(id);
  }

  @Put('learning-path/:id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: { courseId: string; completed: boolean },
  ) {
    return this.learningPathService.updateProgress(id, body.courseId, body.completed);
  }

  @Get('learning-path/:id/courses')
  async getCourses(@Param('id') id: string) {
    return this.learningPathService.getCourses(id);
  }

  @Get('learning-path/certificates')
  async getCertificates(@Request() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.learningPathService.getCertificates(userId);
  }

  // ============ Trajectory Simulation ============
  @Post('trajectory/simulate')
  async simulateTrajectory(@Request() req: any, @Body() body: TrajectoryDto) {
    const userId = req.user?.id || 'demo-user';
    return this.trajectoryService.simulate({
      userId,
      ...body,
    });
  }

  @Get('trajectory/:id')
  async getTrajectory(@Param('id') id: string) {
    return this.trajectoryService.getSimulation(id);
  }

  @Post('trajectory/compare')
  async compareScenarios(@Param('id') id: string, @Body() body: { scenarios: string[] }) {
    return this.trajectoryService.compareScenarios(id, body.scenarios);
  }

  // ============ Interview Coaching ============
  @Post('interview/start')
  async startInterview(@Request() req: any, @Body() body: InterviewDto) {
    const userId = req.user?.id || 'demo-user';
    return this.interviewService.startSession({
      userId,
      ...body,
    });
  }

  @Post('interview/:id/answer')
  async submitAnswer(@Param('id') id: string, @Body() body: AnswerDto) {
    return this.interviewService.submitAnswer(id, body.questionId, body.answer);
  }

  @Get('interview/:id/feedback')
  async getFeedback(@Param('id') id: string) {
    return this.interviewService.getFeedback(id);
  }

  @Get('interview/progress')
  async getInterviewProgress(@Request() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.interviewService.getProgress(userId);
  }

  // ============ Market Trends ============
  @Get('trends')
  async getTrends(@Query() query: TrendDto) {
    return this.marketTrendService.getTrends(query);
  }

  @Post('trends/alert')
  async createAlert(@Request() req: any, @Body() body: AlertDto) {
    const userId = req.user?.id || 'demo-user';
    return this.marketTrendService.createAlert(userId, body.type, body.criteria);
  }

  @Get('trends/:category/:name')
  async getTrendByCategoryAndName(
    @Param('category') category: string,
    @Param('name') name: string,
  ) {
    return this.marketTrendService.getTrendByCategoryAndName(category, name);
  }

  // ============ Career Goals ============
  @Post('goals')
  async createGoal(@Request() req: any, @Body() body: GoalDto) {
    const userId = req.user?.id || 'demo-user';
    return this.goalsService.createGoal({
      userId,
      ...body,
    });
  }

  @Get('goals')
  async getGoals(@Request() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.goalsService.getGoals(userId);
  }

  @Put('goals/:id')
  async updateGoal(@Param('id') id: string, @Body() body: Partial<GoalDto>) {
    return this.goalsService.updateGoal(id, body);
  }

  @Put('goals/:id/milestone/:milestoneId')
  async updateMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: { completed: boolean },
  ) {
    return this.goalsService.updateMilestone(id, milestoneId, body.completed);
  }

  @Delete('goals/:id')
  async deleteGoal(@Param('id') id: string) {
    await this.goalsService.deleteGoal(id);
    return { success: true };
  }

  @Get('goals/progress')
  async getGoalProgress(@Request() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.goalsService.getGoalProgress(userId);
  }
}
