import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ShardStrategy {
  name: string;
  calculateShardId(key: string, shardCount: number): number;
}

@Injectable()
export class ShardStrategyService {
  private readonly logger = new Logger(ShardStrategyService.name);
  private strategies: Map<string, ShardStrategy> = new Map();

  constructor() {
    // Register default strategies
    this.registerStrategy('hash', new HashShardingStrategy());
    this.registerStrategy('range', new RangeShardingStrategy());
    this.registerStrategy('geo', new GeoShardingStrategy());
    this.registerStrategy('tenant', new TenantShardingStrategy());
  }

  registerStrategy(name: string, strategy: ShardStrategy): void {
    this.strategies.set(name, strategy);
    this.logger.log(`Registered sharding strategy: ${name}`);
  }

  getStrategy(name: string): ShardStrategy | undefined {
    return this.strategies.get(name);
  }

  calculateShardId(
    key: string,
    shardCount: number,
    strategy: string = 'hash',
  ): number {
    const selectedStrategy = this.strategies.get(strategy);
    
    if (!selectedStrategy) {
      this.logger.warn(`Strategy ${strategy} not found, using hash strategy`);
      return this.strategies.get('hash')!.calculateShardId(key, shardCount);
    }

    return selectedStrategy.calculateShardId(key, shardCount);
  }

  // Auto-select best strategy based on data characteristics
  autoSelectStrategy(entityType: string, sampleData: any[]): string {
    // Check if data has geographic distribution
    if (sampleData.some(item => item.latitude !== undefined && item.longitude !== undefined)) {
      return 'geo';
    }

    // Check if data has tenant ID
    if (sampleData.some(item => item.tenantId !== undefined)) {
      return 'tenant';
    }

    // Check if data has date ranges
    if (sampleData.some(item => item.createdAt !== undefined)) {
      return 'range';
    }

    // Default to hash for uniform distribution
    return 'hash';
  }
}

// Hash-based sharding using consistent hashing
class HashShardingStrategy implements ShardStrategy {
  private readonly virtualNodes = 256;

  calculateShardId(key: string, shardCount: number): number {
    const hash = crypto.createHash('md5').update(key).digest();
    const numericHash = hash.readUInt32BE(0);
    return numericHash % shardCount;
  }
}

// Range-based sharding for time-series data
class RangeShardingStrategy implements ShardStrategy {
  calculateShardId(key: string, shardCount: number): number {
    // Parse date from key
    const date = new Date(key);
    if (isNaN(date.getTime())) {
      // If not a date, use hash
      return new HashShardingStrategy().calculateShardId(key, shardCount);
    }

    // Calculate shard based on time range
    const startDate = new Date('2024-01-01');
    const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const shardInterval = Math.ceil(365 / shardCount); // Approximately 1 month per shard
    
    return Math.floor(daysSinceStart / shardInterval) % shardCount;
  }
}

// Geographic sharding for location-based data
class GeoShardingStrategy implements ShardStrategy {
  private readonly geoShards: Map<string, number> = new Map([
    ['us-east', 0],
    ['us-west', 1],
    ['eu-west', 2],
    ['eu-east', 3],
    ['asia-pacific', 4],
    ['south-america', 5],
    // Additional shards for other regions
  ]);

  calculateShardId(key: string, shardCount: number): number {
    // Parse coordinates from key (format: "lat,lng")
    const [lat, lng] = key.split(',').map(Number);
    
    if (isNaN(lat) || isNaN(lng)) {
      return new HashShardingStrategy().calculateShardId(key, shardCount);
    }

    // Determine region from coordinates
    const region = this.getRegionFromCoords(lat, lng);
    const baseShard = this.geoShards.get(region) || 0;

    // Add sub-shard for additional distribution
    const subShard = Math.abs(crypto.createHash('md5').update(key).digest()[0]) % 4;

    return (baseShard + subShard) % shardCount;
  }

  private getRegionFromCoords(lat: number, lng: number): string {
    if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -65) {
      return 'us-west';
    }
    if (lat >= 25 && lat <= 50 && lng >= -90 && lng <= -65) {
      return 'us-east';
    }
    if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
      return 'eu-west';
    }
    if (lat >= 35 && lat <= 70 && lng >= 40 && lng <= 60) {
      return 'eu-east';
    }
    if (lat >= -50 && lat <= 50 && lng >= 60 && lng <= 150) {
      return 'asia-pacific';
    }
    if (lat >= -60 && lat <= 15 && lng >= -80 && lng <= -35) {
      return 'south-america';
    }
    return 'us-east'; // Default
  }
}

// Tenant-based sharding for multi-tenant applications
class TenantShardingStrategy implements ShardStrategy {
  private readonly tenantShardMap: Map<string, number> = new Map();

  calculateShardId(key: string, shardCount: number): number {
    // Extract tenant ID from key (format: "tenantId:entityId")
    const [tenantId] = key.split(':');

    if (!tenantId) {
      return new HashShardingStrategy().calculateShardId(key, shardCount);
    }

    // Check if tenant already has an assigned shard
    if (this.tenantShardMap.has(tenantId)) {
      return this.tenantShardMap.get(tenantId)!;
    }

    // Assign new shard using hash
    const shardId = new HashShardingStrategy().calculateShardId(tenantId, shardCount);
    this.tenantShardMap.set(tenantId, shardId);

    return shardId;
  }
}
