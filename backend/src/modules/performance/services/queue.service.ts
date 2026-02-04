import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

interface Job<T = any> {
  id: string;
  type: string;
  payload: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

interface JobOptions {
  priority?: number;
  maxRetries?: number;
  delay?: number;
  timeout?: number;
}

interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
}

interface Worker {
  id: string;
  status: 'idle' | 'processing';
  currentJob?: string;
  startedAt?: Date;
}

@Injectable()
export class QueueService extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private jobs: Map<string, Job> = new Map();
  private workers: Map<string, Worker> = new Map();
  private jobQueue: string[] = [];
  private processingJobs: Set<string> = new Set();
  private jobHandlers: Map<string, (job: Job) => Promise<any>> = new Map();
  private readonly maxConcurrentJobs: number;
  private readonly jobTimeout: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.maxConcurrentJobs = this.configService.get<number>('MAX_CONCURRENT_JOBS', 10);
    this.jobTimeout = this.configService.get<number>('JOB_TIMEOUT', 300000); // 5 minutes
  }

  async onModuleInit() {
    this.logger.log('Queue service initialized');
    this.startJobProcessor();
  }

  /**
   * Register a job handler
   */
  registerHandler(type: string, handler: (job: Job) => Promise<any>): void {
    this.jobHandlers.set(type, handler);
    this.logger.log(`Registered handler for job type: ${type}`);
  }

  /**
   * Add a new job to the queue
   */
  async addJob<T>(type: string, payload: T, options: JobOptions = {}): Promise<string> {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const priority = options.priority ?? 0;
    const maxRetries = options.maxRetries ?? 3;
    const delay = options.delay ?? 0;

    const job: Job<T> = {
      id,
      type,
      payload,
      status: 'pending',
      retryCount: 0,
      maxRetries,
      priority,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);

    if (delay > 0) {
      setTimeout(() => {
        this.addToQueue(id);
      }, delay);
    } else {
      this.addToQueue(id);
    }

    this.logger.log(`Job added: ${id} (type: ${type})`);
    return id;
  }

  /**
   * Add job to the priority queue
   */
  private addToQueue(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Insert based on priority (higher priority first)
    let inserted = false;
    for (let i = 0; i < this.jobQueue.length; i++) {
      const queueJob = this.jobs.get(this.jobQueue[i]);
      if (queueJob && job.priority > queueJob.priority) {
        this.jobQueue.splice(i, 0, jobId);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.jobQueue.push(jobId);
    }
  }

  /**
   * Start processing jobs
   */
  private startJobProcessor(): void {
    setInterval(async () => {
      await this.processNextJob();
    }, 100); // Check for jobs every 100ms
  }

  /**
   * Process the next job in queue
   */
  private async processNextJob(): Promise<void> {
    if (this.processingJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    while (this.jobQueue.length > 0 && this.processingJobs.size < this.maxConcurrentJobs) {
      const jobId = this.jobQueue.shift();
      if (!jobId) continue;

      const job = this.jobs.get(jobId);
      if (!job || job.status !== 'pending') continue;

      await this.processJob(job);
    }
  }

  /**
   * Process a single job
   */
  private async processJob<T>(job: Job<T>): Promise<void> {
    const handler = this.jobHandlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      this.logger.error(`Job failed: ${job.id} - ${job.error}`);
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    this.processingJobs.add(job.id);

    this.logger.log(`Processing job: ${job.id}`);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout')), this.jobTimeout);
    });

    const startTime = Date.now();

    try {
      const result = await Promise.race([handler(job), timeoutPromise]);
      
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      this.processingJobs.delete(job.id);
      this.logger.log(`Job completed: ${job.id} in ${Date.now() - startTime}ms`);
      
      this.emit('job:completed', job);
    } catch (error: any) {
      job.retryCount++;
      
      if (job.retryCount < job.maxRetries) {
        job.status = 'pending';
        this.processingJobs.delete(job.id);
        
        // Exponential backoff
        const delay = Math.pow(2, job.retryCount) * 1000;
        setTimeout(() => {
          this.addToQueue(job.id);
        }, delay);
        
        this.logger.warn(`Job ${job.id} retry ${job.retryCount}/${job.maxRetries} after ${delay}ms`);
      } else {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
        this.processingJobs.delete(job.id);
        
        this.logger.error(`Job failed permanently: ${job.id} - ${error.message}`);
        this.emit('job:failed', job);
      }
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs by status
   */
  getJobsByStatus(status: Job['status']): Job[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  /**
   * Cancel a pending job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Job cancelled';
    this.jobQueue = this.jobQueue.filter(id => id !== jobId);
    
    this.logger.log(`Job cancelled: ${jobId}`);
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'failed') {
      return false;
    }

    job.status = 'pending';
    job.retryCount = 0;
    job.error = undefined;
    job.result = undefined;
    
    this.addToQueue(jobId);
    this.logger.log(`Job retry scheduled: ${jobId}`);
    return true;
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    
    const processingTimes = completedJobs
      .filter(j => j.startedAt && j.completedAt)
      .map(j => j.completedAt!.getTime() - j.startedAt!.getTime());
    
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      processingJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: completedJobs.length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      averageProcessingTime: Math.round(averageProcessingTime),
    };
  }

  /**
   * Clear completed and failed jobs
   */
  cleanup(maxAge: number = 86400000): number {
    // Keep jobs from last 24 hours by default
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt.getTime() < cutoff) {
        this.jobs.delete(id);
        removed++;
      }
    }

    this.logger.log(`Cleaned up ${removed} old jobs`);
    return removed;
  }

  /**
   * Pause job processing
   */
  pause(): void {
    this.emit('queue:paused');
    this.logger.log('Queue processing paused');
  }

  /**
   * Resume job processing
   */
  resume(): void {
    this.emit('queue:resumed');
    this.logger.log('Queue processing resumed');
  }

  /**
   * Bulk add jobs
   */
  async bulkAdd<T>(
    type: string,
    payloads: T[],
    options: JobOptions = {},
  ): Promise<string[]> {
    const jobIds: string[] = [];
    
    for (const payload of payloads) {
      const id = await this.addJob(type, payload, options);
      jobIds.push(id);
    }

    return jobIds;
  }

  /**
   * Schedule recurring job
   */
  scheduleRecurringJob<T>(
    type: string,
    payload: T,
    interval: number,
    options: JobOptions = {},
  ): () => void {
    const execute = async () => {
      await this.addJob(type, payload, options);
    };

    const intervalId = setInterval(execute, interval);
    
    // Execute immediately
    execute();

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}
