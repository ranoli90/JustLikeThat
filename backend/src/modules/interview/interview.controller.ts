import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { CreateInterviewSessionDto, InterviewQuestionDto } from './interview.service';
import { CompanyResearchService } from './company-research.service';
import { QuestionPreparationService } from './question-preparation.service';
import { InterviewSchedulingService } from './interview-scheduling.service';
import { SalaryNegotiationService } from './salary-negotiation.service';
import { PostInterviewService } from './post-interview.service';

@Controller('interview')
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly companyResearchService: CompanyResearchService,
    private readonly questionPreparationService: QuestionPreparationService,
    private readonly schedulingService: InterviewSchedulingService,
    private readonly negotiationService: SalaryNegotiationService,
    private readonly postInterviewService: PostInterviewService,
  ) {}

  // ==================== Interview Sessions ====================

  @Post('sessions')
  async createSession(@Body() dto: CreateInterviewSessionDto) {
    return this.interviewService.createSession(dto);
  }

  @Get('sessions')
  async getUserSessions(@Query('userId') userId: string) {
    return this.interviewService.getUserSessions(userId);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.interviewService.getSession(id);
  }

  @Post('sessions/:id/practice')
  async startPractice(
    @Param('id') id: string,
    @Body() dto: InterviewQuestionDto,
  ) {
    return this.interviewService.startPractice(id, dto);
  }

  @Post('sessions/:id/answer')
  async submitAnswer(
    @Param('id') sessionId: string,
    @Body() body: { questionId: string; answer: string },
  ) {
    return this.interviewService.submitAnswer(sessionId, body.questionId, body.answer);
  }

  @Post('sessions/:id/complete')
  async completeSession(@Param('id') id: string) {
    return this.interviewService.completeSession(id);
  }

  @Post('sessions/:id/schedule')
  async scheduleSession(
    @Param('id') id: string,
    @Body() body: { interviewDate: string; timezone: string },
  ) {
    return this.interviewService.scheduleSession(id, new Date(body.interviewDate), body.timezone);
  }

  @Get('sessions/:id/tips')
  async getPreparationTips(@Param('id') id: string) {
    return this.interviewService.getPreparationTips(id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@Param('id') id: string) {
    await this.interviewService.deleteSession(id);
  }

  // ==================== Company Research ====================

  @Post('sessions/:id/company')
  async researchCompany(
    @Param('id') sessionId: string,
    @Body() body: { companyName: string },
  ) {
    return this.companyResearchService.researchCompany(body.companyName, sessionId);
  }

  @Get('sessions/:id/company')
  async getCompanyInsight(@Param('id') sessionId: string) {
    return this.companyResearchService.getCompanyInsight(sessionId);
  }

  @Get('sessions/:id/company/tips')
  async getCompanyTips(@Param('id') sessionId: string) {
    return this.companyResearchService.getInterviewTips(sessionId);
  }

  // ==================== Question Preparation ====================

  @Get('questions/generate')
  async generateQuestions(
    @Query('type') type: string,
    @Query('jobTitle') jobTitle?: string,
    @Query('count') count?: string,
  ) {
    return this.questionPreparationService.generateQuestions(
      type,
      jobTitle,
      count ? parseInt(count, 10) : 5,
    );
  }

  @Get('questions/behavioral')
  async getBehavioralQuestions(@Query('count') count?: string) {
    return this.questionPreparationService.generateBehavioralQuestions(
      count ? parseInt(count, 10) : 5,
    );
  }

  @Get('questions/technical')
  async getTechnicalQuestions(
    @Query('jobTitle') jobTitle?: string,
    @Query('count') count?: string,
  ) {
    return this.questionPreparationService.generateTechnicalQuestions(
      jobTitle,
      count ? parseInt(count, 10) : 5,
    );
  }

  @Get('questions/structure/:type')
  async getAnswerStructure(@Param('type') type: string) {
    return this.questionPreparationService.getAnswerStructure(type as any);
  }

  // ==================== Scheduling ====================

  @Get('sessions/:id/schedule')
  async getSchedule(@Param('id') sessionId: string) {
    return this.schedulingService.getSchedule(sessionId);
  }

  @Put('sessions/:id/schedule')
  async updateSchedule(
    @Param('id') sessionId: string,
    @Body() body: any,
  ) {
    return this.schedulingService.updateSchedule(sessionId, body);
  }

  @Get('sessions/:id/preparation-tips')
  async getSessionPreparationTips(@Param('id') id: string) {
    const session = await this.interviewService.getSession(id);
    return this.schedulingService.getPreparationTips(session.interviewFormat);
  }

  @Get('dress-code/:companyType')
  async getDressCodeGuidance(@Param('companyType') companyType: string) {
    return this.schedulingService.getDressCodeGuidance(companyType);
  }

  // ==================== Salary Negotiation ====================

  @Post('negotiation')
  async createNegotiation(@Body() body: any) {
    return this.negotiationService.createNegotiation(body);
  }

  @Get('negotiation/:id')
  async getNegotiation(@Param('id') id: string) {
    return this.negotiationService.getNegotiation(id);
  }

  @Get('negotiation/user/:userId')
  async getUserNegotiations(@Param('userId') userId: string) {
    return this.negotiationService.getUserNegotiations(userId);
  }

  @Put('negotiation/:id')
  async updateNegotiation(@Param('id') id: string, @Body() body: any) {
    return this.negotiationService.updateNegotiation(id, body);
  }

  @Get('salary-range')
  async getMarketSalaryRange(
    @Query('position') position: string,
    @Query('location') location?: string,
    @Query('experience') experience?: string,
  ) {
    return this.negotiationService.getMarketSalaryRange(position, location, experience);
  }

  @Get('negotiation/:id/strategy')
  async getNegotiationStrategy(@Param('id') id: string) {
    return this.negotiationService.getNegotiationStrategy(id);
  }

  // ==================== Post Interview ====================

  @Post('follow-up')
  async createFollowUp(@Body() body: any) {
    return this.postInterviewService.createAction(body);
  }

  @Get('follow-up/user/:userId')
  async getUserFollowUps(@Param('userId') userId: string) {
    return this.postInterviewService.getUserActions(userId);
  }

  @Get('follow-up/pending/:userId')
  async getPendingFollowUps(@Param('userId') userId: string) {
    return this.postInterviewService.getPendingActions(userId);
  }

  @Get('follow-up/application/:applicationId')
  async getApplicationFollowUps(@Param('applicationId') applicationId: string) {
    return this.postInterviewService.getApplicationActions(applicationId);
  }

  @Put('follow-up/:id/status')
  async updateFollowUpStatus(
    @Param('id') id: string,
    @Body() body: { status: string; message?: string },
  ) {
    return this.postInterviewService.updateActionStatus(id, body.status as any, body.message);
  }

  @Post('thank-you-template')
  async generateThankYouNote(@Body() body: any) {
    return this.postInterviewService.generateThankYouNote(body);
  }

  @Post('follow-up-template')
  async generateFollowUpNote(@Body() body: any) {
    return this.postInterviewService.generateFollowUpNote(body);
  }

  @Get('guidance')
  async getPostInterviewGuidance() {
    return this.postInterviewService.getPostInterviewGuidance();
  }
}
