// ============ INTEGRATION CONTROLLER ============

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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { JobBoardService } from '../services/job-board.service';
import { AtsService } from '../services/ats.service';
import { HrisService } from '../services/hris.service';
import { BackgroundCheckService } from '../services/background-check.service';
import { SchedulingService } from '../services/scheduling.service';
import { LmsService } from '../services/lms.service';
import { TeamChatService } from '../services/team-chat.service';
import { SsoService } from '../services/sso.service';
import { IntegrationService } from '../services/integration.service';

// DTOs
export class CreateIntegrationDto {
  provider: string;
  integrationType: string;
  credentials: Record<string, any>;
  settings?: Record<string, any>;
}

export class SyncIntegrationDto {
  syncType?: 'full' | 'incremental' | 'manual';
}

export class JobSearchDto {
  query?: string;
  location?: string;
  remote?: boolean;
  datePosted?: string;
  page?: number;
  limit?: number;
}

@Controller('api/v1/integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly jobBoardService: JobBoardService,
    private readonly atsService: AtsService,
    private readonly hrisService: HrisService,
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly schedulingService: SchedulingService,
    private readonly lmsService: LmsService,
    private readonly teamChatService: TeamChatService,
    private readonly ssoService: SsoService,
  ) {}

  // ============ GENERAL INTEGRATION ENDPOINTS ============

  @Get()
  async listIntegrations(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.integrationService.listIntegrations(type, status);
  }

  @Get(':id')
  async getIntegration(@Param('id') id: string) {
    return this.integrationService.getIntegration(id);
  }

  @Post()
  async createIntegration(@Body() dto: CreateIntegrationDto) {
    return this.integrationService.createIntegration(dto);
  }

  @Put(':id')
  async updateIntegration(
    @Param('id') id: string,
    @Body() dto: Partial<CreateIntegrationDto>,
  ) {
    return this.integrationService.updateIntegration(id, dto);
  }

  @Delete(':id')
  async deleteIntegration(@Param('id') id: string) {
    return this.integrationService.deleteIntegration(id);
  }

  @Post(':id/sync')
  async syncIntegration(
    @Param('id') id: string,
    @Body() dto: SyncIntegrationDto,
  ) {
    return this.integrationService.syncIntegration(id, dto.syncType);
  }

  @Get(':id/sync-logs')
  async getSyncLogs(@Param('id') id: string) {
    return this.integrationService.getSyncLogs(id);
  }

  // ============ JOB BOARD ENDPOINTS ============

  @Post('job-boards/connect/:provider')
  async connectJobBoard(
    @Param('provider') provider: string,
    @Body() credentials: Record<string, any>,
  ) {
    return this.jobBoardService.connectProvider(provider, credentials);
  }

  @Post('job-boards/search')
  async searchJobs(@Body() dto: JobSearchDto) {
    return this.jobBoardService.searchJobs(dto);
  }

  @Get('job-boards/jobs')
  async getJobs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.jobBoardService.getJobs(page, limit);
  }

  @Post('job-boards/apply')
  async applyToJob(
    @Body() body: { jobId: string; resumeId: string; coverLetter?: string },
  ) {
    return this.jobBoardService.applyToJob(body.jobId, body.resumeId, body.coverLetter);
  }

  // ============ ATS ENDPOINTS ============

  @Post('ats/:provider/applications')
  async pushApplication(
    @Param('provider') provider: string,
    @Body() body: { applicationId: string; candidateData: Record<string, any> },
  ) {
    return this.atsService.pushApplication(provider, body.applicationId, body.candidateData);
  }

  @Get('ats/:provider/status')
  async getAtsStatus(@Param('provider') provider: string) {
    return this.atsService.getStatus(provider);
  }

  // ============ HRIS ENDPOINTS ============

  @Post('hris/:provider/sync')
  async syncHris(@Param('provider') provider: string) {
    return this.hrisService.syncEmployees(provider);
  }

  @Get('hris/:provider/employees')
  async getEmployees(
    @Param('provider') provider: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hrisService.getEmployees(provider, page, limit);
  }

  // ============ BACKGROUND CHECK ENDPOINTS ============

  @Post('background-checks/invite')
  async inviteForBackgroundCheck(
    @Body() body: { userId: string; checkType: string },
  ) {
    return this.backgroundCheckService.inviteCandidate(body.userId, body.checkType);
  }

  @Get('background-checks/:id/status')
  async getBackgroundCheckStatus(@Param('id') id: string) {
    return this.backgroundCheckService.getStatus(id);
  }

  // ============ SCHEDULING ENDPOINTS ============

  @Post('scheduling/:provider/schedule')
  async scheduleInterview(
    @Param('provider') provider: string,
    @Body() body: {
      candidateEmail: string;
      interviewerEmail: string;
      duration: number;
      timezone: string;
      notes?: string;
    },
  ) {
    return this.schedulingService.scheduleInterview(
      provider,
      body.candidateEmail,
      body.interviewerEmail,
      body.duration,
      body.timezone,
      body.notes,
    );
  }

  // ============ LMS ENDPOINTS ============

  @Get('lms/:provider/courses')
  async getCourses(@Param('provider') provider: string) {
    return this.lmsService.getCourses(provider);
  }

  @Post('lms/:provider/enroll')
  async enrollInCourse(
    @Param('provider') provider: string,
    @Body() body: { userId: string; courseId: string },
  ) {
    return this.lmsService.enrollUser(provider, body.userId, body.courseId);
  }

  // ============ TEAM CHAT ENDPOINTS ============

  @Post('team-chat/:provider/notify')
  async sendNotification(
    @Param('provider') provider: string,
    @Body() body: { channel: string; message: string; blocks?: any[] },
  ) {
    return this.teamChatService.sendNotification(
      provider,
      body.channel,
      body.message,
      body.blocks,
    );
  }

  // ============ SSO ENDPOINTS ============

  @Get('sso/providers')
  async listSsoProviders() {
    return this.ssoService.listProviders();
  }

  @Post('sso/:provider/initialize')
  async initializeSso(@Param('provider') provider: string) {
    return this.ssoService.initializeProvider(provider);
  }

  @Get('sso/:provider/metadata')
  async getSsoMetadata(@Param('provider') provider: string) {
    return this.ssoService.getMetadata(provider);
  }

  @Post('sso/saml/consume')
  async consumeSamlResponse(@Body() body: { samlResponse: string }) {
    return this.ssoService.consumeSamlResponse(body.samlResponse);
  }

  // ============ WEBHOOK ENDPOINTS ============

  @Post('webhooks/:provider/callback')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.integrationService.handleWebhook(provider, body, signature);
  }

  @Get('webhooks/logs')
  async getWebhookLogs(
    @Query('provider') provider?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.integrationService.getWebhookLogs(provider, page, limit);
  }
}

// Import necessary decorators
import { Headers } from '@nestjs/common';
