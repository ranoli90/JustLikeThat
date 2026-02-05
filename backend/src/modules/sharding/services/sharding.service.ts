import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ShardStrategyService } from '../strategies/shard-strategy.service';
import { ShardingConfig, ShardMapping } from '../entities/shard.entity';

@Injectable()
export class ShardingService {
  private readonly logger = new Logger(ShardingService.name);
  private readonly shardCount = 16;
  private shardConnections: Map<number, any> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly shardStrategy: ShardStrategyService,
  ) {}

  async getShardId(entityType: string, shardKey: string): Promise<number> {
    // Check existing mapping first
    const existingMapping = await this.prisma.shardMapping.findUnique({
      where: {
        entityType_shardKey: { entityType, shardKey },
      },
    });

    if (existingMapping) {
      return existingMapping.shardId;
    }

    // Calculate shard ID based on strategy
    const shardId = this.shardStrategy.calculateShardId(shardKey, this.shardCount);

    // Create new mapping
    await this.prisma.shardMapping.create({
      data: {
        entityType,
        shardKey,
        shardId,
        shardConfigId: await this.getShardConfigId(shardId),
      },
    });

    return shardId;
  }

  async getShardConnection(shardId: number): Promise<any> {
    if (this.shardConnections.has(shardId)) {
      return this.shardConnections.get(shardId);
    }

    const shardConfig = await this.prisma.shardConfig.findUnique({
      where: { shardId },
    });

    if (!shardConfig) {
      throw new Error(`Shard ${shardId} not found`);
    }

    // Create connection (mock - would be actual database connection)
    const connection = {
      host: shardConfig.host,
      port: shardConfig.port,
      database: shardConfig.databaseName,
      role: shardConfig.role,
    };

    this.shardConnections.set(shardId, connection);
    return connection;
  }

  async getAllShards(): Promise<ShardingConfig[]> {
    return this.prisma.shardConfig.findMany({
      orderBy: { shardId: 'asc' },
    });
  }

  async getHealthyShards(): Promise<ShardingConfig[]> {
    return this.prisma.shardConfig.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { shardId: 'asc' },
    });
  }

  async addShard(shardId: number, config: Partial<ShardingConfig>): Promise<ShardingConfig> {
    return this.prisma.shardConfig.create({
      data: {
        shardId,
        nodeUrl: config.nodeUrl!,
        host: config.host!,
        port: config.port!,
        databaseName: config.databaseName!,
        role: config.role || 'PRIMARY',
        status: 'ACTIVE',
        weight: config.weight || 100,
      },
    });
  }

  async removeShard(shardId: number): Promise<void> {
    await this.prisma.shardConfig.delete({
      where: { shardId },
    });
    this.shardConnections.delete(shardId);
  }

  async updateShardStatus(shardId: number, status: string): Promise<void> {
    await this.prisma.shardConfig.update({
      where: { shardId },
      data: { status: status as any },
    });
  }

  async rebalanceData(entityType: string, sourceShardId: number, targetShardId: number): Promise<void> {
    // Create rebalance log
    const rebalanceLog = await this.prisma.shardRebalanceLog.create({
      data: {
        sourceShardId,
        targetShardId,
        entityType,
        entityIds: [],
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    try {
      // Get entities to move
      const mappings = await this.prisma.shardMapping.findMany({
        where: {
          entityType,
          shardId: sourceShardId,
        },
      });

      // Update shard mappings
      for (const mapping of mappings) {
        await this.prisma.shardMapping.update({
          where: { id: mapping.id },
          data: {
            shardId: targetShardId,
            shardConfigId: await this.getShardConfigId(targetShardId),
          },
        });
      }

      await this.prisma.shardRebalanceLog.update({
        where: { id: rebalanceLog.id },
        data: {
          entityIds: mappings.map(m => m.id),
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Rebalanced ${mappings.length} entities from shard ${sourceShardId} to ${targetShardId}`);
    } catch (error: any) {
      await this.prisma.shardRebalanceLog.update({
        where: { id: rebalanceLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }

  async getRebalanceStatus(): Promise<any[]> {
    return this.prisma.shardRebalanceLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getShardStats(): Promise<any> {
    const shards = await this.getAllShards();
    const mappings = await this.prisma.shardMapping.groupBy({
      by: ['shardId'],
      _count: true,
    });

    const stats = shards.map(shard => {
      const mapping = mappings.find(m => m.shardId === shard.shardId);
      return {
        shardId: shard.shardId,
        status: shard.status,
        role: shard.role,
        entityCount: mapping?._count || 0,
        host: shard.host,
        port: shard.port,
      };
    });

    return {
      totalShards: shards.length,
      activeShards: shards.filter(s => s.status === 'ACTIVE').length,
      totalEntities: mappings.reduce((sum, m) => sum + m._count, 0),
      shardStats: stats,
    };
  }

  private async getShardConfigId(shardId: number): Promise<string> {
    const shardConfig = await this.prisma.shardConfig.findUnique({
      where: { shardId },
    });
    return shardConfig?.id || '';
  }
}
