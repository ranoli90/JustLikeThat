import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GlobalDatabase {
  databaseId: string;
  name: string;
  type: 'cockroachdb' | 'spanner' | 'dynamodb' | 'citus' | 'postgresql';
  provider: 'aws' | 'gcp' | 'azure' | 'self-hosted';
  regions: string[];
  status: string;
  connectionPool: number;
  readReplicas: number;
  writeLatency: number;
  readLatency: number;
  replicationLag: number;
  consistency: 'strong' | 'eventual' | 'bounded_staleness';
}

export interface DatabaseConnection {
  databaseId: string;
  regionId: string;
  endpoint: string;
  port: number;
  isReadReplica: boolean;
  isWriteEndpoint: boolean;
  status: string;
  latency: number;
}

export interface DatabaseMetrics {
  databaseId: string;
  connections: number;
  queriesPerSecond: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  replicationLag: number;
}

@Injectable()
export class GeoDatabaseService implements OnModuleInit {
  private readonly logger = new Logger(GeoDatabaseService.name);

  private readonly predefinedDatabases: Omit<GlobalDatabase, 'databaseId'>[] = [
    {
      name: 'CockroachDB Primary',
      type: 'cockroachdb',
      provider: 'aws',
      regions: ['aws-us-east-1', 'aws-us-west-2', 'aws-eu-west-1'],
      status: 'active',
      connectionPool: 100,
      readReplicas: 6,
      writeLatency: 35,
      readLatency: 8,
      replicationLag: 50,
      consistency: 'strong',
    },
    {
      name: 'Spanner Global',
      type: 'spanner',
      provider: 'gcp',
      regions: ['gcp-us-central1', 'gcp-europe-west1', 'gcp-asia-northeast1'],
      status: 'active',
      connectionPool: 50,
      readReplicas: 6,
      writeLatency: 45,
      readLatency: 10,
      replicationLag: 30,
      consistency: 'strong',
    },
    {
      name: 'DynamoDB Global',
      type: 'dynamodb',
      provider: 'aws',
      regions: ['aws-us-east-1', 'aws-us-west-2', 'aws-eu-west-1', 'aws-ap-southeast-1', 'aws-ap-northeast-1'],
      status: 'active',
      connectionPool: 200,
      readReplicas: 10,
      writeLatency: 20,
      readLatency: 5,
      replicationLag: 20,
      consistency: 'eventual',
    },
    {
      name: 'Citus Distributed',
      type: 'citus',
      provider: 'azure',
      regions: ['azure-eastus', 'azure-westeurope', 'azure-southeastasia'],
      status: 'active',
      connectionPool: 150,
      readReplicas: 6,
      writeLatency: 40,
      readLatency: 12,
      replicationLag: 60,
      consistency: 'eventual',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const db of this.predefinedDatabases) {
      await this.ensureDatabaseExists(db);
    }
  }

  private async ensureDatabaseExists(data: Omit<GlobalDatabase, 'databaseId'>): Promise<void> {
    const existing = await this.prisma.globalDatabase.findFirst({
      where: { name: data.name },
    });

    if (!existing) {
      const databaseId = `db-${data.type}-${Date.now()}`;
      await this.prisma.globalDatabase.create({
        data: {
          databaseId,
          ...data,
        },
      });
      this.logger.log(`Initialized global database: ${data.name}`);
    }
  }

  async getAllDatabases(): Promise<GlobalDatabase[]> {
    const databases = await this.prisma.globalDatabase.findMany();
    return databases.map(d => ({
      databaseId: d.databaseId,
      name: d.name,
      type: d.type as any,
      provider: d.provider as any,
      regions: d.regions,
      status: d.status,
      connectionPool: d.connectionPool,
      readReplicas: d.readReplicas,
      writeLatency: d.writeLatency,
      readLatency: d.readLatency,
      replicationLag: d.replicationLag,
      consistency: d.consistency as any,
    }));
  }

  async getDatabaseById(databaseId: string): Promise<GlobalDatabase | null> {
    const d = await this.prisma.globalDatabase.findUnique({
      where: { databaseId },
    });

    if (!d) return null;

    return {
      databaseId: d.databaseId,
      name: d.name,
      type: d.type as any,
      provider: d.provider as any,
      regions: d.regions,
      status: d.status,
      connectionPool: d.connectionPool,
      readReplicas: d.readReplicas,
      writeLatency: d.writeLatency,
      readLatency: d.readLatency,
      replicationLag: d.replicationLag,
      consistency: d.consistency as any,
    };
  }

  async createDatabase(data: Omit<GlobalDatabase, 'databaseId'>): Promise<GlobalDatabase> {
    const databaseId = `db-${data.type}-${Date.now()}`;
    
    const database = await this.prisma.globalDatabase.create({
      data: {
        databaseId,
        ...data,
      },
    });

    this.logger.log(`Created global database: ${database.name}`);

    return {
      databaseId: database.databaseId,
      name: database.name,
      type: database.type as any,
      provider: database.provider as any,
      regions: database.regions,
      status: database.status,
      connectionPool: database.connectionPool,
      readReplicas: database.readReplicas,
      writeLatency: database.writeLatency,
      readLatency: database.readLatency,
      replicationLag: database.replicationLag,
      consistency: database.consistency as any,
    };
  }

  async updateDatabase(databaseId: string, updates: Partial<GlobalDatabase>): Promise<GlobalDatabase | null> {
    const database = await this.prisma.globalDatabase.update({
      where: { databaseId },
      data: updates as any,
    });

    this.logger.log(`Updated global database: ${database.name}`);

    return {
      databaseId: database.databaseId,
      name: database.name,
      type: database.type as any,
      provider: database.provider as any,
      regions: database.regions,
      status: database.status,
      connectionPool: database.connectionPool,
      readReplicas: database.readReplicas,
      writeLatency: database.writeLatency,
      readLatency: database.readLatency,
      replicationLag: database.replicationLag,
      consistency: database.consistency as any,
    };
  }

  async deleteDatabase(databaseId: string): Promise<void> {
    await this.prisma.globalDatabase.delete({
      where: { databaseId },
    });
    this.logger.log(`Deleted global database: ${databaseId}`);
  }

  async scaleDatabase(databaseId: string, readReplicas: number, connectionPool: number): Promise<GlobalDatabase | null> {
    return this.updateDatabase(databaseId, { readReplicas, connectionPool });
  }

  async getDatabaseConnections(databaseId: string): Promise<DatabaseConnection[]> {
    const connections = await this.prisma.globalDatabaseConnection.findMany({
      where: { databaseId },
    });

    return connections.map(c => ({
      databaseId: c.databaseId,
      regionId: c.regionId,
      endpoint: c.endpoint,
      port: c.port,
      isReadReplica: c.isReadReplica,
      isWriteEndpoint: c.isWriteEndpoint,
      status: c.status,
      latency: c.latency,
    }));
  }

  async getOptimalReadRegion(databaseId: string, userRegion: string): Promise<string | null> {
    const database = await this.getDatabaseById(databaseId);
    if (!database) return null;

    // Find the closest region with a read replica
    const connections = await this.getDatabaseConnections(databaseId);
    const readReplicas = connections.filter(c => c.isReadReplica && c.status === 'active');

    if (readReplicas.length === 0) {
      // Return first available region
      return database.regions[0];
    }

    // Simple latency estimation based on region prefix
    let bestRegion = readReplicas[0].regionId;
    let bestMatch = this.calculateRegionMatch(userRegion, bestRegion);

    for (const connection of readReplicas.slice(1)) {
      const match = this.calculateRegionMatch(userRegion, connection.regionId);
      if (match > bestMatch) {
        bestMatch = match;
        bestRegion = connection.regionId;
      }
    }

    return bestRegion;
  }

  private calculateRegionMatch(userRegion: string, databaseRegion: string): number {
    // Simple matching based on region prefixes
    const userParts = userRegion.split('-');
    const dbParts = databaseRegion.split('-');

    let match = 0;
    for (let i = 0; i < Math.min(userParts.length, dbParts.length); i++) {
      if (userParts[i] === dbParts[i]) {
        match++;
      }
    }
    return match;
  }

  async getDatabaseMetrics(databaseId: string): Promise<DatabaseMetrics> {
    const database = await this.getDatabaseById(databaseId);
    
    // Simulate metrics
    return {
      databaseId,
      connections: Math.floor(database?.connectionPool || 100),
      queriesPerSecond: Math.floor(Math.random() * 10000) + 1000,
      latencyP50: database?.readLatency || 10,
      latencyP95: (database?.readLatency || 10) * 2,
      latencyP99: (database?.readLatency || 10) * 3,
      replicationLag: database?.replicationLag || 50,
    };
  }

  async getAllDatabaseMetrics(): Promise<DatabaseMetrics[]> {
    const databases = await this.getAllDatabases();
    const metricsPromises = databases.map(d => this.getDatabaseMetrics(d.databaseId));
    return Promise.all(metricsPromises);
  }

  async setConsistencyLevel(databaseId: string, level: 'strong' | 'eventual' | 'bounded_staleness'): Promise<GlobalDatabase | null> {
    return this.updateDatabase(databaseId, { consistency: level });
  }

  async checkReplicationLag(databaseId: string): Promise<{ withinSLA: boolean; lag: number; sla: number }> {
    const database = await this.getDatabaseById(databaseId);
    if (!database) {
      return { withinSLA: false, lag: 0, sla: 100 };
    }

    const currentLag = database.replicationLag + (Math.random() * 20 - 10); // Simulate variation
    const withinSLA = currentLag < 100; // SLA: <100ms

    return {
      withinSLA,
      lag: currentLag,
      sla: 100,
    };
  }
}
