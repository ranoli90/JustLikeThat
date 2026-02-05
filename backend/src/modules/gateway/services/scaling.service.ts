import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ScalingPolicy, ScalingEvent } from '../interfaces/gateway.interface';

@Injectable()
export class ScalingService {
  private readonly logger = new Logger(ScalingService.name);
  private scalingHistory: Map<string, ScalingEvent[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(serviceName?: string): Promise<any> {
    if (serviceName) {
      const policy = await this.prisma.scalingPolicy.findUnique({
        where: { serviceName },
      });

      const history = await this.prisma.scalingEvent.findMany({
        where: { serviceName },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return {
        policy: policy ? this.mapPolicy(policy) : null,
        recentEvents: history.map(e => this.mapEvent(e)),
      };
    }

    const policies = await this.prisma.scalingPolicy.findMany({
      where: { active: true },
    });

    const services = policies.map(p => p.serviceName);
    const events = await this.prisma.scalingEvent.findMany({
      where: {
        serviceName: { in: services },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Group events by service
    const eventsByService = new Map<string, ScalingEvent[]>();
    for (const event of events) {
      const serviceEvents = eventsByService.get(event.serviceName) || [];
      serviceEvents.push(this.mapEvent(event));
      eventsByService.set(event.serviceName, serviceEvents);
    }

    return {
      services: policies.map(p => ({
        serviceName: p.serviceName,
        policy: this.mapPolicy(p),
        recentEvents: eventsByService.get(p.serviceName) || [],
      })),
      totalServices: policies.length,
      timestamp: new Date(),
    };
  }

  async updatePolicy(body: { serviceName: string; policy: Partial<ScalingPolicy> }): Promise<ScalingPolicy> {
    const { serviceName, policy } = body;

    const existingPolicy = await this.prisma.scalingPolicy.findUnique({
      where: { serviceName },
    });

    let updatedPolicy;

    if (existingPolicy) {
      updatedPolicy = await this.prisma.scalingPolicy.update({
        where: { serviceName },
        data: {
          minReplicas: policy.minReplicas ?? existingPolicy.minReplicas,
          maxReplicas: policy.maxReplicas ?? existingPolicy.maxReplicas,
          targetCpu: policy.targetCpu ?? existingPolicy.targetCpu,
          targetMemory: policy.targetMemory ?? existingPolicy.targetMemory,
          targetRequestsPerSecond: policy.targetRequestsPerSecond ?? existingPolicy.targetRequestsPerSecond,
          cooldownSeconds: policy.cooldownSeconds ?? existingPolicy.cooldownSeconds,
          active: policy.active ?? existingPolicy.active,
        },
      });
    } else {
      updatedPolicy = await this.prisma.scalingPolicy.create({
        data: {
          serviceName,
          policyType: 'HORIZONTAL_POD_AUTOSCALER',
          minReplicas: policy.minReplicas || 1,
          maxReplicas: policy.maxReplicas || 100,
          targetCpu: policy.targetCpu,
          targetMemory: policy.targetMemory,
          targetRequestsPerSecond: policy.targetRequestsPerSecond,
          cooldownSeconds: policy.cooldownSeconds || 300,
          active: true,
        },
      });
    }

    return this.mapPolicy(updatedPolicy);
  }

  async triggerScaling(body: {
    serviceName: string;
    action: 'scale_up' | 'scale_down' | 'scale_to';
    replicas?: number;
  }): Promise<ScalingEvent> {
    const { serviceName, action, replicas } = body;

    const policy = await this.prisma.scalingPolicy.findUnique({
      where: { serviceName },
    });

    if (!policy) {
      throw new HttpException(
        `No scaling policy found for service: ${serviceName}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check cooldown
    const lastEvent = await this.prisma.scalingEvent.findFirst({
      where: { serviceName },
      orderBy: { createdAt: 'desc' },
    });

    if (lastEvent) {
      const cooldownElapsed = Date.now() - lastEvent.createdAt.getTime();
      if (cooldownElapsed < policy.cooldownSeconds * 1000) {
        const remainingCooldown = policy.cooldownSeconds - Math.floor(cooldownElapsed / 1000);
        throw new HttpException(
          `Scaling cooldown active. Try again in ${remainingCooldown} seconds`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    let newReplicas: number;

    switch (action) {
      case 'scale_up':
        newReplicas = Math.min(policy.maxReplicas, policy.minReplicas + 1);
        break;
      case 'scale_down':
        newReplicas = Math.max(1, policy.minReplicas - 1);
        break;
      case 'scale_to':
        if (!replicas || replicas < 1 || replicas > policy.maxReplicas) {
          throw new HttpException(
            `Invalid replica count. Must be between 1 and ${policy.maxReplicas}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        newReplicas = replicas;
        break;
      default:
        throw new HttpException('Invalid action', HttpStatus.BAD_REQUEST);
    }

    const event = await this.prisma.scalingEvent.create({
      data: {
        serviceName,
        previousReplicas: policy.minReplicas,
        newReplicas,
        trigger: action,
        metrics: {
          cpu: null,
          memory: null,
          requestsPerSecond: null,
        },
      },
    });

    // Update policy with new replica count
    await this.prisma.scalingPolicy.update({
      where: { serviceName },
      data: { minReplicas: newReplicas },
    });

    this.logger.log(
      `Scaling ${serviceName}: ${policy.minReplicas} -> ${newReplicas} replicas (trigger: ${action})`,
    );

    return this.mapEvent(event);
  }

  async recordScalingMetrics(
    serviceName: string,
    metrics: { cpu: number; memory: number; requestsPerSecond: number },
  ): Promise<void> {
    const policy = await this.prisma.scalingPolicy.findUnique({
      where: { serviceName },
    });

    if (!policy) return;

    // Check if scaling is needed based on metrics
    let shouldScale = false;
    let action: 'scale_up' | 'scale_down' | null = null;

    if (policy.targetCpu && metrics.cpu > policy.targetCpu) {
      shouldScale = true;
      action = 'scale_up';
    } else if (policy.targetMemory && metrics.memory > policy.targetMemory) {
      shouldScale = true;
      action = 'scale_up';
    } else if (policy.targetRequestsPerSecond && metrics.requestsPerSecond > policy.targetRequestsPerSecond) {
      shouldScale = true;
      action = 'scale_up';
    } else if (metrics.cpu < policy.targetCpu! * 0.5 && metrics.memory < policy.targetMemory! * 0.5) {
      shouldScale = true;
      action = 'scale_down';
    }

    if (shouldScale && action) {
      await this.triggerScaling({ serviceName, action });
    }
  }

  private mapPolicy(data: any): ScalingPolicy {
    return {
      serviceName: data.serviceName,
      minReplicas: data.minReplicas,
      maxReplicas: data.maxReplicas,
      targetCpu: data.targetCpu,
      targetMemory: data.targetMemory,
      targetRequestsPerSecond: data.targetRequestsPerSecond,
      cooldownSeconds: data.cooldownSeconds,
    };
  }

  private mapEvent(data: any): ScalingEvent {
    return {
      id: data.id,
      serviceName: data.serviceName,
      previousReplicas: data.previousReplicas,
      newReplicas: data.newReplicas,
      trigger: data.trigger,
      timestamp: data.createdAt,
      metrics: data.metrics as Record<string, any>,
    };
  }
}
