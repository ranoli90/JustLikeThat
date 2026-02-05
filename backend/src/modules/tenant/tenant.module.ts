import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantService } from './services/tenant.service';
import { TenantController } from './controllers/tenant.controller';
import { BrandingService } from './services/branding.service';
import { BrandingController } from './controllers/branding.controller';
import { FeatureFlagService } from './services/feature-flag.service';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { BillingService } from './services/billing.service';
import { BillingController } from './controllers/billing.controller';
import { DomainService } from './services/domain.service';
import { DomainController } from './controllers/domain.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookController } from './controllers/webhook.controller';
import { TenantIsolationService } from './services/tenant-isolation.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TenantController,
    BrandingController,
    FeatureFlagController,
    BillingController,
    DomainController,
    WebhookController,
  ],
  providers: [
    TenantService,
    BrandingService,
    FeatureFlagService,
    BillingService,
    DomainService,
    WebhookService,
    TenantIsolationService,
  ],
  exports: [
    TenantService,
    BrandingService,
    FeatureFlagService,
    BillingService,
    DomainService,
    TenantIsolationService,
  ],
})
export class TenantModule {}
