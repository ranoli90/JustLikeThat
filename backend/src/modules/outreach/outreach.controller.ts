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
import { OutreachService } from './outreach.service';
import { OutreachAnalyticsService } from './outreach-analytics.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/outreach')
export class OutreachController {
  constructor(
    private readonly outreachService: OutreachService,
    private readonly analyticsService: OutreachAnalyticsService,
  ) {}

  // Campaign Endpoints
  @Post('campaigns')
  async createCampaign(@Request() req, @Body() body: any) {
    return this.outreachService.createCampaign(body, req.user.id);
  }

  @Get('campaigns')
  async getCampaigns(@Request() req, @Query('status') status?: string) {
    return this.outreachService.getCampaigns(req.user.id);
  }

  @Get('campaigns/:id')
  async getCampaign(@Request() req, @Param('id') id: string) {
    return this.outreachService.getCampaign(id, req.user.id);
  }

  @Put('campaigns/:id')
  async updateCampaign(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateCampaign(id, body, req.user.id);
  }

  @Post('campaigns/:id/launch')
  async launchCampaign(@Request() req, @Param('id') id: string) {
    return this.outreachService.launchCampaign(id, req.user.id);
  }

  @Post('campaigns/:id/bulk-outreach')
  async bulkOutreach(@Request() req, @Param('id') id: string) {
    return this.outreachService.launchBulkOutreach(id, req.user.id);
  }

  // Contact Endpoints
  @Post('contacts')
  async addContact(@Request() req, @Body() body: any) {
    return this.outreachService.addContact(body, req.user.id);
  }

  @Post('contacts/bulk')
  async addBulkContacts(@Request() req, @Body() body: { contacts: any[]; campaignId?: string }) {
    return this.outreachService.addBulkContacts(body.contacts, req.user.id, body.campaignId);
  }

  @Get('contacts')
  async getContacts(@Request() req, @Query('campaignId') campaignId?: string) {
    return this.outreachService.getContacts(req.user.id, campaignId);
  }

  @Put('contacts/:id/status')
  async updateContactStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.outreachService.updateContactStatus(id, body.status as any, req.user.id);
  }

  // Template Endpoints
  @Post('templates')
  async createTemplate(@Request() req, @Body() body: any) {
    return this.outreachService.createTemplate(body, req.user.id);
  }

  @Get('templates')
  async getTemplates(@Request() req, @Query('category') category?: string) {
    return this.outreachService.getTemplates(req.user.id, category as any);
  }

  @Get('templates/default')
  async getDefaultTemplates() {
    return this.outreachService.getDefaultTemplates();
  }

  // Sequence Endpoints
  @Post('sequences')
  async createSequence(@Request() req, @Body() body: any) {
    return this.outreachService.createSequence(body, req.user.id);
  }

  @Get('sequences')
  async getSequences(@Request() req, @Query('campaignId') campaignId?: string) {
    return this.outreachService.getSequences(req.user.id, campaignId);
  }

  // Message Endpoints
  @Post('messages')
  async sendMessage(@Request() req, @Body() body: any) {
    return this.outreachService.sendMessage(body, req.user.id);
  }

  @Get('messages')
  async getMessages(@Request() req, @Query('contactId') contactId?: string) {
    return this.outreachService.getMessages(req.user.id, contactId);
  }

  @Put('messages/:id/status')
  async updateMessageStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.outreachService.updateMessageStatus(id, body.status as any, req.user.id);
  }

  // Recruiter Endpoints
  @Post('recruiters')
  async addRecruiter(@Request() req, @Body() body: any) {
    return this.outreachService.addRecruiter(body, req.user.id);
  }

  @Get('recruiters')
  async getRecruiters(@Request() req) {
    return this.outreachService.getRecruiters(req.user.id);
  }

  @Put('recruiters/:id')
  async updateRecruiter(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.outreachService.updateRecruiterRelationship(id, body, req.user.id);
  }

  // Insider Endpoints
  @Post('insiders')
  async addInsider(@Request() req, @Body() body: any) {
    return this.outreachService.addInsider(body, req.user.id);
  }

  @Get('insiders')
  async getInsiders(@Request() req) {
    return this.outreachService.getInsiders(req.user.id);
  }

  // Warm Intro Endpoints
  @Post('intros')
  async requestIntro(@Request() req, @Body() body: any) {
    return this.outreachService.requestIntro(body, req.user.id);
  }

  @Get('intros')
  async getIntroRequests(@Request() req) {
    return this.outreachService.getIntroRequests(req.user.id);
  }

  @Put('intros/:id/status')
  async updateIntroStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.outreachService.updateIntroStatus(id, body.status as any, req.user.id);
  }

  // Opportunity Endpoints
  @Post('opportunities')
  async createOpportunity(@Request() req, @Body() body: any) {
    return this.outreachService.createOpportunity(body, req.user.id);
  }

  @Get('opportunities')
  async getOpportunities(@Request() req, @Query('status') status?: string) {
    return this.outreachService.getOpportunities(req.user.id, status as any);
  }

  @Get('opportunities/detect')
  async detectOpportunities(@Request() req) {
    return this.outreachService.detectOpportunities(req.user.id);
  }

  // Personalization Endpoint
  @Post('personalize')
  async personalizeTemplate(@Request() req, @Body() body: any) {
    return this.outreachService.personalizeTemplate(body.template, body.contact, body.userProfile);
  }

  // Analytics Endpoints
  @Get('analytics/overview')
  async getAnalyticsOverview(@Request() req) {
    return this.analyticsService.getOverview(req.user.id);
  }

  @Get('analytics/campaign/:id')
  async getCampaignAnalytics(@Request() req, @Param('id') id: string) {
    return this.analyticsService.getCampaignAnalytics(id, req.user.id);
  }

  @Get('analytics/templates')
  async getTemplateAnalytics(@Request() req) {
    return this.analyticsService.getTemplateAnalytics(req.user.id);
  }

  @Get('analytics/engagement')
  async getEngagementMetrics(@Request() req) {
    return this.analyticsService.getEngagementMetrics(req.user.id);
  }

  @Get('analytics/response-rates')
  async getResponseRates(@Request() req) {
    return this.analyticsService.getResponseRates(req.user.id);
  }
}
