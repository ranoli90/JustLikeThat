import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SLAMonitoringService } from './services/sla-monitoring.service';
import { CapacityPlanningService } from './services/capacity-planning.service';
import { CostOptimizationService } from './services/cost-optimization.service';
import { TechnologyRoadmapService } from './services/technology-roadmap.service';
import { UserFeedbackService } from './services/user-feedback.service';
import { ContinuousImprovementService } from './services/continuous-improvement.service';
import { LTSController } from './controllers/lts.controller';

@Module({
  imports: [forwardRef(() => PrismaModule)],
  controllers: [LTSController],
  providers: [
    SLAMonitoringService,
    CapacityPlanningService,
    CostOptimizationService,
    TechnologyRoadmapService,
    UserFeedbackService,
    ContinuousImprovementService,
  ],
  exports: [
    SLAMonitoringService,
    CapacityPlanningService,
    CostOptimizationService,
    TechnologyRoadmapService,
    UserFeedbackService,
    ContinuousImprovementService,
  ],
})
export class LTSModule {}
