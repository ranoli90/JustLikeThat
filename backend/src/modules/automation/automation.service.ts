import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationService } from '../application/application.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
  ) {}

  async createRule(userId: string, data: any) {
    const rule = await this.prisma.automationRule.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        conditions: data.conditions,
        actions: data.actions,
      },
    });
    this.logger.log(`Automation rule created: ${rule.id} for user ${userId}`);
    return rule;
  }

  async getRules(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [data, total] = await Promise.all([
      this.prisma.automationRule.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { executions: true } } },
      }),
      this.prisma.automationRule.count({ where: { userId } }),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getRuleById(userId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id, userId },
      include: {
        executions: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return rule;
  }

  async updateRule(userId: string, id: string, data: any) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, userId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return this.prisma.automationRule.update({ where: { id }, data });
  }

  async deleteRule(userId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, userId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    await this.prisma.automationRule.delete({ where: { id } });
    return { deleted: true };
  }

  async toggleRule(userId: string, id: string, isActive: boolean) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, userId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return this.prisma.automationRule.update({
      where: { id },
      data: { isActive },
    });
  }

  async executeRule(userId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id, userId },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');
    if (!rule.isActive) throw new BadRequestException('Rule is not active');

    const conditions = rule.conditions as any;
    const matchingJobs = await this.findMatchingJobs(conditions);

    const results: any[] = [];
    for (const job of matchingJobs) {
      try {
        const existing = await this.prisma.application.findUnique({
          where: { userId_jobPostingId: { userId, jobPostingId: job.id } },
        });
        if (existing) continue;

        const application = await this.applicationService.create(userId, {
          jobPostingId: job.id,
          autonomyMode: 'SEMI_AUTOMATIC',
        });

        await this.prisma.automationExecution.create({
          data: {
            automationRuleId: id,
            applicationId: application.id,
            status: 'SUCCESS',
            input: { jobPostingId: job.id },
            output: { applicationId: application.id },
          },
        });

        results.push({ jobId: job.id, applicationId: application.id, status: 'created' });
      } catch (error: any) {
        await this.prisma.automationExecution.create({
          data: {
            automationRuleId: id,
            status: 'FAILED',
            input: { jobPostingId: job.id },
            error: error.message,
          },
        });
        results.push({ jobId: job.id, status: 'failed', error: error.message });
      }
    }

    await this.prisma.automationRule.update({
      where: { id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    const created = results.filter((r) => r.status === 'created').length;
    await this.notificationService.create(userId, {
      type: 'IN_APP',
      title: 'Automation Complete',
      message: `Auto-applied to ${created} of ${matchingJobs.length} matching jobs`,
    });

    this.logger.log(`Automation rule ${id} executed: ${created} applications created`);
    return { ruleId: id, totalMatched: matchingJobs.length, applied: created, results };
  }

  private async findMatchingJobs(conditions: any) {
    const where: any = { isExpired: false };
    if (conditions?.jobTypes) where.jobType = { in: conditions.jobTypes };
    if (conditions?.locations) where.location = { in: conditions.locations };
    if (conditions?.remotePreference) where.remotePreference = conditions.remotePreference;
    if (conditions?.keywords) {
      where.OR = [
        { title: { contains: conditions.keywords, mode: 'insensitive' } },
        { description: { contains: conditions.keywords, mode: 'insensitive' } },
      ];
    }
    return this.prisma.jobPosting.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}
