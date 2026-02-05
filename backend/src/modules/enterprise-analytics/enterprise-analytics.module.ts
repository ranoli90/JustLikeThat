// Enterprise Analytics Module
// Sprint 45: Enterprise Analytics & Reporting

import { Module } from '@nestjs/common';
import { EnterpriseAnalyticsController } from './controllers/enterprise-analytics.controller';
import { ExecutiveDashboardService } from './services/dashboard/executive-dashboard.service';
import { ReportingEngineService } from './services/reporting/reporting-engine.service';
import { WorkforceAnalyticsService } from './services/workforce/workforce-analytics.service';
import { TalentAcquisitionAnalyticsService } from './services/talent/talent-acquisition-analytics.service';
import { TimeToHireService } from './services/optimization/time-to-hire.service';
import { CostPerHireService } from './services/cost/cost-per-hire.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnterpriseAnalyticsController],
  providers: [
    ExecutiveDashboardService,
    ReportingEngineService,
    WorkforceAnalyticsService,
    TalentAcquisitionAnalyticsService,
    TimeToHireService,
    CostPerHireService,
  ],
  exports: [
    ExecutiveDashboardService,
    ReportingEngineService,
    WorkforceAnalyticsService,
    TalentAcquisitionAnalyticsService,
    TimeToHireService,
    CostPerHireService,
  ],
})
export class EnterpriseAnalyticsModule {}
