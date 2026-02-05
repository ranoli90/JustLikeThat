import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CDNConfiguration {
  configId: string;
  name: string;
  provider: 'cloudfront' | 'fastly' | 'cloudflare';
  domains: string[];
  originUrl: string;
  sslCertificate: string;
  cachePolicy: {
    defaultTTL: number;
    maxTTL: number;
    minTTL: number;
    staleWhileRevalidate: number;
  };
  optimization: {
    imageOptimization: boolean;
    webp: boolean;
    avif: boolean;
    compression: boolean;
    brotli: boolean;
  };
  rules: CDNRule[];
  status: string;
}

export interface CDNRule {
  id: string;
  pathPattern: string;
  conditions: Record<string, any>;
  actions: {
    cache: boolean;
    ttl: number;
    headers: string[];
    redirect?: string;
  };
  priority: number;
}

export interface CDNAnalytics {
  configId: string;
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  bandwidth: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
}

@Injectable()
export class CDNOptimizationService implements OnModuleInit {
  private readonly logger = new Logger(CDNOptimizationService.name);

  private configurations: Map<string, CDNConfiguration> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default CDN configurations
    await this.initializeDefaultConfigurations();
  }

  private async initializeDefaultConfigurations(): Promise<void> {
    const defaultConfigs: Omit<CDNConfiguration, 'configId' | 'status'>[] = [
      {
        name: 'CloudFront Primary',
        provider: 'cloudfront',
        domains: ['cdn.apply-as-a-service.com', 'static.apply-as-a-service.com'],
        originUrl: 'https://api.apply-as-a-service.com',
        sslCertificate: 'arn:aws:acm:us-east-1:123456789:certificate/xxx',
        cachePolicy: {
          defaultTTL: 3600,
          maxTTL: 31536000,
          minTTL: 0,
          staleWhileRevalidate: 86400,
        },
        optimization: {
          imageOptimization: true,
          webp: true,
          avif: true,
          compression: true,
          brotli: true,
        },
        rules: [
          {
            id: 'images',
            pathPattern: '/images/*',
            conditions: {},
            actions: { cache: true, ttl: 86400, headers: [] },
            priority: 1,
          },
          {
            id: 'static',
            pathPattern: '/static/*',
            conditions: {},
            actions: { cache: true, ttl: 604800, headers: [] },
            priority: 2,
          },
          {
            id: 'api',
            pathPattern: '/api/*',
            conditions: {},
            actions: { cache: false, ttl: 0, headers: [] },
            priority: 3,
          },
        ],
      },
      {
        name: 'Fastly Primary',
        provider: 'fastly',
        domains: ['fastly.apply-as-a-service.com'],
        originUrl: 'https://api.apply-as-a-service.com',
        sslCertificate: 'fastly-cert-id-xxx',
        cachePolicy: {
          defaultTTL: 3600,
          maxTTL: 2592000,
          minTTL: 1,
          staleWhileRevalidate: 3600,
        },
        optimization: {
          imageOptimization: true,
          webp: true,
          avif: false,
          compression: true,
          brotli: true,
        },
        rules: [],
      },
      {
        name: 'Cloudflare Primary',
        provider: 'cloudflare',
        domains: ['cf.apply-as-a-service.com'],
        originUrl: 'https://api.apply-as-a-service.com',
        sslCertificate: 'cloudflare-cert-xxx',
        cachePolicy: {
          defaultTTL: 7200,
          maxTTL: 31536000,
          minTTL: 60,
          staleWhileRevalidate: 43200,
        },
        optimization: {
          imageOptimization: true,
          webp: true,
          avif: true,
          compression: true,
          brotli: true,
        },
        rules: [],
      },
    ];

    for (const config of defaultConfigs) {
      const configId = `cdn-${config.provider}-${Date.now()}`;
      await this.prisma.cDNConfiguration.create({
        data: {
          configId,
          ...config,
          status: 'active',
        },
      });
      this.logger.log(`Initialized CDN configuration: ${config.name}`);
    }
  }

  async getAllConfigurations(): Promise<CDNConfiguration[]> {
    const configs = await this.prisma.cDNConfiguration.findMany();
    return configs.map(c => ({
      configId: c.configId,
      name: c.name,
      provider: c.provider as any,
      domains: c.domains,
      originUrl: c.originUrl,
      sslCertificate: c.sslCertificate,
      cachePolicy: c.cachePolicy as any,
      optimization: c.optimization as any,
      rules: c.rules as any[],
      status: c.status,
    }));
  }

  async getConfigurationById(configId: string): Promise<CDNConfiguration | null> {
    const c = await this.prisma.cDNConfiguration.findUnique({
      where: { configId },
    });

    if (!c) return null;

    return {
      configId: c.configId,
      name: c.name,
      provider: c.provider as any,
      domains: c.domains,
      originUrl: c.originUrl,
      sslCertificate: c.sslCertificate,
      cachePolicy: c.cachePolicy as any,
      optimization: c.optimization as any,
      rules: c.rules as any[],
      status: c.status,
    };
  }

  async createConfiguration(data: Omit<CDNConfiguration, 'configId' | 'status'>): Promise<CDNConfiguration> {
    const configId = `cdn-${data.provider}-${Date.now()}`;
    
    const config = await this.prisma.cDNConfiguration.create({
      data: {
        configId,
        ...data,
        status: 'active',
      },
    });

    this.logger.log(`Created CDN configuration: ${config.name}`);

    return {
      configId: config.configId,
      name: config.name,
      provider: config.provider as any,
      domains: config.domains,
      originUrl: config.originUrl,
      sslCertificate: config.sslCertificate,
      cachePolicy: config.cachePolicy as any,
      optimization: config.optimization as any,
      rules: config.rules as any[],
      status: config.status,
    };
  }

  async updateConfiguration(configId: string, updates: Partial<CDNConfiguration>): Promise<CDNConfiguration | null> {
    const config = await this.prisma.cDNConfiguration.update({
      where: { configId },
      data: updates as any,
    });

    this.logger.log(`Updated CDN configuration: ${config.name}`);

    return {
      configId: config.configId,
      name: config.name,
      provider: config.provider as any,
      domains: config.domains,
      originUrl: config.originUrl,
      sslCertificate: config.sslCertificate,
      cachePolicy: config.cachePolicy as any,
      optimization: config.optimization as any,
      rules: config.rules as any[],
      status: config.status,
    };
  }

  async deleteConfiguration(configId: string): Promise<void> {
    await this.prisma.cDNConfiguration.delete({
      where: { configId },
    });
    this.logger.log(`Deleted CDN configuration: ${configId}`);
  }

  async purgeCache(configId: string, paths: string[]): Promise<{ success: boolean; purgedPaths: number }> {
    this.logger.log(`Purging cache for config ${configId}: ${paths.length} paths`);
    
    // Simulate cache purge
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      purgedPaths: paths.length,
    };
  }

  async getAnalytics(configId: string): Promise<CDNAnalytics> {
    // Simulate analytics data
    const requests = Math.floor(Math.random() * 10000000) + 1000000;
    const cacheHits = Math.floor(requests * (0.85 + Math.random() * 0.1));
    const cacheMisses = requests - cacheHits;

    return {
      configId,
      requests,
      cacheHits,
      cacheMisses,
      bandwidth: Math.floor(Math.random() * 10000000000) + 1000000000,
      latencyP50: Math.random() * 20 + 10,
      latencyP95: Math.random() * 50 + 30,
      latencyP99: Math.random() * 100 + 50,
    };
  }

  async getGlobalAnalytics(): Promise<CDNAnalytics[]> {
    const configs = await this.getAllConfigurations();
    const analyticsPromises = configs.map(c => this.getAnalytics(c.configId));
    return Promise.all(analyticsPromises);
  }

  async calculateCacheHitRatio(): Promise<number> {
    const analytics = await this.getGlobalAnalytics();
    const totalRequests = analytics.reduce((sum, a) => sum + a.requests, 0);
    const totalHits = analytics.reduce((sum, a) => sum + a.cacheHits, 0);
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  async addRule(configId: string, rule: Omit<CDNRule, 'id'>): Promise<CDNConfiguration | null> {
    const config = await this.getConfigurationById(configId);
    if (!config) return null;

    const newRule: CDNRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };

    const rules = [...config.rules, newRule];
    
    return this.updateConfiguration(configId, { rules: rules as any[] });
  }

  async removeRule(configId: string, ruleId: string): Promise<CDNConfiguration | null> {
    const config = await this.getConfigurationById(configId);
    if (!config) return null;

    const rules = config.rules.filter(r => r.id !== ruleId);
    return this.updateConfiguration(configId, { rules: rules as any[] });
  }

  async optimizeImages(configId: string, enabled: boolean, formats: string[]): Promise<CDNConfiguration | null> {
    const optimization = {
      imageOptimization: enabled,
      webp: formats.includes('webp'),
      avif: formats.includes('avif'),
      compression: true,
      brotli: true,
    };
    return this.updateConfiguration(configId, { optimization: optimization as any });
  }
}
