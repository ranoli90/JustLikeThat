import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Application, ApplicationState, AutonomyMode } from '../../entities/application.entity';
import { ApplicationStateMachine } from './application.state-machine';
import { ApplicationPreventionService } from './application-prevention.service';

@Injectable()
export class ApplicationService {
  // Concurrency caps per user/tenant
  private static readonly CONCURRENCY_CAP = 20;

  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private stateMachine: ApplicationStateMachine,
    private preventionService: ApplicationPreventionService,
  ) {}

  // Get all applications for a user
  async getApplications(userId: string, query: any) {
    const { page = 1, size = 10, state } = query;
    const queryBuilder = this.applicationRepository.createQueryBuilder('application')
      .where('application.userId = :userId', { userId });

    if (state) {
      queryBuilder.andWhere('application.state = :state', { state });
    }

    const [data, total] = await queryBuilder
      .orderBy('application.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return {
      data,
      pagination: {
        page: Number(page),
        size: Number(size),
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  // Get application by ID
  async getApplicationById(userId: string, id: string) {
    return this.applicationRepository.findOne({
      where: { id, userId },
    });
  }

  // Create a new application with prevention checks
  async createApplication(userId: string, createApplicationDto: any) {
    await this.preventApplicationCreation(userId, createApplicationDto.jobPostingId);

    const application = this.applicationRepository.create({
      ...createApplicationDto,
      userId,
      state: ApplicationState.DRAFT,
      autonomyMode: AutonomyMode.MANUAL,
    });

    return this.applicationRepository.save(application);
  }

  // Update an application (only if in modifiable state)
  async updateApplication(userId: string, id: string, updateApplicationDto: any) {
    const application = await this.getApplicationById(userId, id);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (!this.stateMachine.allowsModifications(application.state)) {
      throw new BadRequestException('Cannot modify application in current state');
    }

    // Update application
    Object.assign(application, updateApplicationDto);
    return this.applicationRepository.save(application);
  }

  // Delete an application (only if in draft or early states)
  async deleteApplication(userId: string, id: string) {
    const application = await this.getApplicationById(userId, id);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (!this.stateMachine.allowsModifications(application.state)) {
      throw new BadRequestException('Cannot delete application in current state');
    }

    return this.applicationRepository.remove(application);
  }

  // Submit application
  async submitApplication(userId: string, id: string) {
    const application = await this.getApplicationById(userId, id);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    const newState = this.stateMachine.transition(application.state, ApplicationState.SUBMITTED);
    application.state = newState;
    application.submittedAt = new Date();

    return this.applicationRepository.save(application);
  }

  // Transition application state with validation
  async transitionState(userId: string, id: string, targetState: ApplicationState) {
    const application = await this.getApplicationById(userId, id);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    const newState = this.stateMachine.transition(application.state, targetState);
    application.state = newState;

    if (targetState === ApplicationState.WITHDRAWN) {
      application.withdrawnAt = new Date();
    } else if (targetState === ApplicationState.SUBMITTED) {
      application.submittedAt = new Date();
    }

    return this.applicationRepository.save(application);
  }

  // Pause application (set to draft from active states)
  async pauseApplication(userId: string, id: string) {
    const application = await this.getApplicationById(userId, id);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (application.state === ApplicationState.DRAFT) {
      return application;
    }

    const newState = this.stateMachine.transition(application.state, ApplicationState.DRAFT);
    application.state = newState;

    return this.applicationRepository.save(application);
  }

  // Cancel application (withdraw)
  async cancelApplication(userId: string, id: string) {
    return this.transitionState(userId, id, ApplicationState.WITHDRAWN);
  }

  // Set autonomy mode
  async setAutonomyMode(userId: string, id: string, autonomyMode: AutonomyMode) {
    const application = await this.getApplicationById(userId, id);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    application.autonomyMode = autonomyMode;
    return this.applicationRepository.save(application);
  }

  // Get application stats
  async getApplicationStats(userId: string) {
    const [total, submitted, rejected, interviewing, offer] = await Promise.all([
      this.applicationRepository.count({ where: { userId } }),
      this.applicationRepository.count({ where: { userId, state: ApplicationState.SUBMITTED } }),
      this.applicationRepository.count({ where: { userId, state: ApplicationState.REJECTED } }),
      this.applicationRepository.count({ where: { userId, state: ApplicationState.ACCEPTED } }), // For now, we'll count accepted as interviewing/offer
      this.applicationRepository.count({ where: { userId, state: ApplicationState.ACCEPTED } }),
    ]);

    return {
      total,
      submitted,
      rejected,
      interviewing,
      offer,
    };
  }

  // Check concurrency limits
  private async checkConcurrencyLimit(userId: string): Promise<void> {
    const activeApplicationsCount = await this.applicationRepository.count({
      where: {
        userId,
        state: In(['PENDING_TAILORING', 'TAILORED', 'PENDING_APPLICATION', 'SUBMITTED']),
      },
    });

    if (activeApplicationsCount >= ApplicationService.CONCURRENCY_CAP) {
      throw new BadRequestException('Concurrency limit exceeded');
    }
  }

  // Check all prevention rules before application creation
  private async preventApplicationCreation(userId: string, jobPostingId: string): Promise<void> {
    await this.preventionService.checkAll(userId, jobPostingId);
    await this.checkConcurrencyLimit(userId);
  }
}
