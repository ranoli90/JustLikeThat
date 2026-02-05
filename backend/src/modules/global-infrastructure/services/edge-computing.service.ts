import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EdgeLocation {
  locationId: string;
  provider: 'cloudflare' | 'fastly' | 'aws';
  region: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface EdgeFunction {
  functionId: string;
  name: string;
  provider: 'cloudflare' | 'aws' | 'gcp';
  code: string;
  runtime: string;
  memory: number;
  timeout: number;
  environment: Record<string, string>;
  routes: string[];
  version: number;
  status: 'deployed' | 'testing' | 'failed';
}

export interface EdgeMetrics {
  locationId: string;
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  latency: number;
  errorRate: number;
}

@Injectable()
export class EdgeComputingService implements OnModuleInit {
  private readonly logger = new Logger(EdgeComputingService.name);

  // Major edge locations worldwide
  private readonly edgeLocations: EdgeLocation[] = [
    // North America
    { locationId: 'cf-us-east-1', provider: 'cloudflare', region: 'us-east-1', city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060, isActive: true },
    { locationId: 'cf-us-west-1', provider: 'cloudflare', region: 'us-west-2', city: 'Los Angeles', country: 'US', latitude: 34.0522, longitude: -118.2437, isActive: true },
    { locationId: 'cf-us-central', provider: 'cloudflare', region: 'us-central1', city: 'Chicago', country: 'US', latitude: 41.8781, longitude: -87.6298, isActive: true },
    { locationId: 'fastly-ca-east', provider: 'fastly', region: 'ca-central-1', city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, isActive: true },
    { locationId: 'aws-us-east-1', provider: 'aws', region: 'us-east-1', city: 'Ashburn', country: 'US', latitude: 39.0438, longitude: -77.4874, isActive: true },
    // Europe
    { locationId: 'cf-eu-west-1', provider: 'cloudflare', region: 'eu-west-1', city: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278, isActive: true },
    { locationId: 'cf-eu-central', provider: 'cloudflare', region: 'europe-west1', city: 'Frankfurt', country: 'Germany', latitude: 50.1109, longitude: 8.6821, isActive: true },
    { locationId: 'cf-eu-west-2', provider: 'cloudflare', region: 'eu-west-2', city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, isActive: true },
    { locationId: 'fastly-eu-west-1', provider: 'fastly', region: 'eu-west-1', city: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, isActive: true },
    // Asia Pacific
    { locationId: 'cf-ap-nortast', provider: 'cloudflare', region: 'asia-northeast1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, isActive: true },
    { locationId: 'cf-ap-southeast', provider: 'cloudflare', region: 'ap-southeast-1', city: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, isActive: true },
    { locationId: 'cf-ap-south', provider: 'cloudflare', region: 'ap-south-1', city: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, isActive: true },
    { locationId: 'cf-ap-southeast-2', provider: 'cloudflare', region: 'ap-southeast-2', city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, isActive: true },
    { locationId: 'aws-ap-northeast-1', provider: 'aws', region: 'ap-northeast-1', city: 'Tokyo', country: 'Japan', latitude: 35.5095, longitude: 139.5797, isActive: true },
    // South America
    { locationId: 'cf-sa-east-1', provider: 'cloudflare', region: 'sa-east-1', city: 'São Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333, isActive: true },
    // Africa
    { locationId: 'cf-africa', provider: 'cloudflare', region: 'af-south-1', city: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, isActive: true },
  ];

  private deployedFunctions: Map<string, EdgeFunction> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize edge locations
    for (const location of this.edgeLocations) {
      await this.ensureLocationExists(location);
    }
  }

  private async ensureLocationExists(location: EdgeLocation): Promise<void> {
    const existing = await this.prisma.edgeLocation.findUnique({
      where: { locationId: location.locationId },
    });

    if (!existing) {
      await this.prisma.edgeLocation.create({
        data: location,
      });
      this.logger.log(`Initialized edge location: ${location.city}, ${location.country}`);
    }
  }

  async getAllEdgeLocations(): Promise<EdgeLocation[]> {
    return this.prisma.edgeLocation.findMany({
      where: { isActive: true },
    });
  }

  async getEdgeLocationById(locationId: string): Promise<EdgeLocation | null> {
    return this.prisma.edgeLocation.findUnique({
      where: { locationId },
    });
  }

  async deployEdgeFunction(functionData: Omit<EdgeFunction, 'functionId' | 'version' | 'status' | 'lastDeployedAt'>): Promise<EdgeFunction> {
    const functionId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate deployment
    const edgeFunction: EdgeFunction = {
      ...functionData,
      functionId,
      version: 1,
      status: 'deployed',
    };

    this.deployedFunctions.set(functionId, edgeFunction);

    // Store in database
    await this.prisma.edgeFunction.create({
      data: {
        functionId,
        name: edgeFunction.name,
        provider: edgeFunction.provider,
        code: edgeFunction.code,
        runtime: edgeFunction.runtime,
        memory: edgeFunction.memory,
        timeout: edgeFunction.timeout,
        environment: edgeFunction.environment as any,
        routes: edgeFunction.routes,
        status: edgeFunction.status,
      },
    });

    this.logger.log(`Deployed edge function: ${edgeFunction.name} to ${edgeFunction.provider}`);

    return edgeFunction;
  }

  async getEdgeFunctions(): Promise<EdgeFunction[]> {
    const functions = await this.prisma.edgeFunction.findMany({
      orderBy: { lastDeployedAt: 'desc' },
    });

    return functions.map(f => ({
      functionId: f.functionId,
      name: f.name,
      provider: f.provider,
      code: f.code,
      runtime: f.runtime,
      memory: f.memory,
      timeout: f.timeout,
      environment: f.environment as Record<string, string>,
      routes: f.routes,
      version: f.version,
      status: f.status,
    }));
  }

  async getEdgeFunctionById(functionId: string): Promise<EdgeFunction | null> {
    const f = await this.prisma.edgeFunction.findUnique({
      where: { functionId },
    });

    if (!f) return null;

    return {
      functionId: f.functionId,
      name: f.name,
      provider: f.provider,
      code: f.code,
      runtime: f.runtime,
      memory: f.memory,
      timeout: f.timeout,
      environment: f.environment as Record<string, string>,
      routes: f.routes,
      version: f.version,
      status: f.status,
    };
  }

  async updateEdgeFunction(functionId: string, updates: Partial<EdgeFunction>): Promise<EdgeFunction | null> {
    const existing = await this.getEdgeFunctionById(functionId);
    if (!existing) return null;

    const updated = await this.prisma.edgeFunction.update({
      where: { functionId },
      data: {
        ...updates,
        version: existing.version + 1,
        lastDeployedAt: new Date(),
      },
    });

    this.logger.log(`Updated edge function: ${functionId} to version ${updated.version}`);

    return {
      functionId: updated.functionId,
      name: updated.name,
      provider: updated.provider,
      code: updated.code,
      runtime: updated.runtime,
      memory: updated.memory,
      timeout: updated.timeout,
      environment: updated.environment as Record<string, string>,
      routes: updated.routes,
      version: updated.version,
      status: updated.status,
    };
  }

  async deleteEdgeFunction(functionId: string): Promise<void> {
    await this.prisma.edgeFunction.delete({
      where: { functionId },
    });
    this.deployedFunctions.delete(functionId);
    this.logger.log(`Deleted edge function: ${functionId}`);
  }

  async getEdgeMetrics(locationId: string): Promise<EdgeMetrics> {
    // Simulate metrics for demonstration
    return {
      locationId,
      requests: Math.floor(Math.random() * 100000) + 10000,
      cacheHits: Math.floor(Math.random() * 90000) + 5000,
      cacheMisses: Math.floor(Math.random() * 10000) + 1000,
      latency: Math.random() * 50 + 5,
      errorRate: Math.random() * 0.01,
    };
  }

  async getGlobalEdgeMetrics(): Promise<EdgeMetrics[]> {
    const locations = await this.getAllEdgeLocations();
    const metricsPromises = locations.map(l => this.getEdgeMetrics(l.locationId));
    return Promise.all(metricsPromises);
  }

  async calculateCacheHitRate(): Promise<number> {
    const metrics = await this.getGlobalEdgeMetrics();
    const totalRequests = metrics.reduce((sum, m) => sum + m.requests, 0);
    const totalHits = metrics.reduce((sum, m) => sum + m.cacheHits, 0);
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  async getOptimalEdgeLocation(userLat: number, userLng: number): Promise<EdgeLocation | null> {
    const locations = await this.getAllEdgeLocations();
    
    if (locations.length === 0) return null;

    // Find closest edge location by distance
    let optimal = locations[0];
    let minDistance = this.calculateDistance(userLat, userLng, optimal.latitude, optimal.longitude);

    for (const location of locations.slice(1)) {
      const distance = this.calculateDistance(userLat, userLng, location.latitude, location.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        optimal = location;
      }
    }

    return optimal;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
