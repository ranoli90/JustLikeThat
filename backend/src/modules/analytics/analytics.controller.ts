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
import { AnalyticsService } from './services/analytics.service';
import { UserBehaviorService } from './services/user-behavior.service';
import { CohortAnalysisService } from './services/cohort-analysis.service';
import { ABTestingService } from './services/ab-testing.service';
import { ReportBuilderService } from './services/report-builder.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/v1/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly userBehaviorService: UserBehaviorService,
    private readonly cohortAnalysisService: CohortAnalysisService,
    private readonly abTestingService: ABTestingService,
    private readonly reportBuilderService: ReportBuilderService,
  ) {}

  // ============ ANALYTICS ENDPOINTS ============

  @Post('events')
  async trackEvent(
    @Request() req: any,
    @Body() event: { eventType: string; sessionId?: string; properties: Record<string, unknown> },
  ) {
    await this.analyticsService.trackEvent({
      eventType: event.eventType,
      userId: req.user?.id,
      sessionId: event.sessionId,
      properties: event.properties,
    });
    return { success: true };
  }

  @Get('events')
  async getEvents(
    @Request() req: any,
    @Query('eventType') eventType?: string,
    @Query('sessionId') sessionId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.analyticsService.getEvents(
      { eventType, sessionId },
      { page: parseInt(page), limit: parseInt(limit) },
    );
  }

  @Get('dashboards')
  async getDashboards(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.analyticsService.getDashboards(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('dashboards')
  async createDashboard(
    @Request() req: any,
    @Body()
    dashboard: {
      name: string;
      description?: string;
      layout: any;
      widgets: any[];
      filters?: any[];
      isPublic?: boolean;
    },
  ) {
    return this.analyticsService.createDashboard(req.user.id, dashboard);
  }

  @Get('dashboards/:id')
  async getDashboard(@Param('id') id: string) {
    return this.analyticsService.getDashboard(id);
  }

  @Put('dashboards/:id')
  async updateDashboard(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updates: any,
  ) {
    return this.analyticsService.updateDashboard(id, req.user.id, updates);
  }

  @Delete('dashboards/:id')
  async deleteDashboard(@Request() req: any, @Param('id') id: string) {
    await this.analyticsService.deleteDashboard(id, req.user.id);
    return { success: true };
  }

  @Get('dashboards/public/:shareToken')
  async getPublicDashboard(@Param('shareToken') shareToken: string) {
    return this.analyticsService.getPublicDashboard(shareToken);
  }

  @Get('widget-templates')
  async getWidgetTemplates() {
    return this.analyticsService.getWidgetTemplates();
  }

  @Post('widget-templates')
  async createWidgetTemplate(
    @Request() req: any,
    @Body() template: any,
  ) {
    return this.analyticsService.createWidgetTemplate(req.user.id, template);
  }

  // ============ USER BEHAVIOR ENDPOINTS ============

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.userBehaviorService.getSession(sessionId);
  }

  @Get('sessions/:sessionId/events')
  async getSessionEvents(
    @Param('sessionId') sessionId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '100',
  ) {
    return this.userBehaviorService.getSessionEvents(sessionId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get('users/:userId/sessions')
  async getUserSessions(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.userBehaviorService.getUserSessions(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('sessions')
  async createSession(
    @Request() req: any,
    @Body() session: any,
  ) {
    return this.userBehaviorService.createSession({
      ...session,
      userId: session.userId || req.user.id,
    });
  }

  @Post('sessions/:sessionId/events')
  async recordSessionEvent(
    @Param('sessionId') sessionId: string,
    @Body() event: any,
  ) {
    return this.userBehaviorService.recordEvent({
      ...event,
      sessionId,
    });
  }

  @Get('heatmaps')
  async getHeatmaps(@Query('pageUrl') pageUrl: string) {
    return this.userBehaviorService.getHeatmapData(pageUrl);
  }

  @Post('heatmaps')
  async recordHeatmapData(@Body() data: any) {
    await this.userBehaviorService.recordHeatmapData(data);
    return { success: true };
  }

  @Get('funnels')
  async getFunnels(@Request() req: any) {
    return this.userBehaviorService.getFunnels(req.user.id);
  }

  @Post('funnels')
  async createFunnel(
    @Request() req: any,
    @Body() funnel: any,
  ) {
    return this.userBehaviorService.createFunnel(req.user.id, funnel);
  }

  @Get('funnels/:id')
  async getFunnel(@Param('id') id: string) {
    return this.userBehaviorService.getFunnel(id);
  }

  @Get('funnels/:id/analytics')
  async getFunnelAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.userBehaviorService.getFunnelAnalytics(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // ============ COHORT ANALYSIS ENDPOINTS ============

  @Get('cohorts')
  async getCohorts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.cohortAnalysisService.getCohorts({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('cohorts')
  async createCohort(@Body() cohort: any) {
    return this.cohortAnalysisService.createCohort(cohort);
  }

  @Get('cohorts/calculate')
  async calculateCohorts(
    @Query('cohortType') cohortType: 'daily' | 'weekly' | 'monthly',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('metric') metric = 'active_users',
  ) {
    return this.cohortAnalysisService.calculateRetention(
      cohortType,
      new Date(startDate),
      new Date(endDate),
      metric,
    );
  }

  @Get('cohorts/:id')
  async getCohort(@Param('id') id: string) {
    return this.cohortAnalysisService.getCohort(id);
  }

  @Get('cohorts/:id/retention')
  async getRetentionCurve(@Param('id') id: string) {
    return this.cohortAnalysisService.getRetentionCurve(id);
  }

  @Post('cohorts/compare')
  async compareCohorts(@Body() body: { cohortIds: string[] }) {
    return this.cohortAnalysisService.compareCohorts(body.cohortIds);
  }

  @Get('retention')
  async getRetention(@Query('cohortType') cohortType: string) {
    return this.cohortAnalysisService.calculateRetention(
      cohortType as 'daily' | 'weekly' | 'monthly',
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      new Date(),
    );
  }

  @Get('ltv/predictions')
  async getLTVPredictions(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.cohortAnalysisService.getLTVPredictions({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get('ltv/predictions/:userId')
  async predictLTV(@Param('userId') userId: string) {
    return this.cohortAnalysisService.predictLTV(userId);
  }

  @Get('churn/predictions')
  async getChurnPredictions(
    @Query('riskLevel') riskLevel?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.cohortAnalysisService.getChurnPredictions(
      riskLevel as 'low' | 'medium' | 'high' | 'critical',
      { page: parseInt(page), limit: parseInt(limit) },
    );
  }

  @Get('churn/predictions/:userId')
  async predictChurn(@Param('userId') userId: string) {
    return this.cohortAnalysisService.predictChurn(userId);
  }

  @Get('churn/alerts')
  async getChurnAlerts() {
    return this.cohortAnalysisService.getChurnAlerts();
  }

  // ============ A/B TESTING ENDPOINTS ============

  @Get('experiments')
  async getExperiments(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.abTestingService.getExperiments(status, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('experiments')
  async createExperiment(
    @Request() req: any,
    @Body() experiment: any,
  ) {
    return this.abTestingService.createExperiment(req.user.id, experiment);
  }

  @Get('experiments/:id')
  async getExperiment(@Param('id') id: string) {
    return this.abTestingService.getExperiment(id);
  }

  @Put('experiments/:id')
  async updateExperiment(@Param('id') id: string, @Body() updates: any) {
    return this.abTestingService.updateExperiment(id, updates);
  }

  @Post('experiments/:id/start')
  async startExperiment(@Param('id') id: string) {
    return this.abTestingService.startExperiment(id);
  }

  @Post('experiments/:id/pause')
  async pauseExperiment(@Param('id') id: string) {
    return this.abTestingService.pauseExperiment(id);
  }

  @Post('experiments/:id/complete')
  async completeExperiment(@Param('id') id: string) {
    return this.abTestingService.completeExperiment(id);
  }

  @Delete('experiments/:id')
  async deleteExperiment(@Param('id') id: string) {
    await this.abTestingService.deleteExperiment(id);
    return { success: true };
  }

  @Post('experiments/:id/variants')
  async addVariant(@Param('id') id: string, @Body() variant: any) {
    return this.abTestingService.addVariant(id, variant);
  }

  @Put('experiments/:id/variants/:variantId')
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() updates: any,
  ) {
    return this.abTestingService.updateVariant(variantId, updates);
  }

  @Post('experiments/:id/assign')
  async assignVariant(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.abTestingService.assignVariant(id, req.user.id);
  }

  @Post('experiments/:id/convert')
  async recordConversion(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { value?: number },
  ) {
    await this.abTestingService.recordConversion(id, req.user.id, body.value);
    return { success: true };
  }

  @Get('experiments/:id/results')
  async getExperimentResults(@Param('id') id: string) {
    return this.abTestingService.calculateResults(id);
  }

  // ============ REPORT BUILDER ENDPOINTS ============

  @Get('reports')
  async getReports(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.reportBuilderService.getReports(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('reports')
  async createReport(
    @Request() req: any,
    @Body() report: any,
  ) {
    return this.reportBuilderService.createReport(req.user.id, report);
  }

  @Get('reports/:id')
  async getReport(@Param('id') id: string) {
    return this.reportBuilderService.getReport(id);
  }

  @Put('reports/:id')
  async updateReport(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updates: any,
  ) {
    return this.reportBuilderService.updateReport(id, req.user.id, updates);
  }

  @Delete('reports/:id')
  async deleteReport(@Request() req: any, @Param('id') id: string) {
    await this.reportBuilderService.deleteReport(id, req.user.id);
    return { success: true };
  }

  @Post('reports/:id/generate')
  async generateReport(
    @Param('id') id: string,
    @Body() body: { format: 'pdf' | 'excel' | 'csv' },
  ) {
    return this.reportBuilderService.generateReport(id, body.format);
  }

  @Get('reports/exports/:id')
  async getExportStatus(@Param('id') id: string) {
    return this.reportBuilderService.getExportStatus(id);
  }

  @Get('reports/templates')
  async getReportTemplates() {
    return this.reportBuilderService.getReportTemplates();
  }

  @Post('reports/:id/schedule')
  async scheduleReport(
    @Param('id') id: string,
    @Body() schedule: any,
  ) {
    return this.reportBuilderService.scheduleReport(id, schedule);
  }
}
