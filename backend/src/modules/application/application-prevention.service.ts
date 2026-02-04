import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Not } from 'typeorm';
import { Application, ApplicationState } from '../../entities/application.entity';

@Injectable()
export class ApplicationPreventionService {
  // Rate limiting configuration (applications per hour per user)
  private static readonly RATE_LIMIT = 50;
  private static readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds

  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {}

  // Check for duplicate applications
  async checkDuplicate(userId: string, jobPostingId: string): Promise<void> {
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        userId,
        jobPostingId,
        state: Not(ApplicationState.WITHDRAWN || ApplicationState.REJECTED),
      },
    });

    if (existingApplication) {
      throw new ConflictException('Duplicate application');
    }
  }

  // Check rate limiting
  async checkRateLimit(userId: string): Promise<void> {
    const windowStart = new Date(Date.now() - ApplicationPreventionService.RATE_LIMIT_WINDOW);
    const applicationsCount = await this.applicationRepository.count({
      where: {
        userId,
        createdAt: MoreThanOrEqual(windowStart),
      },
    });

    if (applicationsCount >= ApplicationPreventionService.RATE_LIMIT) {
      throw new BadRequestException('Rate limit exceeded');
    }
  }

  // Spam detection checks
  async checkSpam(userId: string, jobPostingId: string): Promise<void> {
    // Check for rapid application patterns
    const recentApplications = await this.applicationRepository.find({
      where: {
        userId,
        createdAt: MoreThanOrEqual(new Date(Date.now() - 60000)), // Last 1 minute
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (recentApplications.length >= 10) {
      throw new ConflictException('Potential spam application detected');
    }
  }

  // Comprehensive prevention check
  async checkAll(userId: string, jobPostingId: string): Promise<void> {
    await this.checkDuplicate(userId, jobPostingId);
    await this.checkRateLimit(userId);
    await this.checkSpam(userId, jobPostingId);
  }
}
