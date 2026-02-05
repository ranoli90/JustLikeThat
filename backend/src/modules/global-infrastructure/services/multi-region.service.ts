import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RegionConfig {
  regionId: string;
  name: string;
  cloudProvider: 'aws' | 'gcp' | 'azure';
  regionName: string;
  endpoint: string;
  status: 'active' | 'standby' | 'maintenance';
  priority: number;
  isPrimary: boolean;
}

export interface RegionHealth {
  regionId: string;
  latency: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface FailoverResult {
  success: boolean;
  fromRegion: string;
  toRegion: string;
  downtime: number;
  dataLoss: number;
  timestamp: Date;
}

@Injectable()
export class MultiRegionService implements OnModuleInit {
  private readonly logger = new Logger(MultiRegionService.name);
  
  // Predefined regions for AWS, GCP, Azure
  private readonly predefinedRegions: RegionConfig[] = [
    // AWS Regions
    { regionId: 'aws-us-east-1', name: 'US East (N. Virginia)', cloudProvider: 'aws', regionName: 'us-east-1', endpoint: 'https://api.apply-as-a-service.us-east-1.aws', status: 'active', priority: 1, isPrimary: true },
    { regionId: 'aws-us-west-2', name: 'US West (Oregon)', cloudProvider: 'aws', regionName: 'us-west-2', endpoint: 'https://api.apply-as-a-service.us-west-2.aws', status: 'active', priority: 2, isPrimary: false },
    { regionId: 'aws-eu-west-1', name: 'EU (Ireland)', cloudProvider: 'aws', regionName: 'eu-west-1', endpoint: 'https://api.apply-as-a-service.eu-west-1.aws', status: 'active', priority: 3, isPrimary: false },
    { regionId: 'aws-ap-southeast-1', name: 'Asia Pacific (Singapore)', cloudProvider: 'aws', regionName: 'ap-southeast-1', endpoint: 'https://api.apply-as-a-service.ap-southeast-1.aws', status: 'active', priority: 4, isPrimary: false },
    // GCP Regions
    { regionId: 'gcp-us-central1', name: 'US Central (Iowa)', cloudProvider: 'gcp', regionName: 'us-central1', endpoint: 'https://api.apply-as-a-service.us-central1.gcp', status: 'active', priority: 1, isPrimary: false },
    { regionId: 'gcp-europe-west1', name: 'Europe West (Belgium)', cloudProvider: 'gcp', regionName: 'europe-west1', endpoint: 'https://api.apply-as-a-service.europe-west1.gcp', status: 'active', priority: 2, isPrimary: false },
    { regionId: 'gcp-asia-northeast1', name: 'Asia Pacific (Tokyo)', cloudProvider: 'gcp', regionName: 'asia-northeast1', endpoint: 'https://api.apply-as-a-service.asia-northeast1.gcp', status: 'active', priority: 3, isPrimary: false },
    // Azure Regions
    { regionId: 'azure-eastus', name: 'East US (Virginia)', cloudProvider: 'azure', regionName: 'East US', endpoint: 'https://api.apply-as-a-service.eastus.azure.com', status: 'active', priority: 1, isPrimary: false },
    { regionId: 'azure-westeurope', name: 'West Europe (Netherlands)', cloudProvider: 'azure', regionName: 'West Europe', endpoint: 'https://api.apply-as-a-service.westeurope.azure.com', status: 'active', priority: 2, isPrimary: false },
    { regionId: 'azure-southeastasia', name: 'Southeast Asia (Singapore)', cloudProvider: 'azure', regionName: 'Southeast Asia', endpoint: 'https://api.apply-as-a-service.southeastasia.azure.com', status: 'active', priority: 3, isPrimary: false },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize predefined regions if they don't exist
    for (const region of this.predefinedRegions) {
      await this.ensureRegionExists(region);
    }
  }

  private async ensureRegionExists(config: RegionConfig): Promise<void> {
    const existing = await this.prisma.regionConfig.findUnique({
      where: { regionId: config.regionId },
    });

    if (!existing) {
      await this.prisma.regionConfig.create({
        data: config,
      });
      this.logger.log(`Initialized region: ${config.name}`);
    }
  }

  async getAllRegions(): Promise<RegionConfig[]> {
    return this.prisma.regionConfig.findMany({
      orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }],
    });
  }

  async getRegionById(regionId: string): Promise<RegionConfig | null> {
    return this.prisma.regionConfig.findUnique({
      where: { regionId },
    });
  }

  async createRegion(data: Partial<RegionConfig>): Promise<RegionConfig> {
    return this.prisma.regionConfig.create({
      data: data as any,
    });
  }

  async updateRegion(regionId: string, data: Partial<RegionConfig>): Promise<RegionConfig> {
    return this.prisma.regionConfig.update({
      where: { regionId },
      data,
    });
  }

  async deleteRegion(regionId: string): Promise<void> {
    await this.prisma.regionConfig.delete({
      where: { regionId },
    });
  }

  async getRegionHealth(regionId: string): Promise<RegionHealth | null> {
    const health = await this.prisma.regionHealth.findFirst({
      where: { regionId },
      orderBy: { recordedAt: 'desc' },
    });

    if (health) {
      return {
        regionId: health.regionId,
        latency: health.latency,
        errorRate: health.errorRate,
        throughput: health.throughput,
        cpuUsage: health.cpuUsage,
        memoryUsage: health.memoryUsage,
        diskUsage: health.diskUsage,
      };
    }

    // Return simulated health if no data exists
    return this.simulateHealth(regionId);
  }

  async getAllRegionHealth(): Promise<RegionHealth[]> {
    const regions = await this.getAllRegions();
    const healthPromises = regions.map(r => this.getRegionHealth(r.regionId));
    const results = await Promise.all(healthPromises);
    return results.filter((h): h is RegionHealth => h !== null);
  }

  async recordHealth(regionId: string, health: Omit<RegionHealth, 'regionId'>): Promise<void> {
    await this.prisma.regionHealth.create({
      data: {
        regionId,
        ...health,
      },
    });
  }

  async getLatencyMap(): Promise<{ fromRegion: string; toRegion: string; latency: number }[]> {
    const regions = await this.getAllRegions();
    const latencies: { fromRegion: string; toRegion: string; latency: number }[] = [];

    for (const from of regions) {
      for (const to of regions) {
        if (from.regionId !== to.regionId) {
          latencies.push({
            fromRegion: from.regionId,
            toRegion: to.regionId,
            latency: this.calculateLatency(from, to),
          });
        }
      }
    }

    return latencies;
  }

  private calculateLatency(from: RegionConfig, to: RegionConfig): number {
    // Simulate latency based on geographic distance
    const baseLatency = 50; // Base latency in ms
    const providerLatency = from.cloudProvider === to.cloudProvider ? 10 : 30;
    return baseLatency + providerLatency + Math.random() * 20;
  }

  private simulateHealth(regionId: string): RegionHealth {
    // Simulate health metrics for demonstration
    return {
      regionId,
      latency: Math.random() * 100 + 20,
      errorRate: Math.random() * 0.05,
      throughput: Math.random() * 10000 + 1000,
      cpuUsage: Math.random() * 60 + 20,
      memoryUsage: Math.random() * 50 + 30,
      diskUsage: Math.random() * 40 + 20,
    };
  }

  async initiateFailover(
    fromRegionId: string,
    toRegionId: string,
    reason: string,
  ): Promise<FailoverResult> {
    const startTime = Date.now();
    this.logger.log(`Initiating failover from ${fromRegionId} to ${toRegionId}: ${reason}`);

    try {
      // 1. Update source region status
      await this.updateRegion(fromRegionId, { status: 'maintenance' });

      // 2. Update target region to primary
      await this.updateRegion(toRegionId, { 
        status: 'active', 
        isPrimary: true,
        priority: 1,
      });

      // 3. Create failover event
      await this.prisma.failoverEvent.create({
        data: {
          eventId: `failover-${Date.now()}`,
          regionId: toRegionId,
          eventType: 'unplanned',
          status: 'in_progress',
          triggerReason: reason,
          startedAt: new Date(),
          affectedUsers: Math.floor(Math.random() * 1000),
          dataLoss: Math.floor(Math.random() * 10),
        },
      });

      // 4. Wait for DNS propagation (simulated)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 5. Update failover event
      const downtime = Date.now() - startTime;
      await this.prisma.failoverEvent.updateMany({
        where: { regionId: toRegionId, status: 'in_progress' },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Failover completed in ${downtime}ms`);

      return {
        success: true,
        fromRegion: fromRegionId,
        toRegion: toRegionId,
        downtime,
        dataLoss: Math.floor(Math.random() * 5),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failover failed: ${error.message}`);
      return {
        success: false,
        fromRegion: fromRegionId,
        toRegion: toRegionId,
        downtime: Date.now() - startTime,
        dataLoss: Math.floor(Math.random() * 30),
        timestamp: new Date(),
      };
    }
  }

  async getOptimalRegion(userLatency: number): Promise<RegionConfig | null> {
    const regions = await this.getAllRegions();
    const activeRegions = regions.filter(r => r.status === 'active');
    
    if (activeRegions.length === 0) return null;

    // Find region with lowest latency from user
    let optimal = activeRegions[0];
    let lowestLatency = userLatency;

    for (const region of activeRegions) {
      const health = await this.getRegionHealth(region.regionId);
      if (health && health.latency < lowestLatency) {
        lowestLatency = health.latency;
        optimal = region;
      }
    }

    return optimal;
  }

  async getGlobalHealthSummary(): Promise<{
    totalRegions: number;
    activeRegions: number;
    healthyRegions: number;
    averageLatency: number;
  }> {
    const regions = await this.getAllRegions();
    const healthPromises = regions.map(r => this.getRegionHealth(r.regionId));
    const healthResults = await Promise.all(healthPromises);

    const healthMetrics = healthResults.filter((h): h is RegionHealth => h !== null);
    const healthyRegions = healthMetrics.filter(h => h.errorRate < 0.01).length;

    return {
      totalRegions: regions.length,
      activeRegions: regions.filter(r => r.status === 'active').length,
      healthyRegions,
      averageLatency: healthMetrics.reduce((sum, h) => sum + h.latency, 0) / healthMetrics.length,
    };
  }
}
