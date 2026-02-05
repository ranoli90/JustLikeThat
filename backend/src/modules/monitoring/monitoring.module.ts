import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { TracingService } from './services/tracing.service';
import { MetricsService } from './services/metrics.service';
import { AlertingService } from './services/alerting.service';
import { SLOService } from './services/slo.service';
import { RemediationService } from './services/remediation.service';
import { LogService } from './services/log.service';
import { PrismaModule } from '../../modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [
    TracingService,
    MetricsService,
    AlertingService,
    SLOService,
    RemediationService,
    LogService,
  ],
  exports: [
    TracingService,
    MetricsService,
    AlertingService,
    SLOService,
    RemediationService,
    LogService,
  ],
})
export class MonitoringModule {}
