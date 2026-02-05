import { Module } from '@nestjs/common';
import { MaturityController } from './controllers/maturity.controller';
import { DocumentationService } from './services/documentation.service';
import { TrainingService } from './services/training.service';
import { RunbookService } from './services/runbook.service';
import { ReleaseManagementService } from './services/release-management.service';
import { QualityAssuranceService } from './services/quality-assurance.service';
import { SignOffService } from './services/sign-off.service';
import { PlatformMetricsService } from './services/platform-metrics.service';
import { FAQService } from './services/faq.service';
import { KnowledgeTransferService } from './services/knowledge-transfer.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaturityController],
  providers: [
    DocumentationService,
    TrainingService,
    RunbookService,
    ReleaseManagementService,
    QualityAssuranceService,
    SignOffService,
    PlatformMetricsService,
    FAQService,
    KnowledgeTransferService,
  ],
  exports: [
    DocumentationService,
    TrainingService,
    RunbookService,
    ReleaseManagementService,
    QualityAssuranceService,
    SignOffService,
    PlatformMetricsService,
    FAQService,
    KnowledgeTransferService,
  ],
})
export class MaturityModule {}
