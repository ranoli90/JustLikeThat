import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobIngestionController } from './job-ingestion.controller';
import { JobIngestionService } from './job-ingestion.service';
import { JobNormalizationService } from './job-normalization.service';
import { RateLimitService } from './rate-limit.service';
import { JobSource } from '../../entities/job-source.entity';
import { IngestionLog } from '../../entities/ingestion-log.entity';
import { JobPosting } from '../../entities/job-posting.entity';

// Integrations
import {
  LinkedInIntegration,
  IndeedIntegration,
  GlassdoorIntegration,
  RemoteCoIntegration,
  WeWorkRemotelyIntegration,
  AngelListIntegration,
  DiceIntegration,
  TechCrunchIntegration,
  GreenhouseIntegration,
  LeverIntegration,
  WorkdayIntegration,
  GenericScraperIntegration,
} from './integrations';

@Module({
  imports: [TypeOrmModule.forFeature([JobSource, IngestionLog, JobPosting])],
  controllers: [JobIngestionController],
  providers: [
    JobIngestionService,
    JobNormalizationService,
    RateLimitService,
    // Job Board Integrations
    LinkedInIntegration,
    IndeedIntegration,
    GlassdoorIntegration,
    RemoteCoIntegration,
    WeWorkRemotelyIntegration,
    AngelListIntegration,
    DiceIntegration,
    TechCrunchIntegration,
    // ATS Integrations
    GreenhouseIntegration,
    LeverIntegration,
    WorkdayIntegration,
    // Scraper Framework
    GenericScraperIntegration,
  ],
  exports: [JobIngestionService, JobNormalizationService, RateLimitService],
})
export class JobIngestionModule {}
