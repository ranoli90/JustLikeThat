import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Runbook, RunbookExecution, RunbookStep } from '@prisma/client';
import { CreateRunbookDto, ExecuteRunbookDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, Runbook as RunbookInterface } from '../interfaces/maturity.interface';

@Injectable()
export class RunbookService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRunbookDto): Promise<Runbook> {
    return this.prisma.runbook.create({
      data: {
        category: dto.category,
        title: dto.title,
        content: dto.content,
        version: dto.version,
        author: dto.author,
        status: 'draft',
        priority: dto.priority,
        estimatedTime: dto.estimatedTime,
        prerequisites: dto.prerequisites || [],
        tags: dto.tags || [],
      },
    });
  }

  async findAll(query: PaginationQueryDto, filters?: {
    category?: string;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<PaginatedResponse<Runbook>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RunbookWhereInput = {};

    const [data, total] = await Promise.all([
      this.prisma.runbook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.runbook.count({ where }),
    ]);

    return {
      data: data as unknown as Runbook[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Runbook & { steps: RunbookStep[] }> {
    const runbook = await this.prisma.runbook.findUnique({
      where: { id },
    });

    if (!runbook) {
      throw new NotFoundException(`Runbook with ID ${id} not found`);
    }

    const steps = await this.prisma.runbookStep.findMany({
      where: { runbookId: id },
      orderBy: { stepNumber: 'asc' },
    });

    return { ...(runbook as Runbook), steps };
  }

  async update(id: string, dto: Partial<CreateRunbookDto>): Promise<Runbook> {
    const existing = await this.findById(id) as Runbook & { steps: RunbookStep[] };
    
    return this.prisma.runbook.update({
      where: { id },
      data: {
        ...dto,
        lastUpdated: new Date(),
      },
    }) as Promise<Runbook>;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.runbook.delete({ where: { id } });
  }

  async execute(id: string, dto: ExecuteRunbookDto): Promise<RunbookExecution> {
    const runbook = await this.findById(id);
    
    const execution = await this.prisma.runbookExecution.create({
      data: {
        runbookId: id,
        executedBy: dto.executedBy,
        status: 'in_progress',
        notes: dto.notes,
        startedAt: new Date(),
      },
    });

    try {
      const startTime = Date.now();
      const output = { steps: [] as Array<{ stepNumber: number; status: string }> };

      for (let i = 0; i < (runbook.steps?.length || 0); i++) {
        output.steps.push({
          stepNumber: i + 1,
          status: 'success',
        });
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);

      return this.prisma.runbookExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          output: output as unknown as Prisma.JsonObject,
          completedAt: new Date(),
          duration,
        },
      }) as Promise<RunbookExecution>;
    } catch (error) {
      return this.prisma.runbookExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          notes: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          completedAt: new Date(),
        },
      }) as Promise<RunbookExecution>;
    }
  }

  async getExecutionHistory(id: string, query: PaginationQueryDto): Promise<PaginatedResponse<RunbookExecution>> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.runbookExecution.findMany({
        where: { runbookId: id },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.runbookExecution.count({ where: { runbookId: id } }),
    ]);

    return {
      data: data as unknown as RunbookExecution[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [runbooks, executions] = await Promise.all([
      this.prisma.runbook.findMany(),
      this.prisma.runbookExecution.findMany(),
    ]);

    const byCategory = runbooks.reduce((acc: Record<string, number>, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    const completedExecutions = executions.filter(e => e.status === 'success' || e.status === 'failed');
    const successfulExecutions = executions.filter(e => e.status === 'success');
    const successRate = completedExecutions.length > 0 
      ? (successfulExecutions.length / completedExecutions.length) * 100 
      : 0;

    return {
      total: runbooks.length,
      byCategory,
      totalExecutions: executions.length,
      successRate: Math.round(successRate * 10) / 10,
    };
  }

  async publish(id: string): Promise<Runbook> {
    return this.prisma.runbook.update({
      where: { id },
      data: { status: 'published' },
    }) as Promise<Runbook>;
  }
}
