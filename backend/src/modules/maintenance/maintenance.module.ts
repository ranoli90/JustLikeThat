// Maintenance Module - Sprint 48 Platform Maintenance & Innovation
// This module consolidates all platform maintenance, optimization, and innovation features

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicalDebtController, CodeRefactoringController, SecurityPatchController, DependencyController, ExperimentController, FeatureFlagController, FeedbackController, PerformanceController, OptimizationController } from './controllers/maintenance.controller';
import { TechnicalDebtService } from './services/technical-debt.service';
import { CodeRefactoringService } from './services/code-refactoring.service';
import { SecurityPatchService } from './services/security-patch.service';
import { DependencyUpdateService } from './services/dependency-update.service';
import { InnovationSandboxService } from './services/innovation-sandbox.service';
import { PerformanceOptimizationService } from './services/performance-optimization.service';
import { SonarQubeService } from './services/sonar-qube.service';
import { TechnicalDebt } from './entities/technical-debt.entity';
import { CodeQualityMetrics } from './entities/code-quality-metrics.entity';
import { SecurityPatch, SecurityVulnerability } from './entities/security-patch.entity';
import { DependencyUpdate, DependencyInventory } from './entities/dependency-update.entity';
import { InnovationExperiment, FeatureFlag, ExperimentParticipant, UserFeedback } from './entities/innovation-sandbox.entity';
import { PerformanceSnapshot, OptimizationRecommendation, LoadTestResult, CacheMetrics } from './entities/performance.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TechnicalDebt,
      CodeQualityMetrics,
      SecurityPatch,
      SecurityVulnerability,
      DependencyUpdate,
      DependencyInventory,
      InnovationExperiment,
      FeatureFlag,
      ExperimentParticipant,
      UserFeedback,
      PerformanceSnapshot,
      OptimizationRecommendation,
      LoadTestResult,
      CacheMetrics,
    ]),
    forwardRef(() => AnalyticsModule),
    forwardRef(() => GatewayModule),
  ],
  controllers: [
    TechnicalDebtController,
    CodeRefactoringController,
    SecurityPatchController,
    DependencyController,
    ExperimentController,
    FeatureFlagController,
    FeedbackController,
    PerformanceController,
    OptimizationController,
  ],
  providers: [
    TechnicalDebtService,
    CodeRefactoringService,
    SecurityPatchService,
    DependencyUpdateService,
    InnovationSandboxService,
    PerformanceOptimizationService,
    SonarQubeService,
  ],
  exports: [
    TechnicalDebtService,
    CodeRefactoringService,
    SecurityPatchService,
    DependencyUpdateService,
    InnovationSandboxService,
    PerformanceOptimizationService,
  ],
})
export class MaintenanceModule {}
