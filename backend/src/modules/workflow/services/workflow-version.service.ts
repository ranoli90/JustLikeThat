import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowAction, WorkflowStatus } from '@prisma/client';

interface WorkflowDiff {
  fromVersion: number;
  toVersion: number;
  changes: VersionChange[];
  summary: string;
}

interface VersionChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldValue?: any;
  newValue?: any;
}

@Injectable()
export class WorkflowVersionService {
  private readonly logger = new Logger(WorkflowVersionService.name);
  private readonly MAX_VERSIONS = 100;
  private readonly HISTORY_RETENTION_DAYS = 730; // 2 years

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get version history for a workflow
   */
  async getVersionHistory(
    workflowId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<any[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return this.prisma.workflowHistory.findMany({
      where: { workflowId },
      orderBy: { performedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get a specific version of a workflow
   */
  async getVersion(workflowId: string, version: number): Promise<any> {
    const history = await this.prisma.workflowHistory.findFirst({
      where: {
        workflowId,
        version,
        action: { in: ['CREATE', 'UPDATE', 'PUBLISH'] },
      },
      orderBy: { performedAt: 'desc' },
    });

    if (!history) {
      throw new NotFoundException(`Version ${version} not found for workflow ${workflowId}`);
    }

    return {
      ...history,
      snapshot: history.snapshot,
    };
  }

  /**
   * Compare two versions of a workflow
   */
  async compareVersions(
    workflowId: string,
    fromVersion: number,
    toVersion: number,
  ): Promise<WorkflowDiff> {
    const [from, to] = await Promise.all([
      this.getVersion(workflowId, fromVersion),
      this.getVersion(workflowId, toVersion),
    ]);

    const changes = this.generateDiff(
      from.snapshot as any,
      to.snapshot as any,
    );

    const summary = this.generateDiffSummary(changes);

    return {
      fromVersion,
      toVersion,
      changes,
      summary,
    };
  }

  /**
   * Create a new version (automatic on publish)
   */
  async createVersion(
    workflowId: string,
    action: WorkflowAction,
    snapshot: any,
    changes: Record<string, any>,
    performedBy: string,
    reason?: string,
  ): Promise<any> {
    // Get current version
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { id: workflowId },
      include: { history: { orderBy: { version: 'desc' }, take: 1 } },
    });

    const newVersion = (workflow?.version || 0) + 1;

    // Create history entry
    const history = await this.prisma.workflowHistory.create({
      data: {
        workflowId,
        version: newVersion,
        action,
        snapshot: snapshot as any,
        changes: changes as any,
        performedBy,
        reason,
      },
    });

    // Clean up old versions if exceeding limit
    await this.cleanupOldVersions(workflowId);

    return history;
  }

  /**
   * Rollback to a specific version
   */
  async rollback(
    workflowId: string,
    targetVersion: number,
    performedBy: string,
    reason?: string,
  ): Promise<any> {
    // Get the target version snapshot
    const targetVersionData = await this.getVersion(workflowId, targetVersion);
    const snapshot = targetVersionData.snapshot;

    // Create new version with rolled back content
    const rollback = await this.createVersion(
      workflowId,
      'ROLLBACK',
      snapshot,
      { fromVersion: targetVersion, toVersion: targetVersion + 1 },
      performedBy,
      reason || `Rolled back to version ${targetVersion}`,
    );

    // Update workflow definition
    await this.prisma.workflowDefinition.update({
      where: { id: workflowId },
      data: {
        definition: snapshot as any,
        status: 'DRAFT',
      },
    });

    return rollback;
  }

  /**
   * Restore a deleted workflow from history
   */
  async restoreFromHistory(
    workflowId: string,
    version: number,
    performedBy: string,
  ): Promise<any> {
    const versionData = await this.getVersion(workflowId, version);
    const snapshot = versionData.snapshot as any;

    const restored = await this.prisma.workflowDefinition.create({
      data: {
        name: snapshot.name,
        description: snapshot.description,
        definition: snapshot.definition,
        status: 'DRAFT',
        tenantId: snapshot.tenantId,
        createdBy: performedBy,
      },
    });

    // Create history entry
    await this.createVersion(
      restored.id,
      'CREATE',
      restored,
      { restoredFrom: workflowId, restoredVersion: version },
      performedBy,
    );

    return restored;
  }

  /**
   * Get diff between two workflow definitions
   */
  generateDiff(
    from: { nodes: any[]; connections: any[] },
    to: { nodes: any[]; connections: any[] },
  ): VersionChange[] {
    const changes: VersionChange[] = [];

    // Compare nodes
    const fromNodeIds = new Set(from.nodes.map(n => n.id));
    const toNodeIds = new Set(to.nodes.map(n => n.id));

    // Added nodes
    for (const node of to.nodes) {
      if (!fromNodeIds.has(node.id)) {
        changes.push({
          type: 'added',
          path: `nodes[${node.id}]`,
          newValue: node,
        });
      }
    }

    // Deleted nodes
    for (const node of from.nodes) {
      if (!toNodeIds.has(node.id)) {
        changes.push({
          type: 'deleted',
          path: `nodes[${node.id}]`,
          oldValue: node,
        });
      }
    }

    // Modified nodes
    for (const toNode of to.nodes) {
      const fromNode = from.nodes.find(n => n.id === toNode.id);
      if (fromNode && JSON.stringify(fromNode) !== JSON.stringify(toNode)) {
        changes.push({
          type: 'modified',
          path: `nodes[${toNode.id}]`,
          oldValue: fromNode,
          newValue: toNode,
        });
      }
    }

    // Compare connections
    const fromConnHash = new Set(
      from.connections.map(c => `${c.source}-${c.target}`),
    );
    const toConnHash = new Set(
      to.connections.map(c => `${c.source}-${c.target}`),
    );

    for (const conn of to.connections) {
      const key = `${conn.source}-${conn.target}`;
      if (!fromConnHash.has(key)) {
        changes.push({
          type: 'added',
          path: `connections[${conn.source}->${conn.target}]`,
          newValue: conn,
        });
      }
    }

    for (const conn of from.connections) {
      const key = `${conn.source}-${conn.target}`;
      if (!toConnHash.has(key)) {
        changes.push({
          type: 'deleted',
          path: `connections[${conn.source}->${conn.target}]`,
          oldValue: conn,
        });
      }
    }

    return changes;
  }

  /**
   * Generate a human-readable summary of changes
   */
  generateDiffSummary(changes: VersionChange[]): string {
    const added = changes.filter(c => c.type === 'added').length;
    const modified = changes.filter(c => c.type === 'modified').length;
    const deleted = changes.filter(c => c.type === 'deleted').length;

    const parts: string[] = [];
    if (added > 0) parts.push(`${added} node(s) added`);
    if (modified > 0) parts.push(`${modified} node(s) modified`);
    if (deleted > 0) parts.push(`${deleted} node(s) deleted`);

    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }

  /**
   * Clean up old versions exceeding retention limit
   */
  private async cleanupOldVersions(workflowId: string): Promise<void> {
    const versions = await this.prisma.workflowHistory.findMany({
      where: { workflowId },
      orderBy: { version: 'desc' },
      skip: this.MAX_VERSIONS,
    });

    if (versions.length > 0) {
      const oldVersionIds = versions.map(v => v.id);
      
      // Delete old versions (keep latest MAX_VERSIONS)
      await this.prisma.workflowHistory.deleteMany({
        where: { id: { in: oldVersionIds } },
      });

      this.logger.log(`Cleaned up ${oldVersionIds.length} old versions for workflow ${workflowId}`);
    }
  }

  /**
   * Get audit trail for a workflow
   */
  async getAuditTrail(
    workflowId: string,
    options?: {
      fromDate?: Date;
      toDate?: Date;
      performedBy?: string;
      action?: WorkflowAction;
    },
  ): Promise<any[]> {
    const where: any = { workflowId };

    if (options?.fromDate || options?.toDate) {
      where.performedAt = {};
      if (options.fromDate) where.performedAt.gte = options.fromDate;
      if (options.toDate) where.performedAt.lte = options.toDate;
    }

    if (options?.performedBy) where.performedBy = options.performedBy;
    if (options?.action) where.action = options.action;

    return this.prisma.workflowHistory.findMany({
      where,
      orderBy: { performedAt: 'desc' },
    });
  }

  /**
   * Archive old history entries
   */
  async archiveOldHistory(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.HISTORY_RETENTION_DAYS);

    const result = await this.prisma.workflowHistory.deleteMany({
      where: {
        performedAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Archived ${result.count} old history entries`);

    return result.count;
  }
}
