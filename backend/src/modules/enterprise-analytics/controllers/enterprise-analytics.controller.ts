// Enterprise Analytics Controller
// Sprint 45: Enterprise Analytics & Reporting

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ExecutiveDashboardService } from './services/dashboard/executive-dashboard.service';
import { ReportingEngineService } from './services/reporting/reporting-engine.service';
import { WorkforceAnalyticsService } from './services/workforce/workforce-analytics.service';
import { TalentAcquisitionAnalyticsService } from './services/talent/talent-acquisition-analytics.service';
import { TimeToHireService } from './services/optimization/time-to-hire.service';
import { CostPerHireService } from './services/cost/cost-per-hire.service';
import { IDateRange, IFilterConfig } from './interfaces/analytics.interface';

// Dashboard DTOs
interface CreateDashboardDto {
  name: string;
  description?: string;
  layout?: any;
  widgets?: any[];
  isDefault?: boolean;
  isPublic?: boolean;
  refreshInterval?: number;
}

interface UpdateDashboardDto {
  name?: string;
  description?: string;
  layout?: any;
  widgets?: any[];
  isDefault?: boolean;
  isPublic?: boolean;
  refreshInterval?: number;
}

// Report DTOs
interface CreateReportDto {
  name: string;
  description?: string;
  query?: any;
  visualization?: any;
  filters?: any[];
  parameters?: any[];
  columns?: any[];
  isTemplate?: boolean;
  isPublic?: boolean;
}

interface ScheduleReportDto {
  reportId: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  minute?: number;
  timezone?: string;
  recipients: string[];
  format: string;
  compression?: boolean;
}

// Cost DTOs
interface TrackCostDto {
  hireId?: string;
  jobId?: string;
  department?: string;
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  vendor?: string;
  receipt?: string;
  allocatedTo?: string;
  costCenter?: string;
}

interface CreateBudgetDto {
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  categories?: Record<string, number>;
  departments?: Record<string, number>;
  varianceThreshold?: number;
}

// Prediction DTOs
interface PredictionRequestDto {
  predictionType: string;
  forecastPeriod?: string;
  segment?: string;
  department?: string;
  role?: string;
}

@Controller('api/v1/enterprise-analytics')
export class EnterpriseAnalyticsController {
  constructor(
    private readonly dashboardService: ExecutiveDashboardService,
    private readonly reportingService: ReportingEngineService,
    private readonly workforceService: WorkforceAnalyticsService,
    private readonly talentService: TalentAcquisitionAnalyticsService,
    private readonly optimizationService: TimeToHireService,
    private readonly costService: CostPerHireService,
  ) {}

  // =====================
  // Dashboard Endpoints
  // =====================

  @Get('dashboards')
  async getDashboards(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role?: string,
  ) {
    return this.dashboardService.getAccessibleDashboards(userId, tenantId, role || 'user');
  }

  @Post('dashboards')
  async createDashboard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() data: CreateDashboardDto,
  ) {
    return this.dashboardService.createDashboard(userId, tenantId, data);
  }

  @Get('dashboards/:id')
  async getDashboardById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') dashboardId: string,
  ) {
    return this.dashboardService.getDashboardById(dashboardId, userId, tenantId);
  }

  @Put('dashboards/:id')
  async updateDashboard(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') dashboardId: string,
    @Body() data: UpdateDashboardDto,
  ) {
    return this.dashboardService.updateDashboard(dashboardId, userId, data);
  }

  @Delete('dashboards/:id')
  async deleteDashboard(
    @Headers('x-user-id') userId: string,
    @Param('id') dashboardId: string,
  ) {
    return this.dashboardService.deleteDashboard(dashboardId, userId);
  }

  @Post('dashboards/:id/export')
  async exportDashboard(
    @Param('id') dashboardId: string,
    @Query('format') format: 'pdf' | 'excel' | 'png' = 'pdf',
  ) {
    return this.dashboardService.exportDashboard(dashboardId, format);
  }

  @Get('dashboards/widgets/kpis')
  async getKPIWidgets(
    @Headers('x-tenant-id') tenantId: string,
    @Query() dateRange: IDateRange,
  ) {
    return this.dashboardService.getKPIWidgets(tenantId, dateRange);
  }

  @Get('dashboards/widgets/library')
  async getWidgetLibrary() {
    return this.dashboardService.getWidgetLibrary();
  }

  @Get('dashboards/widgets/:widgetId/data')
  async getWidgetData(
    @Headers('x-tenant-id') tenantId: string,
    @Param('widgetId') widgetId: string,
  ) {
    return this.dashboardService.getRealTimeWidgetData(widgetId, tenantId);
  }

  @Post('dashboards/:id/widgets')
  async createWidget(
    @Headers('x-user-id') userId: string,
    @Param('id') dashboardId: string,
    @Body() data: any,
  ) {
    return this.dashboardService.createWidget(dashboardId, userId, data);
  }

  @Put('dashboards/:dashboardId/widgets/:widgetId')
  async updateWidget(
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @Body() data: any,
  ) {
    return this.dashboardService.updateWidget(dashboardId, widgetId, data);
  }

  @Delete('dashboards/:dashboardId/widgets/:widgetId')
  async deleteWidget(
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
  ) {
    return this.dashboardService.deleteWidget(dashboardId, widgetId);
  }

  @Get('dashboards/drilldown/:widgetId')
  async getDrillDownData(
    @Headers('x-tenant-id') tenantId: string,
    @Param('widgetId') widgetId: string,
    @Query() filters: IFilterConfig[],
  ) {
    return this.dashboardService.getDrillDownData(widgetId, tenantId, filters);
  }

  // =====================
  // Report Endpoints
  // =====================

  @Get('reports')
  async getReports(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Query('includeTemplates') includeTemplates?: boolean,
  ) {
    return this.reportingService.getReports(tenantId, userId, includeTemplates);
  }

  @Post('reports')
  async createReport(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() data: CreateReportDto,
  ) {
    return this.reportingService.createReport(tenantId, userId, data);
  }

  @Get('reports/:id')
  async getReportById(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') reportId: string,
  ) {
    return this.reportingService.getReportById(reportId, tenantId);
  }

  @Put('reports/:id')
  async updateReport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') reportId: string,
    @Body() data: Partial<CreateReportDto>,
  ) {
    return this.reportingService.updateReport(reportId, tenantId, data);
  }

  @Delete('reports/:id')
  async deleteReport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') reportId: string,
  ) {
    return this.reportingService.deleteReport(reportId, tenantId);
  }

  @Post('reports/:id/run')
  async runReport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') reportId: string,
    @Body() parameters?: Record<string, unknown>,
  ) {
    return this.reportingService.runReport(reportId, tenantId, parameters);
  }

  @Post('reports/:id/schedule')
  async scheduleReport(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') reportId: string,
    @Body() data: ScheduleReportDto,
  ) {
    return this.reportingService.scheduleReport(tenantId, userId, { ...data, reportId });
  }

  @Post('reports/:id/export')
  async exportReport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') reportId: string,
    @Query('format') format: 'pdf' | 'excel' | 'csv' | 'png' = 'pdf',
    @Body() parameters?: Record<string, unknown>,
  ) {
    return this.reportingService.exportReport(reportId, tenantId, format, parameters);
  }

  @Get('reports/exports/:exportId')
  async getExportStatus(@Param('exportId') exportId: string) {
    return this.reportingService.getExportStatus(exportId);
  }

  // =====================
  // Scheduled Reports
  // =====================

  @Get('scheduled')
  async getScheduledReports(@Headers('x-tenant-id') tenantId: string) {
    return this.reportingService.getScheduledReports(tenantId);
  }

  @Post('scheduled')
  async createScheduledReport(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() data: ScheduleReportDto,
  ) {
    return this.reportingService.scheduleReport(tenantId, userId, data);
  }

  @Put('scheduled/:id')
  async updateScheduledReport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') scheduleId: string,
    @Body() data: Partial<ScheduleReportDto>,
  ) {
    return this.reportingService.updateScheduledReport(scheduleId, tenantId, data);
  }

  @Delete('scheduled/:id')
  async deleteScheduledReport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') scheduleId: string,
  ) {
    return this.reportingService.deleteScheduledReport(scheduleId, tenantId);
  }

  @Get('reports/templates')
  async getReportTemplates(@Headers('x-tenant-id') tenantId?: string) {
    return this.reportingService.getReportTemplates(tenantId);
  }

  // =====================
  // Workforce Analytics
  // =====================

  @Get('workforce/predictions')
  async getPredictions(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') predictionType?: string,
    @Query('limit') limit?: number,
  ) {
    return this.workforceService.getPredictions(tenantId, predictionType, limit);
  }

  @Post('workforce/predict')
  async predict(
    @Headers('x-tenant-id') tenantId: string,
    @Body() request: PredictionRequestDto,
  ) {
    let result: any;

    switch (request.predictionType) {
      case 'attrition':
        result = await this.workforceService.predictAttrition(
          tenantId,
          request.department,
          request.role,
        );
        break;
      case 'talent_gap':
        result = await this.workforceService.forecastTalentGap(
          tenantId,
          request.department,
          request.forecastPeriod,
        );
        break;
      case 'skills_demand':
        result = await this.workforceService.predictSkillsDemand(
          tenantId,
          request.forecastPeriod,
        );
        break;
      default:
        throw new HttpException('Unknown prediction type', HttpStatus.BAD_REQUEST);
    }

    // Save prediction
    await this.workforceService.savePrediction(tenantId, request, result);

    return result;
  }

  @Get('workforce/attrition')
  async getAttrition(
    @Headers('x-tenant-id') tenantId: string,
    @Query('period') period?: string,
  ) {
    const [predictions, trend] = await Promise.all([
      this.workforceService.predictAttrition(tenantId),
      this.workforceService.getAttritionTrend(tenantId, period),
    ]);

    return { predictions, trend };
  }

  @Get('workforce/skills-gap')
  async getSkillsGap(
    @Headers('x-tenant-id') tenantId: string,
    @Query('department') department?: string,
  ) {
    return this.workforceService.getSkillsGap(tenantId, department);
  }

  @Get('workforce/compensation')
  async getCompensationBenchmark(
    @Headers('x-tenant-id') tenantId: string,
    @Query('role') role: string,
    @Query('location') location?: string,
  ) {
    return this.workforceService.getCompensationBenchmark(tenantId, role, location);
  }

  @Get('workforce/diversity')
  async getDiversityMetrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('period') period?: string,
  ) {
    return this.workforceService.getDiversityMetrics(tenantId, period);
  }

  // =====================
  // Talent Acquisition
  // =====================

  @Get('talent/source-effectiveness')
  async getSourceEffectiveness(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sourceId') sourceId?: string,
  ) {
    return this.talentService.getSourceEffectiveness(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      sourceId,
    );
  }

  @Get('talent/source-breakdown')
  async getSourceBreakdown(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.talentService.getSourceBreakdown(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('talent/time-to-fill')
  async getTimeToFill(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('department') department?: string,
  ) {
    return this.talentService.getTimeToFillMetrics(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      department,
    );
  }

  @Get('talent/quality-metrics')
  async getQualityMetrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.talentService.getQualityMetrics(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('talent/recruiter-performance')
  async getRecruiterPerformance(
    @Headers('x-tenant-id') tenantId: string,
    @Query('recruiterId') recruiterId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.talentService.getRecruiterPerformance(
      tenantId,
      recruiterId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('talent/recruiter-leaderboard')
  async getRecruiterLeaderboard(
    @Headers('x-tenant-id') tenantId: string,
    @Query('period') period?: string,
  ) {
    return this.talentService.getRecruiterLeaderboard(tenantId, period);
  }

  @Get('talent/pipeline-health')
  async getPipelineHealth(
    @Headers('x-tenant-id') tenantId: string,
    @Query('department') department?: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.talentService.getPipelineHealth(tenantId, department, jobId);
  }

  @Get('talent/pipeline-trend')
  async getPipelineTrend(
    @Headers('x-tenant-id') tenantId: string,
    @Query('days') days?: number,
  ) {
    return this.talentService.getPipelineTrend(tenantId, days || 30);
  }

  @Get('talent/metrics')
  async getTalentMetrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('period') period?: string,
  ) {
    return this.talentService.getTalentMetrics(tenantId, period || 'monthly');
  }

  // =====================
  // Time-to-Hire Optimization
  // =====================

  @Get('optimization/metrics')
  async getTimeToHireMetrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('department') department?: string,
  ) {
    return this.optimizationService.getTimeToHireMetrics(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      department,
    );
  }

  @Get('optimization/bottlenecks')
  async getBottlenecks(
    @Headers('x-tenant-id') tenantId: string,
    @Query('department') department?: string,
  ) {
    return this.optimizationService.identifyBottlenecks(tenantId, department);
  }

  @Get('optimization/bottleneck-trend')
  async getBottleneckTrend(
    @Headers('x-tenant-id') tenantId: string,
    @Query('days') days?: number,
  ) {
    return this.optimizationService.getBottleneckTrend(tenantId, days || 90);
  }

  @Get('optimization/automation-opportunities')
  async getAutomationOpportunities(@Headers('x-tenant-id') tenantId: string) {
    return this.optimizationService.detectAutomationOpportunities(tenantId);
  }

  @Get('optimization/recommendations')
  async getOptimizationRecommendations(@Headers('x-tenant-id') tenantId: string) {
    return this.optimizationService.getRecommendations(tenantId);
  }

  @Get('optimization/best-practices')
  async getBestPractices(@Headers('x-tenant-id') tenantId: string) {
    return this.optimizationService.getBestPractices(tenantId);
  }

  @Get('optimization/benchmarks')
  async compareBenchmarks(
    @Headers('x-tenant-id') tenantId: string,
    @Query('department') department?: string,
  ) {
    return this.optimizationService.compareWithBenchmarks(tenantId, department);
  }

  @Post('optimization/simulate')
  async simulateOptimization(
    @Headers('x-tenant-id') tenantId: string,
    @Body() optimizations: string[],
  ) {
    return this.optimizationService.simulateOptimization(tenantId, optimizations);
  }

  @Get('optimization/stage-durations')
  async getStageDurations(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('department') department?: string,
  ) {
    return this.optimizationService.getStageDurations(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      department,
    );
  }

  // =====================
  // Cost Tracking
  // =====================

  @Get('costs')
  async getCosts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('hireId') hireId?: string,
  ) {
    return this.costService.getCosts(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      { category, department, hireId },
    );
  }

  @Post('costs')
  async trackCost(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() data: TrackCostDto,
  ) {
    return this.costService.trackCost(tenantId, userId, data);
  }

  @Get('costs/summary')
  async getCostSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.costService.getCostSummary(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('costs/per-hire')
  async getCostPerHire(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.costService.getCostPerHire(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('costs/by-category')
  async getCostByCategory(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.costService.getCostByCategory(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('costs/budget')
  async getBudgets(@Headers('x-tenant-id') tenantId: string) {
    return this.costService.getBudgets(tenantId);
  }

  @Post('costs/budget')
  async createBudget(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() data: CreateBudgetDto,
  ) {
    return this.costService.createBudget(tenantId, userId, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Get('costs/budget/:id')
  async getBudgetById(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') budgetId: string,
  ) {
    return this.costService.getBudgetById(budgetId, tenantId);
  }

  @Put('costs/budget/:id')
  async updateBudget(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') budgetId: string,
    @Body() data: Partial<CreateBudgetDto>,
  ) {
    return this.costService.updateBudget(budgetId, tenantId, data);
  }

  @Get('costs/budget/:id/status')
  async getBudgetStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') budgetId: string,
  ) {
    return this.costService.getBudgetStatus(tenantId, budgetId);
  }

  @Get('costs/roi')
  async getROIAnalysis(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.costService.getROIAnalysis(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('costs/roi/:hireId')
  async calculateROI(
    @Headers('x-tenant-id') tenantId: string,
    @Param('hireId') hireId: string,
  ) {
    return this.costService.calculateROI(tenantId, hireId);
  }

  @Get('costs/variance/:budgetId')
  async analyzeVariance(
    @Headers('x-tenant-id') tenantId: string,
    @Param('budgetId') budgetId: string,
  ) {
    return this.costService.analyzeVariance(tenantId, budgetId);
  }

  @Get('costs/forecast')
  async forecastCosts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.costService.forecastCosts(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('costs/forecast-trend')
  async getCostForecastTrend(
    @Headers('x-tenant-id') tenantId: string,
    @Query('months') months?: number,
  ) {
    return this.costService.getCostForecastTrend(tenantId, months || 12);
  }
}
