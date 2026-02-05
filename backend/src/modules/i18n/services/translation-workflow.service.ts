import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowStage } from '../interfaces/i18n.interface';

@Injectable()
export class TranslationWorkflowService {
  private readonly logger = new Logger(TranslationWorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWorkflow(data: {
    localeId: string;
    namespace: string;
    assignedTo?: string;
    priority?: number;
    dueAt?: Date;
  }): Promise<any> {
    const workflow = await this.prisma.translationWorkflow.create({
      data: {
        localeId: data.localeId,
        namespace: data.namespace,
        stage: WorkflowStage.DRAFT,
        assignedTo: data.assignedTo,
        priority: data.priority || 0,
        dueAt: data.dueAt,
      },
    });
    return workflow;
  }

  async updateStage(
    id: string,
    stage: WorkflowStage,
    stageData?: Record<string, unknown>,
  ): Promise<any> {
    const workflow = await this.prisma.translationWorkflow.update({
      where: { id },
      data: {
        stage,
        stageData: stageData,
        ...(stage === WorkflowStage.PUBLISH ? { completedAt: new Date() } : {}),
      },
    });
    return workflow;
  }

  async assignTo(id: string, userId: string): Promise<any> {
    return this.prisma.translationWorkflow.update({
      where: { id },
      data: { assignedTo: userId },
    });
  }

  async setReviewer(id: string, reviewerId: string): Promise<any> {
    return this.prisma.translationWorkflow.update({
      where: { id },
      data: { reviewerId },
    });
  }

  async setApprover(id: string, approverId: string): Promise<any> {
    return this.prisma.translationWorkflow.update({
      where: { id },
      data: { approverId },
    });
  }

  async getWorkflowsByStage(
    localeId: string,
    stage: WorkflowStage,
  ): Promise<any[]> {
    return this.prisma.translationWorkflow.findMany({
      where: { localeId, stage },
      orderBy: { priority: 'desc' },
    });
  }

  async getWorkflowsByUser(userId: string): Promise<any[]> {
    return this.prisma.translationWorkflow.findMany({
      where: {
        OR: [
          { assignedTo: userId },
          { reviewerId: userId },
          { approverId: userId },
        ],
      },
      orderBy: { priority: 'desc' },
    });
  }

  async getPendingReviews(reviewerId: string): Promise<any[]> {
    return this.prisma.translationWorkflow.findMany({
      where: {
        reviewerId,
        stage: WorkflowStage.REVIEW,
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async getPendingApprovals(approverId: string): Promise<any[]> {
    return this.prisma.translationWorkflow.findMany({
      where: {
        approverId,
        stage: WorkflowStage.APPROVAL,
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.prisma.translationWorkflow.delete({
      where: { id },
    });
  }

  async getWorkflowStats(localeId: string): Promise<Record<string, number>> {
    const stages = Object.values(WorkflowStage);
    const stats: Record<string, number> = {};

    for (const stage of stages) {
      stats[stage] = await this.prisma.translationWorkflow.count({
        where: { localeId, stage },
      });
    }

    return stats;
  }
}
