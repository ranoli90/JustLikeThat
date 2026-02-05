// ============ INTEGRATIONS MODULE ============

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionService } from './common/encryption.service';
import { IntegrationController } from './controllers/integration.controller';
import { JobBoardService } from './services/job-board.service';
import { LinkedInService } from './services/job-boards/linkedin.service';
import { IndeedService } from './services/job-boards/indeed.service';
import { GlassdoorService } from './services/job-boards/glassdoor.service';
import { AtsService } from './services/ats.service';
import { GreenhouseService } from './services/ats/greenhouse.service';
import { LeverService } from './services/ats/lever.service';
import { HrisService } from './services/hris.service';
import { BambooHrService } from './services/hris/bamboohr.service';
import { BackgroundCheckService } from './services/background-check.service';
import { CheckrService } from './services/background-check/checkr.service';
import { SchedulingService } from './services/scheduling.service';
import { CalendlyService } from './services/scheduling/calendly.service';
import { LmsService } from './services/lms.service';
import { TeamChatService } from './services/team-chat.service';
import { SlackService } from './services/team-chat/slack.service';
import { TeamsService } from './services/team-chat/teams.service';
import { SsoService } from './services/sso.service';
import { OktaService } from './services/sso/okta.service';
import { AzureAdService } from './services/sso/azure-ad.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [IntegrationController],
  providers: [
    EncryptionService,
    // Job Boards
    JobBoardService,
    LinkedInService,
    IndeedService,
    GlassdoorService,
    // ATS
    AtsService,
    GreenhouseService,
    LeverService,
    // HRIS
    HrisService,
    BambooHrService,
    // Background Checks
    BackgroundCheckService,
    CheckrService,
    // Scheduling
    SchedulingService,
    CalendlyService,
    // LMS
    LmsService,
    // Team Chat
    TeamChatService,
    SlackService,
    TeamsService,
    // SSO
    SsoService,
    OktaService,
    AzureAdService,
  ],
  exports: [
    JobBoardService,
    AtsService,
    HrisService,
    BackgroundCheckService,
    SchedulingService,
    LmsService,
    TeamChatService,
    SsoService,
  ],
})
export class IntegrationsModule {}
