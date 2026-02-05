import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './services/analytics.service';
import { ClickHouseService } from './services/clickhouse.service';
import { UserBehaviorService } from './services/user-behavior.service';
import { CohortAnalysisService } from './services/cohort-analysis.service';
import { ABTestingService } from './services/ab-testing.service';
import { ReportBuilderService } from './services/report-builder.service';
import { AnalyticsController } from './analytics.controller';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [AnalyticsController],
  providers: [
    PrismaService,
    AnalyticsService,
    ClickHouseService,
    UserBehaviorService,
    CohortAnalysisService,
    ABTestingService,
    ReportBuilderService,
  ],
  exports: [
    AnalyticsService,
    ClickHouseService,
    UserBehaviorService,
    CohortAnalysisService,
    ABTestingService,
    ReportBuilderService,
  ],
})
export class AnalyticsModule {}
