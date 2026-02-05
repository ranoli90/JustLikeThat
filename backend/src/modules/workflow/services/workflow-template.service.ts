import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowTemplateService {
  private readonly logger = new Logger(WorkflowTemplateService.name);

  // Built-in templates
  private readonly BUILTIN_TEMPLATES = [
    {
      name: 'Email Notification Workflow',
      description: 'Send email notifications based on triggers',
      category: 'Communication',
      definition: {
        nodes: [
          { id: 'trigger', type: 'trigger.webhook', position: { x: 100, y: 100 }, config: {} },
          { id: 'action1', type: 'action.email', position: { x: 300, y: 100 }, config: {} },
        ],
        connections: [
          { source: 'trigger', target: 'action1' },
        ],
        settings: {},
      },
    },
    {
      name: 'Data Processing Pipeline',
      description: 'Process and transform data through multiple stages',
      category: 'Data',
      definition: {
        nodes: [
          { id: 'trigger', type: 'trigger.schedule', position: { x: 100, y: 100 }, config: {} },
          { id: 'extract', type: 'action.database', position: { x: 250, y: 100 }, config: {} },
          { id: 'transform', type: 'action.transform', position: { x: 400, y: 100 }, config: {} },
          { id: 'load', type: 'action.database', position: { x: 550, y: 100 }, config: {} },
        ],
        connections: [
          { source: 'trigger', target: 'extract' },
          { source: 'extract', target: 'transform' },
          { source: 'transform', target: 'load' },
        ],
        settings: {},
      },
    },
    {
      name: 'Conditional Approval',
      description: 'Route items for approval based on conditions',
      category: 'Business Process',
      definition: {
        nodes: [
          { id: 'trigger', type: 'trigger.webhook', position: { x: 100, y: 100 }, config: {} },
          { id: 'condition', type: 'condition.if', position: { x: 250, y: 100 }, config: {} },
          { id: 'approve', type: 'action.http', position: { x: 400, y: 50 }, config: {} },
          { id: 'reject', type: 'action.notification', position: { x: 400, y: 150 }, config: {} },
        ],
        connections: [
          { source: 'trigger', target: 'condition' },
          { source: 'condition', target: 'approve', sourceHandle: 'true' },
          { source: 'condition', target: 'reject', sourceHandle: 'false' },
        ],
        settings: {},
      },
    },
    {
      name: 'Parallel Processing',
      description: 'Process multiple items in parallel',
      category: 'Performance',
      definition: {
        nodes: [
          { id: 'trigger', type: 'trigger.webhook', position: { x: 100, y: 100 }, config: {} },
          { id: 'parallel', type: 'flow.parallel', position: { x: 250, y: 100 }, config: {} },
          { id: 'task1', type: 'action.http', position: { x: 400, y: 50 }, config: {} },
          { id: 'task2', type: 'action.http', position: { x: 400, y: 100 }, config: {} },
          { id: 'task3', type: 'action.http', position: { x: 400, y: 150 }, config: {} },
        ],
        connections: [
          { source: 'trigger', target: 'parallel' },
          { source: 'parallel', target: 'task1' },
          { source: 'parallel', target: 'task2' },
          { source: 'parallel', target: 'task3' },
        ],
        settings: {},
      },
    },
    {
      name: 'Error Recovery',
      description: 'Handle errors with retry and fallback logic',
      category: 'Reliability',
      definition: {
        nodes: [
          { id: 'trigger', type: 'trigger.webhook', position: { x: 100, y: 100 }, config: {} },
          { id: 'action', type: 'action.http', position: { x: 250, y: 100 }, config: {} },
          { id: 'error', type: 'error.handler', position: { x: 400, y: 100 }, config: {} },
          { id: 'fallback', type: 'action.http', position: { x: 550, y: 100 }, config: {} },
        ],
        connections: [
          { source: 'trigger', target: 'action' },
          { source: 'action', target: 'error', sourceHandle: 'error' },
          { source: 'error', target: 'fallback' },
        ],
        settings: {},
      },
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all templates
   */
  async getTemplates(options?: {
    category?: string;
    isPublic?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; meta: any }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const where: any = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.isPublic !== undefined) {
      where.isPublic = options.isPublic;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.workflowTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { usageCount: 'desc' },
      }),
      this.prisma.workflowTemplate.count({ where }),
    ]);

    return {
      data: templates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId: string): Promise<any> {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    return template;
  }

  /**
   * Create a new template
   */
  async createTemplate(
    data: {
      name: string;
      description?: string;
      category: string;
      definition: any;
      isPublic?: boolean;
      tenantId?: string;
      createdBy?: string;
    },
  ): Promise<any> {
    const template = await this.prisma.workflowTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        definition: data.definition as any,
        isPublic: data.isPublic || false,
        tenantId: data.tenantId,
        createdBy: data.createdBy,
      },
    });

    return template;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      definition?: any;
      isPublic?: boolean;
    },
  ): Promise<any> {
    const template = await this.prisma.workflowTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        definition: data.definition as any,
        isPublic: data.isPublic,
      },
    });

    return template;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.prisma.workflowTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(
    templateId: string,
    name: string,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const original = await this.getTemplate(templateId);

    return this.createTemplate({
      name,
      description: original.description || undefined,
      category: original.category,
      definition: original.definition,
      tenantId,
      createdBy: userId,
    });
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<{ id: string; name: string; count: number }[]> {
    const categories = await this.prisma.workflowTemplate.groupBy({
      by: ['category'],
      _count: true,
    });

    return categories.map(c => ({
      id: c.category,
      name: c.category,
      count: c._count,
    }));
  }

  /**
   * Increment template usage
   */
  async incrementUsage(templateId: string): Promise<void> {
    await this.prisma.workflowTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(
    templateId: string,
    workflowName: string,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const template = await this.getTemplate(templateId);

    // Increment template usage
    await this.incrementUsage(templateId);

    // Create workflow from template
    const workflow = await this.prisma.workflowDefinition.create({
      data: {
        name: workflowName,
        description: template.description,
        definition: template.definition as any,
        status: 'DRAFT',
        tenantId,
        createdBy: userId,
      },
    });

    return workflow;
  }

  /**
   * Initialize built-in templates
   */
  async initializeBuiltinTemplates(): Promise<void> {
    for (const template of this.BUILTIN_TEMPLATES) {
      try {
        await this.prisma.workflowTemplate.upsert({
          where: { id: `builtin-${template.name.replace(/\s+/g, '-').toLowerCase()}` },
          create: {
            id: `builtin-${template.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: template.name,
            description: template.description,
            category: template.category,
            definition: template.definition,
            isPublic: true,
            usageCount: 0,
          },
          update: {
            // Don't update built-in templates
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to create builtin template ${template.name}: ${error.message}`);
      }
    }

    this.logger.log(`Initialized ${this.BUILTIN_TEMPLATES.length} builtin templates`);
  }
}
