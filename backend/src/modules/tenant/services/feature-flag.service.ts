import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async getFeatures(tenantId: string) {
    return this.prisma.tenantFeatureFlag.findMany({
      where: { tenantId },
      orderBy: { priority: 'desc' },
    });
  }

  async getFeature(tenantId: string, featureKey: string) {
    const feature = await this.prisma.tenantFeatureFlag.findUnique({
      where: { tenantId_featureKey: { tenantId, featureKey } },
    });

    if (!feature) {
      // Return default if not found
      return { featureKey, isEnabled: true, config: null };
    }

    return feature;
  }

  async isEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const feature = await this.getFeature(tenantId, featureKey);
    return feature.isEnabled;
  }

  async isDisabled(tenantId: string, featureKey: string): Promise<boolean> {
    return !(await this.isEnabled(tenantId, featureKey));
  }

  async updateFeature(tenantId: string, featureKey: string, data: {
    isEnabled?: boolean;
    config?: any;
    priority?: number;
    expiresAt?: Date;
  }) {
    return this.prisma.tenantFeatureFlag.upsert({
      where: { tenantId_featureKey: { tenantId, featureKey } },
      create: {
        tenantId,
        featureKey,
        featureName: featureKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...data,
      },
      update: data,
    });
  }

  async deleteFeature(tenantId: string, featureKey: string) {
    await this.prisma.tenantFeatureFlag.delete({
      where: { tenantId_featureKey: { tenantId, featureKey } },
    });
    return { success: true };
  }

  async getEnabledFeatures(tenantId: string) {
    const now = new Date();
    return this.prisma.tenantFeatureFlag.findMany({
      where: {
        tenantId,
        isEnabled: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });
  }

  async getDisabledFeatures(tenantId: string) {
    return this.prisma.tenantFeatureFlag.findMany({
      where: { tenantId, isEnabled: false },
    });
  }

  async bulkUpdate(tenantId: string, features: Array<{
    featureKey: string;
    isEnabled: boolean;
    config?: any;
  }>) {
    const results = await Promise.all(
      features.map(f => 
        this.updateFeature(tenantId, f.featureKey, {
          isEnabled: f.isEnabled,
          config: f.config,
        })
      )
    );
    return results;
  }

  async getFeatureConfig(tenantId: string, featureKey: string): Promise<any> {
    const feature = await this.getFeature(tenantId, featureKey);
    return feature.config || {};
  }

  async toggleFeature(tenantId: string, featureKey: string) {
    const feature = await this.getFeature(tenantId, featureKey);
    return this.updateFeature(tenantId, featureKey, {
      isEnabled: !feature.isEnabled,
    });
  }

  async setFeatureExpiry(tenantId: string, featureKey: string, expiresAt: Date) {
    return this.updateFeature(tenantId, featureKey, { expiresAt });
  }

  // Built-in feature flags
  readonly DEFAULT_FEATURES = {
    'analytics': { name: 'Analytics Dashboard', description: 'Enable analytics and reporting' },
    'ab-testing': { name: 'A/B Testing', description: 'Run A/B tests on your pages' },
    'email-notifications': { name: 'Email Notifications', description: 'Send email notifications to users' },
    'sms-notifications': { name: 'SMS Notifications', description: 'Send SMS notifications to users' },
    'api-access': { name: 'API Access', description: 'Allow API access for integrations' },
    'webhooks': { name: 'Webhooks', description: 'Configure webhooks for events' },
    'custom-domains': { name: 'Custom Domains', description: 'Allow custom domain configuration' },
    'white-label': { name: 'White Label', description: 'Full white-label customization' },
    'advanced-branding': { name: 'Advanced Branding', description: 'Extended branding options' },
    'usage-analytics': { name: 'Usage Analytics', description: 'Track feature usage metrics' },
    'sla-support': { name: 'SLA Support', description: 'Priority support and SLA guarantees' },
    'dedicated-infra': { name: 'Dedicated Infrastructure', description: 'Isolated infrastructure resources' },
    'team-seats': { name: 'Team Seats', description: 'Unlimited team member seats' },
    'integrations': { name: 'Integrations', description: 'Third-party integrations' },
    'custom-workflows': { name: 'Custom Workflows', description: 'Create custom automation workflows' },
  };

  async initializeDefaultFeatures(tenantId: string) {
    const features = Object.entries(this.DEFAULT_FEATURES).map(([key, config]) => ({
      tenantId,
      featureKey: key,
      featureName: config.name,
      isEnabled: true,
      config: { description: config.description },
    }));

    // Use transaction to create all features
    await this.prisma.$transaction(
      features.map(f => 
        this.prisma.tenantFeatureFlag.upsert({
          where: { tenantId_featureKey: { tenantId, featureKey: f.featureKey } },
          create: f,
          update: {},
        })
      )
    );

    return features;
  }
}
