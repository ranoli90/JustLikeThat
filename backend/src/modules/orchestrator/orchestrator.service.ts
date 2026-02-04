import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AgentType,
  AGENT_CONFIGS,
  TaskPriority,
  TaskStatus,
  TaskErrorType,
  AgentTask,
} from './orchestrator.agents';
import { OrchestratorTask } from './entities/orchestrator-task.entity';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectRepository(OrchestratorTask)
    private readonly taskRepository: Repository<OrchestratorTask>,
  ) {}

  /**
   * Create a new orchestrator task
   */
  async createTask(
    agentType: AgentType,
    data: any,
    priority?: TaskPriority,
  ): Promise<OrchestratorTask> {
    const task = this.taskRepository.create({
      agentType,
      data,
      priority: priority || this.calculatePriority(data),
      status: TaskStatus.PENDING,
      retryCount: 0,
    });

    return this.taskRepository.save(task);
  }

  /**
   * Calculate task priority based on data
   */
  calculatePriority(data: any): TaskPriority {
    // High priority for urgent applications or high-relevance matches
    if (data.isUrgent || data.matchScore >= 0.9) {
      return TaskPriority.URGENT;
    }

    // High priority for high-relevance matches
    if (data.matchScore >= 0.8) {
      return TaskPriority.HIGH;
    }

    // Medium priority for standard applications
    if (data.jobId || data.candidateId) {
      return TaskPriority.MEDIUM;
    }

    return TaskPriority.LOW;
  }

  /**
   * Get next pending task by priority
   */
  async getNextPendingTask(agentType?: AgentType): Promise<OrchestratorTask | null> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.status = :status', { status: TaskStatus.PENDING })
      .orderBy('task.priority', 'DESC')
      .addOrderBy('task.createdAt', 'ASC')
      .take(1);

    if (agentType) {
      queryBuilder.andWhere('task.agentType = :agentType', { agentType });
    }

    return queryBuilder.getOne();
  }

  /**
   * Start task execution
   */
  async startTask(taskId: string): Promise<OrchestratorTask | null> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task || task.status !== TaskStatus.PENDING) {
      return null;
    }

    task.status = TaskStatus.RUNNING;
    task.updatedAt = new Date();

    return this.taskRepository.save(task);
  }

  /**
   * Complete a task successfully
   */
  async completeTask(taskId: string, result?: any): Promise<OrchestratorTask | null> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      return null;
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.updatedAt = new Date();
    if (result) {
      task.data = { ...task.data, result };
    }

    return this.taskRepository.save(task);
  }

  /**
   * Mark task as failed and handle retry logic
   */
  async failTask(
    taskId: string,
    errorType: TaskErrorType,
    errorMessage: string,
  ): Promise<OrchestratorTask | null> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      return null;
    }

    const config = AGENT_CONFIGS[task.agentType];

    task.retryCount += 1;
    task.errorType = errorType;
    task.errorMessage = errorMessage;
    task.updatedAt = new Date();

    // Check if we should retry
    if (task.retryCount <= config.retryCount) {
      task.status = TaskStatus.RETRYING;
      this.logger.warn(
        `Task ${taskId} failed (${task.retryCount}/${config.retryCount}), will retry in ${config.retryDelay}ms`,
      );

      // Schedule retry
      setTimeout(
        () => this.retryTask(taskId),
        config.retryDelay,
      );
    } else {
      task.status = TaskStatus.FAILED;
      this.logger.error(`Task ${taskId} failed permanently: ${errorMessage}`);

      // Handle fallback
      if (config.fallbackAgent) {
        this.logger.warn(`Task ${taskId} falling back to ${config.fallbackAgent}`);
        await this.createTask(config.fallbackAgent, {
          originalTaskId: taskId,
          errorType,
          errorMessage,
          data: task.data,
        });
      }
    }

    return this.taskRepository.save(task);
  }

  /**
   * Retry a failed task
   */
  async retryTask(taskId: string): Promise<OrchestratorTask | null> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task || task.status !== TaskStatus.RETRYING) {
      return null;
    }

    task.status = TaskStatus.PENDING;
    task.updatedAt = new Date();

    return this.taskRepository.save(task);
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<OrchestratorTask | null> {
    return this.taskRepository.findOne({ where: { id: taskId } });
  }

  /**
   * Get all tasks with pagination
   */
  async getTasks(status?: TaskStatus, agentType?: AgentType, page = 1, limit = 10) {
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (status) {
      queryBuilder.where('task.status = :status', { status });
    }

    if (agentType) {
      queryBuilder.andWhere('task.agentType = :agentType', { agentType });
    }

    const [items, total] = await queryBuilder
      .orderBy('task.priority', 'DESC')
      .addOrderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<any> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    const [total, pending, running, completed, failed] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.where('task.status = :status', { status: TaskStatus.PENDING }).getCount(),
      queryBuilder.where('task.status = :status', { status: TaskStatus.RUNNING }).getCount(),
      queryBuilder.where('task.status = :status', { status: TaskStatus.COMPLETED }).getCount(),
      queryBuilder.where('task.status = :status', { status: TaskStatus.FAILED }).getCount(),
    ]);

    return {
      total,
      pending,
      running,
      completed,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Orchestrate complete application lifecycle
   */
  async orchestrateApplicationLifecycle(
    candidateId: string,
    jobId: string,
  ): Promise<OrchestratorTask[]> {
    const tasks: OrchestratorTask[] = [];

    try {
      // 1. Matching (to verify compatibility)
      const matchingTask = await this.createTask(AgentType.MATCHING, {
        candidateId,
        jobId,
        isUrgent: true,
      }, TaskPriority.HIGH);
      tasks.push(matchingTask);

      // 2. Tailoring
      const tailoringTask = await this.createTask(AgentType.TAILORING, {
        candidateId,
        jobId,
      }, TaskPriority.HIGH);
      tasks.push(tailoringTask);

      // 3. Application
      const applicationTask = await this.createTask(AgentType.APPLICATION, {
        candidateId,
        jobId,
        isUrgent: true,
      }, TaskPriority.URGENT);
      tasks.push(applicationTask);

      // 4. Notification
      const notificationTask = await this.createTask(AgentType.NOTIFICATION, {
        candidateId,
        jobId,
        event: 'application_submitted',
      }, TaskPriority.MEDIUM);
      tasks.push(notificationTask);

      this.logger.log(
        `Application lifecycle orchestrated for candidate ${candidateId} and job ${jobId}`,
      );
    } catch (error) {
      this.logger.error('Failed to orchestrate application lifecycle:', error);
      throw error;
    }

    return tasks;
  }
}
