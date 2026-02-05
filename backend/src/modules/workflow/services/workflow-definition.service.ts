import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { 
  CreateWorkflowDtoType, 
  UpdateWorkflowDtoType, 
  WorkflowQueryDtoType 
} from '../dto/workflow.dto';
import { WorkflowDefinition, WorkflowHistory, WorkflowAction, WorkflowStatus } from '@prisma/client';
import { WorkflowDefinition as WorkflowDefinitionModel, WorkflowNode as WorkflowNodeModel } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface WorkflowWithRelations extends WorkflowDefinitionModel {
  nodes: WorkflowNodeModel[];
}

@Injectable()
export class WorkflowDefinitionService {
  private readonly logger = new Logger(WorkflowDefinitionService.name);
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDtoType, tenantId: string, userId: string): Promise<WorkflowDefinitionModel> {
    this.logger.log(`Creating workflow: ${dto.name} for tenant: ${tenantId}`);

    const workflow = await this.prisma.workflowDefinition.create({
      data: {
        name: dto.name,
        description: dto.description,
        definition: dto.definition as any,
        status: 'DRAFT',
        tenantId,
        createdBy: userId,
      },
    });

    // Create workflow nodes
    if (dto.definition.nodes && dto.definition.nodes.length > 0) {
      await this.createNodes(workflow.id, dto.definition.nodes);
    }

    // Create initial history entry
    await this.createHistoryEntry(workflow.id, 1, 'CREATE', {}, userId);

    return workflow;
  }

  async findAll(query: WorkflowQueryDtoType, tenantId: string) {
    const { page, limit, status, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [workflows, total] = await Promise.all([
      this.prisma.workflowDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          nodes: true,
          _count: {
            select: { executions: true },
          },
        },
      }),
      this.prisma.workflowDefinition.count({ where }),
    ]);

    return {
      data: workflows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, tenantId: string): Promise<WorkflowWithRelations> {
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { id, tenantId },
      include: { nodes: true },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow as WorkflowWithRelations;
  }

  async update(id: string, dto: UpdateWorkflowDtoType, userId: string): Promise<WorkflowDefinitionModel> {
    this.logger.log(`Updating workflow: ${id}`);

    const existing = await this.findById(id, dto.tenantId || '');

    if (existing.status === WorkflowStatus.PUBLISHED) {
      // Create new version for published workflows
      const newVersion = await this.createNewVersion(id, dto, userId);
      return newVersion;
    }

    const workflow = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        definition: dto.definition as any,
        updatedAt: new Date(),
      },
    });

    // Update nodes if provided
    if (dto.definition?.nodes) {
      await this.prisma.workflowNode.deleteMany({ where: { workflowId: id } });
      await this.createNodes(id, dto.definition.nodes);
    }

    return workflow;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting workflow: ${id}`);

    const workflow = await this.findById(id, tenantId);

    if (workflow.status === WorkflowStatus.PUBLISHED) {
      throw new ConflictException('Cannot delete a published workflow. Archive it instead.');
    }

    await this.prisma.workflowDefinition.delete({ where: { id } });
  }

  async publish(id: string, userId: string): Promise<WorkflowDefinitionModel> {
    this.logger.log(`Publishing workflow: ${id}`);

    const workflow = await this.findById(id, '');

    // Validate workflow structure
    await this.validateWorkflowStructure(workflow);

    // Create history entry
    await this.createHistoryEntry(
      id,
      workflow.version,
      'PUBLISH',
      {},
      userId,
    );

    const published = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return published;
  }

  async rollback(id: string, version: number, userId: string): Promise<WorkflowDefinitionModel> {
    this.logger.log(`Rolling back workflow: ${id} to version: ${version}`);

    const history = await this.prisma.workflowHistory.findFirst({
      where: {
        workflowId: id,
        version,
        action: { in: ['CREATE', 'UPDATE', 'PUBLISH'] },
      },
      orderBy: { performedAt: 'desc' },
    });

    if (!history) {
      throw new NotFoundException(`Version ${version} not found for workflow ${id}`);
    }

    const snapshot = history.snapshot as any;

    const newVersion = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        version: { increment: 1 },
        definition: snapshot.definition,
        status: 'DRAFT',
        updatedAt: new Date(),
      },
    });

    // Create history entry for rollback
    await this.createHistoryEntry(
      id,
      newVersion.version,
      'ROLLBACK',
      { fromVersion: history.version, toVersion: newVersion.version },
      userId,
      `Rolled back to version ${version}`,
    );

    return newVersion;
  }

  async duplicate(id: string, name: string, tenantId: string, userId: string): Promise<WorkflowDefinitionModel> {
    this.logger.log(`Duplicating workflow: ${id} as ${name}`);

    const original = await this.findById(id, tenantId);

    return this.create(
      {
        name,
        description: original.description || undefined,
        definition: original.definition as any,
      },
      tenantId,
      userId,
    );
  }

  async autoSave(id: string, definition: any): Promise<void> {
    // Auto-save without creating a new version
    await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        definition: definition as any,
        updatedAt: new Date(),
      },
    });
  }

  // ============ PRIVATE METHODS ============

  private async createNodes(workflowId: string, nodes: any[]): Promise<void> {
    const nodeData = nodes.map((node, index) => ({
      workflowId,
      nodeId: node.id,
      nodeType: node.type,
      config: node.config as any,
      position: node.position as any,
      connections: {
        inputs: [],
        outputs: [],
      } as any,
    }));

    await this.prisma.workflowNode.createMany({ data: nodeData });
  }

  private async createHistoryEntry(
    workflowId: string,
    version: number,
    action: WorkflowAction,
    changes: Record<string, any>,
    performedBy: string,
    reason?: string,
  ): Promise<void> {
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { id: workflowId },
    });

    await this.prisma.workflowHistory.create({
      data: {
        workflowId,
        version,
        action,
        snapshot: workflow?.definition as any,
        changes: changes as any,
        performedBy,
        reason,
      },
    });
  }

  private async createNewVersion(
    id: string,
    dto: UpdateWorkflowDtoType,
    userId: string,
  ): Promise<WorkflowDefinitionModel> {
    const existing = await this.findById(id, '');

    // Create history entry for current version
    await this.createHistoryEntry(
      id,
      existing.version,
      'UPDATE',
      dto as any,
      userId,
    );

    const newVersion = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        version: { increment: 1 },
        name: dto.name,
        description: dto.description,
        definition: dto.definition as any,
        status: 'DRAFT',
        updatedAt: new Date(),
      },
    });

    // Update nodes if provided
    if (dto.definition?.nodes) {
      await this.prisma.workflowNode.deleteMany({ where: { workflowId: id } });
      await this.createNodes(id, dto.definition.nodes);
    }

    return newVersion;
  }

  private async validateWorkflowStructure(workflow: WorkflowDefinition): Promise<void> {
    const definition = workflow.definition as any;

    if (!definition.nodes || definition.nodes.length === 0) {
      throw new ConflictException('Workflow must have at least one node');
    }

    // Check for entry point
    const hasEntryPoint = definition.nodes.some(
      (node: any) => node.type.startsWith('trigger.'),
    );

    if (!hasEntryPoint) {
      throw new ConflictException('Workflow must have a trigger node');
    }

    // Validate connections
    const nodeIds = new Set(definition.nodes.map((n: any) => n.id));
    
    for (const connection of definition.connections || []) {
      if (!nodeIds.has(connection.source)) {
        throw new ConflictException(`Invalid connection: source ${connection.source} not found`);
      }
      if (!nodeIds.has(connection.target)) {
        throw new ConflictException(`Invalid connection: target ${connection.target} not found`);
      }
    }
  }
}
