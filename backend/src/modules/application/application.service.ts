import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ApplicationState } from '@prisma/client';

const MAX_ACTIVE_APPLICATIONS = 20;

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_TAILORING', 'WITHDRAWN'],
  PENDING_TAILORING: ['TAILORED', 'WITHDRAWN'],
  TAILORED: ['PENDING_SUBMISSION', 'WITHDRAWN'],
  PENDING_SUBMISSION: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['INTERVIEWING', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWING: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(userId: string, data: { jobPostingId: string; autonomyMode?: string }) {
    const existing = await this.prisma.application.findUnique({
      where: { userId_jobPostingId: { userId, jobPostingId: data.jobPostingId } },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    const activeCount = await this.prisma.application.count({
      where: {
        userId,
        state: {
          in: [
            ApplicationState.DRAFT,
            ApplicationState.PENDING_TAILORING,
            ApplicationState.TAILORED,
            ApplicationState.PENDING_SUBMISSION,
            ApplicationState.SUBMITTED,
          ],
        },
      },
    });
    if (activeCount >= MAX_ACTIVE_APPLICATIONS) {
      throw new BadRequestException(
        `Maximum of ${MAX_ACTIVE_APPLICATIONS} active applications reached`,
      );
    }

    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: data.jobPostingId },
    });
    if (!jobPosting) throw new NotFoundException('Job posting not found');

    const application = await this.prisma.application.create({
      data: {
        userId,
        jobPostingId: data.jobPostingId,
        autonomyMode: (data.autonomyMode as any) || 'MANUAL',
        state: 'DRAFT',
      },
      include: { jobPosting: true },
    });

    this.logger.log(`Application created: ${application.id} for user ${userId}`);
    return application;
  }

  async findAll(userId: string, query: { page?: number; limit?: number; state?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { userId };
    if (query.state) where.state = query.state;

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: { jobPosting: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: { jobPosting: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async transitionState(userId: string, id: string, newState: ApplicationState) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: { jobPosting: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    const allowedTransitions = VALID_TRANSITIONS[application.state] || [];
    if (!allowedTransitions.includes(newState)) {
      throw new BadRequestException(
        `Cannot transition from ${application.state} to ${newState}`,
      );
    }

    const updateData: any = { state: newState };
    if (newState === 'SUBMITTED') updateData.submittedAt = new Date();
    if (newState === 'WITHDRAWN') updateData.withdrawnAt = new Date();

    const updated = await this.prisma.application.update({
      where: { id },
      data: updateData,
      include: { jobPosting: true },
    });

    await this.notificationService.create(userId, {
      type: 'IN_APP',
      title: 'Application Updated',
      message: `Your application for ${application.jobPosting.title} is now ${newState}`,
    });

    this.logger.log(`Application ${id} transitioned to ${newState}`);
    return updated;
  }

  async submitApplication(userId: string, id: string) {
    return this.transitionState(userId, id, ApplicationState.SUBMITTED);
  }

  async withdrawApplication(userId: string, id: string) {
    return this.transitionState(userId, id, ApplicationState.WITHDRAWN);
  }

  async getStats(userId: string) {
    const [total, submitted, interviewing, offers, rejected, withdrawn] =
      await Promise.all([
        this.prisma.application.count({ where: { userId } }),
        this.prisma.application.count({ where: { userId, state: 'SUBMITTED' } }),
        this.prisma.application.count({ where: { userId, state: 'INTERVIEWING' } }),
        this.prisma.application.count({ where: { userId, state: 'OFFER' } }),
        this.prisma.application.count({ where: { userId, state: 'REJECTED' } }),
        this.prisma.application.count({ where: { userId, state: 'WITHDRAWN' } }),
      ]);

    return { total, submitted, interviewing, offers, rejected, withdrawn };
  }

  async update(userId: string, id: string, data: any) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
    });
    if (!application) throw new NotFoundException('Application not found');
    return this.prisma.application.update({ where: { id }, data });
  }
}
