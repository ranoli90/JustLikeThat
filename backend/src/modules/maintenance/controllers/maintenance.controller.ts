// Maintenance Controller - Sprint 48
// API endpoints for all maintenance and optimization features

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
import { TechnicalDebtService } from '../services/technical-debt.service';
import { CodeRefactoringService } from '../services/code-refactoring.service';
import { SecurityPatchService } from '../services/security-patch.service';
import { DependencyUpdateService } from '../services/dependency-update.service';
import { InnovationSandboxService } from '../services/innovation-sandbox.service';
import { PerformanceOptimizationService } from '../services/performance-optimization.service';

// ==================== TECHNICAL DEBT ENDPOINTS ====================

@Controller('api/v1/maintenance/technical-debt')
export class TechnicalDebtController {
  constructor(private readonly technicalDebtService: TechnicalDebtService) {}

  @Get()
  async getAllDebt(
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    return this.technicalDebtService.getAllTechnicalDebt({ category, severity, status });
  }

  @Post()
  async createDebt(@Body() data: any) {
    return this.technicalDebtService.createTechnicalDebt(data);
  }

  @Get('summary')
  async getDebtSummary() {
    return this.technicalDebtService.getDebtSummary();
  }

  @Get('quality-metrics')
  async getQualityMetrics(
    @Query('serviceName') serviceName?: string,
    @Query('days') days?: number,
  ) {
    return this.technicalDebtService.getQualityMetrics(serviceName, days || 30);
  }

  @Get(':id')
  async getDebtById(@Param('id') id: string) {
    return this.technicalDebtService.getTechnicalDebtById(id);
  }

  @Put(':id')
  async updateDebt(@Param('id') id: string, @Body() data: any) {
    return this.technicalDebtService.updateTechnicalDebt(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDebt(@Param('id') id: string) {
    await this.technicalDebtService.deleteTechnicalDebt(id);
  }

  @Post('identify')
  async identifyDebt() {
    return this.technicalDebtService.identifyDebtFromSonarQube();
  }

  @Get(':id/suggestions')
  async getRefactoringSuggestions(@Param('id') id: string) {
    return this.technicalDebtService.getRefactoringSuggestions(id);
  }
}

// ==================== CODE REFACTORING ENDPOINTS ====================

@Controller('api/v1/maintenance/refactoring')
export class CodeRefactoringController {
  constructor(private readonly refactoringService: CodeRefactoringService) {}

  @Get('opportunities')
  async getOpportunities() {
    return this.refactoringService.identifyRefactoringOpportunities();
  }

  @Get('metrics')
  async getMetrics() {
    return this.refactoringService.calculateArchitectureMetrics();
  }

  @Get('bottlenecks')
  async getBottlenecks() {
    return this.refactoringService.identifyPerformanceBottlenecks();
  }

  @Get('query-optimizations')
  async getQueryOptimizations() {
    return this.refactoringService.suggestQueryOptimizations();
  }

  @Post('execute/:taskId')
  async executeRefactoring(@Param('taskId') taskId: string) {
    return this.refactoringService.executeRefactoring(taskId);
  }

  @Post('rollback/:taskId')
  async rollbackRefactoring(@Param('taskId') taskId: string) {
    return this.refactoringService.rollbackRefactoring(taskId);
  }
}

// ==================== SECURITY PATCH ENDPOINTS ====================

@Controller('api/v1/maintenance/security-patches')
export class SecurityPatchController {
  constructor(private readonly securityService: SecurityPatchService) {}

  @Get()
  async getAllPatches(@Query('status') status?: string) {
    return this.securityService.getAllPatches(status);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.securityService.getSecurityDashboard();
  }

  @Get('vulnerabilities')
  async getVulnerabilities(@Query('status') status?: string) {
    return this.securityService.getVulnerabilities(status);
  }

  @Post()
  async createPatch(@Body() data: any) {
    return this.securityService.createPatch(data);
  }

  @Post('scan')
  async scanVulnerabilities() {
    return this.securityService.scanForVulnerabilities();
  }

  @Post(':id/deploy')
  async deployPatch(@Param('id') id: string) {
    return this.securityService.deployPatch(id);
  }

  @Post(':id/rollback')
  async rollbackPatch(@Param('id') id: string) {
    return this.securityService.rollbackPatch(id);
  }

  @Get('compliance')
  async checkCompliance() {
    return this.securityService.checkCompliance();
  }

  @Get('sla')
  async getSlaCompliance() {
    return this.securityService.getSlaCompliance();
  }
}

// ==================== DEPENDENCY UPDATE ENDPOINTS ====================

@Controller('api/v1/maintenance/dependencies')
export class DependencyController {
  constructor(private readonly dependencyService: DependencyUpdateService) {}

  @Get()
  async getInventory() {
    return this.dependencyService.getDependencyInventory();
  }

  @Get('outdated')
  async getOutdated() {
    return this.dependencyService.getOutdatedDependencies();
  }

  @Get('schedule')
  async getSchedule() {
    return this.dependencyService.getUpdateSchedule();
  }

  @Post('check')
  async checkUpdates() {
    return this.dependencyService.checkForUpdates();
  }

  @Post('scan')
  async scanDependencies() {
    return this.dependencyService.scanDependencies();
  }

  @Post('schedule')
  async scheduleUpdate(@Body() data: any) {
    return this.dependencyService.scheduleUpdate(data);
  }

  @Post(':id/test')
  async testUpdate(@Param('id') id: string) {
    return this.dependencyService.testUpdate(id);
  }

  @Post(':id/update')
  async applyUpdate(@Param('id') id: string) {
    return this.dependencyService.applyUpdate(id);
  }

  @Post(':id/rollback')
  async rollbackUpdate(@Param('id') id: string) {
    return this.dependencyService.rollbackUpdate(id);
  }

  @Post(':id/approve')
  async approveUpdate(@Param('id') id: string) {
    return this.dependencyService.approveUpdate(id);
  }

  @Post(':id/reject')
  async rejectUpdate(@Param('id') id: string) {
    return this.dependencyService.rejectUpdate(id);
  }

  @Get('vulnerabilities')
  async getVulnerableDependencies() {
    return this.dependencyService.getVulnerableDependencies();
  }
}

// ==================== INNOVATION SANDBOX ENDPOINTS ====================

@Controller('api/v1/maintenance/experiments')
export class ExperimentController {
  constructor(private readonly innovationService: InnovationSandboxService) {}

  @Get()
  async getAllExperiments(@Query('status') status?: string) {
    return this.innovationService.getAllExperiments(status);
  }

  @Post()
  async createExperiment(@Body() data: any) {
    return this.innovationService.createExperiment(data);
  }

  @Get(':id')
  async getExperiment(@Param('id') id: string) {
    return this.innovationService.getExperimentById(id);
  }

  @Put(':id')
  async updateExperiment(@Param('id') id: string, @Body() data: any) {
    return this.innovationService.updateExperiment(id, data);
  }

  @Post(':id/start')
  async startExperiment(@Param('id') id: string) {
    return this.innovationService.startExperiment(id);
  }

  @Post(':id/pause')
  async pauseExperiment(@Param('id') id: string) {
    return this.innovationService.pauseExperiment(id);
  }

  @Post(':id/stop')
  async stopExperiment(@Param('id') id: string, @Body() results?: any) {
    return this.innovationService.stopExperiment(id, results);
  }

  @Post(':id/cancel')
  async cancelExperiment(@Param('id') id: string) {
    return this.innovationService.cancelExperiment(id);
  }

  @Get(':id/results')
  async getExperimentResults(@Param('id') id: string) {
    return this.innovationService.getExperimentResults(id);
  }
}

// ==================== FEATURE FLAG ENDPOINTS ====================

@Controller('api/v1/maintenance/feature-flags')
export class FeatureFlagController {
  constructor(private readonly innovationService: InnovationSandboxService) {}

  @Get()
  async getAllFlags() {
    return this.innovationService.getAllFeatureFlags();
  }

  @Post()
  async createFlag(@Body() data: any) {
    return this.innovationService.createFeatureFlag(data);
  }

  @Get(':id')
  async getFlag(@Param('id') id: string) {
    return this.innovationService.getFeatureFlagById(id);
  }

  @Get('key/:key')
  async getFlagByKey(@Param('key') key: string) {
    return this.innovationService.getFeatureFlagByKey(key);
  }

  @Put(':id')
  async updateFlag(@Param('id') id: string, @Body() data: any) {
    return this.innovationService.updateFeatureFlag(id, data);
  }

  @Post(':id/toggle')
  async toggleFlag(@Param('id') id: string) {
    return this.innovationService.toggleFeatureFlag(id);
  }

  @Post(':id/rollout')
  async setRollout(@Param('id') id: string, @Body() data: { percentage: number }) {
    return this.innovationService.setRolloutPercentage(id, data.percentage);
  }

  @Post(':id/targeting')
  async setTargeting(@Param('id') id: string, @Body() data: { targeting: any }) {
    return this.innovationService.setTargetingRules(id, data.targeting);
  }

  @Get('check/:key')
  async isEnabled(@Param('key') key: string, @Query('userId') userId?: string) {
    return { enabled: await this.innovationService.isFeatureEnabled(key, userId) };
  }
}

// ==================== FEEDBACK ENDPOINTS ====================

@Controller('api/v1/maintenance/feedback')
export class FeedbackController {
  constructor(private readonly innovationService: InnovationSandboxService) {}

  @Post()
  async collectFeedback(@Body() data: any) {
    return this.innovationService.collectFeedback(data);
  }

  @Get()
  async getFeedback(@Query() filters?: any) {
    return this.innovationService.getFeedback(filters);
  }

  @Get('summary')
  async getFeedbackSummary(@Query('experimentId') experimentId?: string) {
    return this.innovationService.getFeedbackSummary(experimentId);
  }
}

// ==================== PERFORMANCE ENDPOINTS ====================

@Controller('api/v1/maintenance/performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceOptimizationService) {}

  @Get()
  async getCurrentPerformance(@Query('serviceName') serviceName: string) {
    return this.performanceService.getCurrentPerformance(serviceName);
  }

  @Get('snapshots')
  async getSnapshots(
    @Query('serviceName') serviceName: string,
    @Query('hours') hours?: number,
  ) {
    return this.performanceService.getPerformanceHistory(serviceName, hours || 24);
  }

  @Get('apm/:serviceName')
  async getApmData(@Param('serviceName') serviceName: string) {
    return this.performanceService.getApmData(serviceName);
  }

  @Post('analyze')
  async analyzePerformance(@Body() data: { serviceName: string }) {
    return this.performanceService.analyzeApmTraces(data.serviceName);
  }

  @Get('database')
  async getDatabaseMetrics() {
    return this.performanceService.getDatabaseMetrics();
  }

  @Get('slow-queries')
  async getSlowQueries() {
    return this.performanceService.analyzeSlowQueries();
  }

  @Get('cache/:serviceName')
  async getCacheMetrics(@Param('serviceName') serviceName: string) {
    return this.performanceService.getCacheMetrics(serviceName);
  }

  @Get('load-tests')
  async getLoadTests(
    @Query('serviceName') serviceName?: string,
    @Query('limit') limit?: number,
  ) {
    return this.performanceService.getLoadTestResults(serviceName, limit || 10);
  }

  @Post('load-test')
  async runLoadTest(@Body() data: any) {
    return this.performanceService.runLoadTest(data);
  }

  @Get('cdn')
  async getCdnMetrics() {
    return this.performanceService.getCdnMetrics();
  }
}

// ==================== OPTIMIZATION ENDPOINTS ====================

@Controller('api/v1/maintenance/optimizations')
export class OptimizationController {
  constructor(private readonly performanceService: PerformanceOptimizationService) {}

  @Get()
  async getRecommendations(@Query('category') category?: string) {
    return this.performanceService.getOptimizationRecommendations(category);
  }

  @Post()
  async createRecommendation(@Body() data: any) {
    return this.performanceService.createRecommendation(data);
  }

  @Post('review')
  async reviewRecommendations(@Body() data: { id: string; action: string }) {
    switch (data.action) {
      case 'approve':
        await this.performanceService.approveRecommendation(data.id);
        break;
      case 'reject':
        await this.performanceService.rejectRecommendation(data.id);
        break;
      case 'implement':
        await this.performanceService.markRecommendationImplemented(data.id);
        break;
    }
    return { success: true };
  }

  @Get('database')
  async getDatabaseRecommendations() {
    return this.performanceService.getDatabaseRecommendations();
  }

  @Get('cache/:serviceName')
  async getCacheOptimization(@Param('serviceName') serviceName: string) {
    return this.performanceService.optimizeCacheStrategy(serviceName);
  }

  @Get('cdn')
  async getCdnOptimization() {
    return this.performanceService.optimizeCdn();
  }
}
