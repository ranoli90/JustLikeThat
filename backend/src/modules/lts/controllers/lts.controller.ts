import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SLAMonitoringService } from '../services/sla-monitoring.service';
import { CapacityPlanningService } from '../services/capacity-planning.service';
import { CostOptimizationService } from '../services/cost-optimization.service';
import { TechnologyRoadmapService } from '../services/technology-roadmap.service';
import { UserFeedbackService } from '../services/user-feedback.service';
import { ContinuousImprovementService } from '../services/continuous-improvement.service';
import { SLAMetricType } from '../interfaces/lts.interface';

@Controller('api/v1/lts')
export class LTSController {
  constructor(
    private readonly slaService: SLAMonitoringService,
    private readonly capacityService: CapacityPlanningService,
    private readonly costService: CostOptimizationService,
    private readonly roadmapService: TechnologyRoadmapService,
    private readonly feedbackService: UserFeedbackService,
    private readonly improvementService: ContinuousImprovementService,
  ) {}

  // ==================== SLA Monitoring Endpoints ====================

  @Get('sla/configs')
  async getSLAConfigs(@Query('tenantId') tenantId?: string) {
    return this.slaService.getSLAConfigs(tenantId);
  }

  @Post('sla/configs')
  async createSLAConfig(@Body() data: {
    tenantId?: string;
    serviceName: string;
    metricType: SLAMetricType;
    targetValue: number;
    measurementUnit: string;
    period: string;
  }) {
    return this.slaService.createSLAConfig(data);
  }

  @Get('sla/metrics')
  async getSLAMetrics(
    @Query('slaConfigId') slaConfigId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.slaService.getMetrics(slaConfigId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
    });
  }

  @Get('sla/violations')
  async getSLAViolations(@Query() options: {
    tenantId?: string;
    slaConfigId?: string;
    severity?: string;
    acknowledged?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    return this.slaService.getViolations({
      ...options,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
    });
  }

  @Post('sla/violations/:id/acknowledge')
  async acknowledgeViolation(
    @Param('id') id: string,
    @Body('acknowledgedBy') acknowledgedBy: string,
  ) {
    return this.slaService.acknowledgeViolation(id, acknowledgedBy);
  }

  @Get('sla/reports')
  async getSLAReports(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.slaService.generateReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tenantId,
    });
  }

  @Get('sla/dashboard')
  async getSLADashboard(@Query('tenantId') tenantId?: string) {
    return this.slaService.getRealTimeDashboard(tenantId);
  }

  @Get('sla/recommendations')
  async getSLARecommendations(@Query('tenantId') tenantId?: string) {
    return this.slaService.getOptimizationRecommendations(tenantId);
  }

  // ==================== Capacity Planning Endpoints ====================

  @Get('capacity/reports')
  async getCapacityReports(@Query() options: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return this.capacityService.getReports(options);
  }

  @Post('capacity/reports/generate')
  async generateCapacityReport(@Body() data: {
    period: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
  }) {
    return this.capacityService.generateReport({
      period: data.period,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  @Get('capacity/predictions')
  async getCapacityPredictions(@Query() options: {
    horizonMonths?: number;
    resourceTypes?: string[];
  }) {
    return this.capacityService.generatePredictions(options);
  }

  @Get('capacity/recommendations')
  async getCapacityRecommendations() {
    return this.capacityService.getRecommendations();
  }

  @Get('capacity/current')
  async getCurrentCapacity() {
    return this.capacityService.getCurrentCapacity();
  }

  @Get('capacity/autoscaling')
  async getAutoScalingRecommendations() {
    return this.capacityService.getAutoScalingRecommendations();
  }

  @Get('capacity/optimization')
  async getCostOptimization() {
    return this.capacityService.getCostOptimization();
  }

  // ==================== Cost Optimization Endpoints ====================

  @Get('cost/records')
  async getCostRecords(@Query() options: {
    tenantId?: string;
    serviceName?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    return this.costService.getCostRecords(options);
  }

  @Post('cost/records')
  async createCostRecord(@Body() data: {
    tenantId?: string;
    serviceName: string;
    resourceType: string;
    cost: number;
    currency?: string;
    usage?: Record<string, unknown>;
    tags?: Record<string, string>;
    billingPeriod: string;
  }) {
    return this.costService.createCostRecord({
      ...data,
      billingPeriod: new Date(data.billingPeriod),
    });
  }

  @Get('cost/summary')
  async getCostSummary(@Query() options: {
    tenantId?: string;
    period?: string;
  }) {
    return this.costService.getCostSummary(options);
  }

  @Get('cost/forecasts')
  async getCostForecasts(@Query() options: {
    tenantId?: string;
    forecastPeriod?: 'monthly' | 'quarterly' | 'yearly';
    horizonMonths?: number;
  }) {
    return this.costService.generateForecast(options);
  }

  @Get('cost/recommendations')
  async getCostRecommendations(@Query('tenantId') tenantId?: string) {
    return this.costService.getReductionRecommendations(tenantId);
  }

  @Get('cost/anomalies')
  async getCostAnomalies(@Query() options: {
    tenantId?: string;
    severity?: 'low' | 'medium' | 'high';
    startDate?: string;
    endDate?: string;
  }) {
    return this.costService.getAnomalies(options);
  }

  @Get('cost/trends')
  async getCostTrends(@Query() options: {
    tenantId?: string;
    period?: string;
  }) {
    return this.costService.getCostTrends(options);
  }

  @Get('cost/allocation')
  async getCostAllocation(@Query('tenantId') tenantId?: string) {
    return this.costService.getCostAllocation(tenantId);
  }

  // ==================== Technology Roadmap Endpoints ====================

  @Get('roadmap')
  async getRoadmap(@Query() options: {
    category?: string;
    status?: string;
    limit?: number;
  }) {
    return this.roadmapService.getRoadmap(options as { category?: string; status?: string; limit?: number });
  }

  @Get('roadmap/:id')
  async getRoadmapItem(@Param('id') id: string) {
    return this.roadmapService.getRoadmapItemById(id);
  }

  @Post('roadmap')
  async createRoadmapItem(@Body() data: {
    title: string;
    description: string;
    category: string;
    priority?: number;
    estimatedEffort: string;
    startDate?: string;
    targetDate?: string;
  }) {
    return this.roadmapService.createRoadmapItem({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
  }

  @Put('roadmap/:id')
  async updateRoadmapItem(
    @Param('id') id: string,
    @Body() data: Partial<{
      title: string;
      description: string;
      category: string;
      status: string;
      priority: number;
      estimatedEffort: string;
      startDate: string;
      targetDate: string;
    }>,
  ) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate);
    return this.roadmapService.updateRoadmapItem(id, updateData as Parameters<typeof this.roadmapService.updateRoadmapItem>[1]);
  }

  @Post('roadmap/:id/status')
  async updateRoadmapStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.roadmapService.updateStatus(id, status as 'planned' | 'in_progress' | 'completed' | 'deferred');
  }

  @Delete('roadmap/:id')
  async deleteRoadmapItem(@Param('id') id: string) {
    await this.roadmapService.deleteRoadmapItem(id);
    return { success: true };
  }

  @Get('roadmap/summary')
  async getRoadmapSummary() {
    return this.roadmapService.getRoadmapSummary();
  }

  @Get('roadmap/12month')
  async get12MonthRoadmap() {
    return this.roadmapService.get12MonthRoadmap();
  }

  @Get('roadmap/assessment')
  async getTechnologyAssessment() {
    return this.roadmapService.performTechnologyAssessment();
  }

  @Get('roadmap/dependencies')
  async getDependencyMap() {
    return this.roadmapService.getDependencyMap();
  }

  @Get('roadmap/innovation')
  async getInnovationTracking(@Query('limit') limit?: number) {
    return this.roadmapService.trackInnovation({ limit: limit ? parseInt(String(limit)) : undefined });
  }

  // ==================== User Feedback Endpoints ====================

  @Get('feedback')
  async getFeedback(@Query() options: {
    userId?: string;
    feedbackType?: string;
    category?: string;
    status?: string;
    priority?: number;
    limit?: number;
    offset?: number;
  }) {
    return this.feedbackService.getFeedback(options as Parameters<typeof this.feedbackService.getFeedback>[0]);
  }

  @Get('feedback/:id')
  async getFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }

  @Post('feedback')
  async createFeedback(@Body() data: {
    userId: string;
    feedbackType: string;
    category: string;
    subject: string;
    description: string;
  }) {
    return this.feedbackService.createFeedback(data as Parameters<typeof this.feedbackService.createFeedback>[0]);
  }

  @Put('feedback/:id')
  async updateFeedback(
    @Param('id') id: string,
    @Body() data: Partial<{
      category: string;
      subject: string;
      description: string;
      priority: number;
      status: string;
    }>,
  ) {
    return this.feedbackService.updateFeedback(id, data as Parameters<typeof this.feedbackService.updateFeedback>[1]);
  }

  @Post('feedback/:id/respond')
  async respondToFeedback(
    @Param('id') id: string,
    @Body() data: {
      response: string;
      respondedBy: string;
    },
  ) {
    return this.feedbackService.respondToFeedback(id, data.response, data.respondedBy);
  }

  @Get('feedback/categorization')
  async getFeedbackCategorization() {
    return this.feedbackService.getFeedbackCategorization();
  }

  @Get('feedback/priorities')
  async getFeedbackPriorities() {
    return this.feedbackService.getFeedbackPriorities();
  }

  // ==================== NPS Endpoints ====================

  @Get('nps')
  async getNPSSurveys(@Query() options: {
    limit?: number;
    offset?: number;
  }) {
    return this.feedbackService.getNPSSurveys(options);
  }

  @Post('nps')
  async createNPSSurvey(@Body('userId') userId: string) {
    return this.feedbackService.createNPSSurvey(userId);
  }

  @Post('nps/:id/respond')
  async submitNPSResponse(
    @Param('id') id: string,
    @Body() data: {
      score: number;
      comments?: string;
    },
  ) {
    return this.feedbackService.submitNPSResponse(id, data.score, data.comments);
  }

  @Get('nps/metrics')
  async getNPSMetrics() {
    return this.feedbackService.getNPSMetrics();
  }

  // ==================== Continuous Improvement Endpoints ====================

  @Get('improvements')
  async getImprovements(@Query() options: {
    category?: string;
    status?: string;
    limit?: number;
  }) {
    return this.improvementService.getInitiatives(options as Parameters<typeof this.improvementService.getInitiatives>[0]);
  }

  @Get('improvements/:id')
  async getImprovementById(@Param('id') id: string) {
    return this.improvementService.getInitiativeById(id);
  }

  @Post('improvements')
  async createImprovement(@Body() data: {
    title: string;
    description: string;
    category: string;
    estimatedImpact: string;
    estimatedCost?: number;
    startDate?: string;
  }) {
    return this.improvementService.createInitiative(data as Parameters<typeof this.improvementService.createInitiative>[0]);
  }

  @Put('improvements/:id')
  async updateImprovement(
    @Param('id') id: string,
    @Body() data: Partial<{
      title: string;
      description: string;
      category: string;
      status: string;
      estimatedImpact: string;
      estimatedCost: number;
      actualCost: number;
    }>,
  ) {
    return this.improvementService.updateInitiative(id, data as Parameters<typeof this.improvementService.updateInitiative>[1]);
  }

  @Post('improvements/:id/complete')
  async completeImprovement(
    @Param('id') id: string,
    @Body() data: {
      metricsAfter: Record<string, number>;
      actualCost?: number;
    },
  ) {
    return this.improvementService.completeInitiative(id, data.metricsAfter, data.actualCost);
  }

  @Post('improvements/:id/approve')
  async approveImprovement(@Param('id') id: string) {
    return this.improvementService.approveInitiative(id);
  }

  @Post('improvements/:id/start')
  async startImprovement(@Param('id') id: string) {
    return this.improvementService.startInitiative(id);
  }

  @Post('improvements/:id/cancel')
  async cancelImprovement(@Param('id') id: string) {
    return this.improvementService.cancelInitiative(id);
  }

  @Get('improvements/metrics')
  async getImprovementMetrics() {
    return this.improvementService.getImprovementMetrics();
  }

  @Get('improvements/roi')
  async getROITracking() {
    return this.improvementService.getROITracking();
  }

  @Get('improvements/suggestions')
  async getAutomatedSuggestions() {
    return this.improvementService.getAutomatedSuggestions();
  }

  // ==================== Benchmarks Endpoints ====================

  @Get('benchmarks')
  async getBenchmarks(@Query() options: {
    category?: string;
    limit?: number;
  }) {
    return this.improvementService.getBenchmarks(options as Parameters<typeof this.improvementService.getBenchmarks>[0]);
  }

  @Get('benchmarks/:id')
  async getBenchmarkById(@Param('id') id: string) {
    const { benchmarks } = await this.improvementService.getBenchmarks();
    return benchmarks.find((b) => b.id === id);
  }

  @Post('benchmarks')
  async createBenchmark(@Body() data: {
    category: string;
    name: string;
    metrics: Record<string, number>;
    source: string;
    collectionDate?: string;
  }) {
    return this.improvementService.createBenchmark({
      ...data,
      collectionDate: data.collectionDate ? new Date(data.collectionDate) : undefined,
    } as Parameters<typeof this.improvementService.createBenchmark>[0]);
  }

  @Get('benchmarks/compare')
  async compareWithBenchmarks() {
    return this.improvementService.compareWithBenchmarks();
  }
}
