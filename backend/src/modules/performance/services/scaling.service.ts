import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  targetCPU: number;
  targetMemory: number;
}

interface InstanceInfo {
  id: string;
  status: 'healthy' | 'unhealthy' | 'starting';
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
  lastHeartbeat: Date;
  region: string;
}

interface ScalingEvent {
  type: 'scale_up' | 'scale_down' | 'instance_added' | 'instance_removed';
  instanceId?: string;
  reason: string;
  timestamp: Date;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestCount: number;
  };
}

interface HorizontalScalingStats {
  currentInstances: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  scalingEvents: ScalingEvent[];
}

@Injectable()
export class ScalingService extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(ScalingService.name);
  private instances: Map<string, InstanceInfo> = new Map();
  private scalingEvents: ScalingEvent[] = [];
  private readonly instanceId: string;
  private lastScaleUp: Date | null = null;
  private lastScaleDown: Date | null = null;
  private config: ScalingConfig;
  private scalingInterval: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
    this.instanceId = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      minInstances: this.configService.get<number>('MIN_INSTANCES', 2),
      maxInstances: this.configService.get<number>('MAX_INSTANCES', 10),
      scaleUpThreshold: this.configService.get<number>('SCALE_UP_THRESHOLD', 70),
      scaleDownThreshold: this.configService.get<number>('SCALE_DOWN_THRESHOLD', 30),
      scaleUpCooldown: this.configService.get<number>('SCALE_UP_COOLDOWN', 300000),
      scaleDownCooldown: this.configService.get<number>('SCALE_DOWN_COOLDOWN', 600000),
      targetCPU: this.configService.get<number>('TARGET_CPU', 70),
      targetMemory: this.configService.get<number>('TARGET_MEMORY', 80),
    };
  }

  async onModuleInit() {
    // Register this instance
    await this.registerInstance();
    
    // Start scaling monitor
    this.startScalingMonitor();
    
    this.logger.log(`Scaling service initialized with config: min=${this.config.minInstances}, max=${this.config.maxInstances}`);
  }

  /**
   * Register this instance with the scaling service
   */
  private async registerInstance(): Promise<void> {
    const instance: InstanceInfo = {
      id: this.instanceId,
      status: 'healthy',
      cpuUsage: 0,
      memoryUsage: 0,
      requestsPerSecond: 0,
      lastHeartbeat: new Date(),
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
    };

    this.instances.set(this.instanceId, instance);
  }

  /**
   * Start the scaling monitor
   */
  private startScalingMonitor(): void {
    this.scalingInterval = setInterval(async () => {
      await this.evaluateScaling();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Evaluate if scaling is needed
   */
  private async evaluateScaling(): Promise<void> {
    const metrics = this.getAggregateMetrics();
    const now = Date.now();

    // Check for scale up
    if (this.shouldScaleUp(metrics, now)) {
      await this.scaleUp(metrics);
    }
    // Check for scale down
    else if (this.shouldScaleDown(metrics, now)) {
      await this.scaleDown(metrics);
    }

    // Update instance metrics
    await this.updateInstanceMetrics();
  }

  /**
   * Determine if we should scale up
   */
  private shouldScaleUp(metrics: any, now: number): boolean {
    if (this.instances.size >= this.config.maxInstances) {
      return false;
    }

    if (this.lastScaleUp && (now - this.lastScaleUp.getTime()) < this.config.scaleUpCooldown) {
      return false;
    }

    return (
      metrics.cpuUtilization > this.config.scaleUpThreshold ||
      metrics.memoryUtilization > this.config.scaleUpThreshold ||
      metrics.totalRequests > 1000 // High request rate
    );
  }

  /**
   * Determine if we should scale down
   */
  private shouldScaleDown(metrics: any, now: number): boolean {
    if (this.instances.size <= this.config.minInstances) {
      return false;
    }

    if (this.lastScaleDown && (now - this.lastScaleDown.getTime()) < this.config.scaleDownCooldown) {
      return false;
    }

    return (
      metrics.cpuUtilization < this.config.scaleDownThreshold &&
      metrics.memoryUtilization < this.config.scaleDownThreshold &&
      metrics.totalRequests < 100
    );
  }

  /**
   * Execute scale up
   */
  private async scaleUp(metrics: any): Promise<void> {
    this.lastScaleUp = new Date();
    
    // In a real implementation, this would call cloud provider API
    const newInstanceId = `instance-${Date.now()}`;
    
    const event: ScalingEvent = {
      type: 'scale_up',
      instanceId: newInstanceId,
      reason: `High utilization - CPU: ${metrics.cpuUtilization}%, Memory: ${metrics.memoryUtilization}%`,
      timestamp: new Date(),
      metrics: {
        cpuUsage: metrics.cpuUtilization,
        memoryUsage: metrics.memoryUtilization,
        requestCount: metrics.totalRequests,
      },
    };

    this.scalingEvents.push(event);
    
    this.logger.log(`Scaling up - Added instance ${newInstanceId}. Reason: ${event.reason}`);
    this.emit('scaled', { type: 'scale_up', instanceId: newInstanceId, metrics });
  }

  /**
   * Execute scale down
   */
  private async scaleDown(metrics: any): Promise<void> {
    this.lastScaleDown = new Date();
    
    // Find an instance to remove (not this one)
    const instancesToRemove = Array.from(this.instances.values())
      .filter(i => i.id !== this.instanceId && i.status === 'healthy')
      .sort((a, b) => a.requestsPerSecond - b.requestsPerSecond);

    if (instancesToRemove.length === 0) {
      return;
    }

    const instanceToRemove = instancesToRemove[0];
    this.instances.delete(instanceToRemove.id);

    const event: ScalingEvent = {
      type: 'scale_down',
      instanceId: instanceToRemove.id,
      reason: `Low utilization - CPU: ${metrics.cpuUtilization}%, Memory: ${metrics.memoryUtilization}%`,
      timestamp: new Date(),
      metrics: {
        cpuUsage: metrics.cpuUtilization,
        memoryUsage: metrics.memoryUtilization,
        requestCount: metrics.totalRequests,
      },
    };

    this.scalingEvents.push(event);
    
    this.logger.log(`Scaling down - Removed instance ${instanceToRemove.id}. Reason: ${event.reason}`);
    this.emit('scaled', { type: 'scale_down', instanceId: instanceToRemove.id, metrics });
  }

  /**
   * Get aggregate metrics from all instances
   */
  private getAggregateMetrics(): {
    cpuUtilization: number;
    memoryUtilization: number;
    totalRequests: number;
    healthyInstances: number;
  } {
    const instances = Array.from(this.instances.values());
    
    if (instances.length === 0) {
      return {
        cpuUtilization: 0,
        memoryUtilization: 0,
        totalRequests: 0,
        healthyInstances: 0,
      };
    }

    const healthyInstances = instances.filter(i => i.status === 'healthy');
    const totalRequests = instances.reduce((sum, i) => sum + i.requestsPerSecond, 0);
    const avgCPU = instances.reduce((sum, i) => sum + i.cpuUsage, 0) / instances.length;
    const avgMemory = instances.reduce((sum, i) => sum + i.memoryUsage, 0) / instances.length;

    return {
      cpuUtilization: avgCPU,
      memoryUtilization: avgMemory,
      totalRequests,
      healthyInstances: healthyInstances.length,
    };
  }

  /**
   * Update this instance's metrics
   */
  private async updateInstanceMetrics(): Promise<void> {
    const instance = this.instances.get(this.instanceId);
    if (instance) {
      instance.cpuUsage = await this.getCPUUsage();
      instance.memoryUsage = await this.getMemoryUsage();
      instance.requestsPerSecond = await this.getRequestRate();
      instance.lastHeartbeat = new Date();
    }
  }

  /**
   * Get current CPU usage
   */
  private async getCPUUsage(): Promise<number> {
    // In a real implementation, this would read from system metrics
    return Math.random() * 50; // Placeholder
  }

  /**
   * Get current memory usage
   */
  private async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    const usedMB = used.heapUsed / 1024 / 1024;
    const totalMB = 512; // Assuming 512MB limit
    return Math.min((usedMB / totalMB) * 100, 100);
  }

  /**
   * Get current request rate
   */
  private async getRequestRate(): Promise<number> {
    // In a real implementation, this would read from metrics
    return Math.random() * 100; // Placeholder
  }

  /**
   * Report metrics from another instance
   */
  reportInstanceMetrics(instanceId: string, metrics: Partial<InstanceInfo>): void {
    const existing = this.instances.get(instanceId);
    if (existing) {
      this.instances.set(instanceId, {
        ...existing,
        ...metrics,
        lastHeartbeat: new Date(),
      });
    } else {
      // New instance
      this.instances.set(instanceId, {
        id: instanceId,
        status: 'healthy',
        cpuUsage: metrics.cpuUsage ?? 0,
        memoryUsage: metrics.memoryUsage ?? 0,
        requestsPerSecond: metrics.requestsPerSecond ?? 0,
        lastHeartbeat: new Date(),
        region: metrics.region ?? 'unknown',
      });

      this.scalingEvents.push({
        type: 'instance_added',
        instanceId,
        reason: 'New instance registered',
        timestamp: new Date(),
        metrics: { cpuUsage: 0, memoryUsage: 0, requestCount: 0 },
      });
    }
  }

  /**
   * Get horizontal scaling statistics
   */
  getStats(): HorizontalScalingStats {
    const metrics = this.getAggregateMetrics();
    const recentEvents = this.scalingEvents.slice(-50);

    return {
      currentInstances: this.instances.size,
      totalRequests: metrics.totalRequests,
      averageResponseTime: 0, // Would be populated from monitoring
      errorRate: 0, // Would be populated from monitoring
      cpuUtilization: metrics.cpuUtilization,
      memoryUtilization: metrics.memoryUtilization,
      scalingEvents: recentEvents,
    };
  }

  /**
   * Get all registered instances
   */
  getInstances(): InstanceInfo[] {
    return Array.from(this.instances.values());
  }

  /**
   * Mark instance as unhealthy
   */
  markInstanceUnhealthy(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = 'unhealthy';
      
      this.scalingEvents.push({
        type: 'instance_removed',
        instanceId,
        reason: 'Instance marked unhealthy',
        timestamp: new Date(),
        metrics: {
          cpuUsage: instance.cpuUsage,
          memoryUsage: instance.memoryUsage,
          requestCount: instance.requestsPerSecond,
        },
      });
    }
  }

  /**
   * Manually trigger scaling
   */
  async manualScale(targetInstances: number): Promise<void> {
    const current = this.instances.size;
    
    if (targetInstances > current && targetInstances <= this.config.maxInstances) {
      for (let i = 0; i < targetInstances - current; i++) {
        await this.scaleUp(this.getAggregateMetrics());
      }
    } else if (targetInstances < current && targetInstances >= this.config.minInstances) {
      for (let i = 0; i < current - targetInstances; i++) {
        await this.scaleDown(this.getAggregateMetrics());
      }
    }
  }

  /**
   * Get scaling configuration
   */
  getConfig(): ScalingConfig {
    return { ...this.config };
  }

  /**
   * Update scaling configuration
   */
  updateConfig(updates: Partial<ScalingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.log('Scaling configuration updated');
  }
}
