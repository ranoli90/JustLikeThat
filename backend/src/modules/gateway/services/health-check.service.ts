import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ConsulService } from '../../consul/services/consul.service';
import { HealthStatus, HealthCheck } from '../interfaces/gateway.interface';

@Injectable()
export class HealthCheckService implements OnModuleInit {
  private readonly logger = new Logger(HealthCheckService.name);
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly consulService: ConsulService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Start health checks for registered services
    await this.startAllHealthChecks();
  }

  async getLiveness(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date(),
      checks: [
        {
          name: 'gateway',
          status: 'up',
          latency: 0,
          message: 'Gateway is alive',
        },
      ],
    };
  }

  async getReadiness(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];

    // Check Redis connectivity
    try {
      const start = Date.now();
      await this.redisService.ping();
      checks.push({
        name: 'redis',
        status: 'up',
        latency: Date.now() - start,
        message: 'Redis connection healthy',
      });
    } catch (error) {
      checks.push({
        name: 'redis',
        status: 'down',
        message: `Redis connection failed: ${error.message}`,
      });
    }

    // Check Consul connectivity
    try {
      const start = Date.now();
      await this.consulService.getHealthChecks();
      checks.push({
        name: 'consul',
        status: 'up',
        latency: Date.now() - start,
        message: 'Consul connection healthy',
      });
    } catch (error) {
      checks.push({
        name: 'consul',
        status: 'down',
        message: `Consul connection failed: ${error.message}`,
      });
    }

    // Check database connectivity
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.push({
        name: 'database',
        status: 'up',
        latency: Date.now() - start,
        message: 'Database connection healthy',
      });
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'down',
        message: `Database connection failed: ${error.message}`,
      });
    }

    // Check registered services
    const registeredServices = await this.getRegisteredServicesHealth();
    checks.push(...registeredServices);

    const unhealthyChecks = checks.filter(c => c.status === 'down');
    const status = unhealthyChecks.length > 0 ? 'degraded' : 'healthy';

    return {
      status,
      timestamp: new Date(),
      checks,
    };
  }

  async getClusterHealth(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];

    // Get all registered services from Consul
    const services = await this.consulService.getAllServices();

    for (const service of services) {
      const healthyInstances = service.instances.filter(
        (i: any) => i.status === 'passing',
      ).length;

      const totalInstances = service.instances.length;
      const healthRatio = totalInstances > 0 ? healthyInstances / totalInstances : 0;

      checks.push({
        name: service.name,
        status: healthRatio === 1 ? 'up' : healthRatio > 0.5 ? 'degraded' : 'down',
        details: {
          healthyInstances,
          totalInstances,
          healthRatio,
        },
      });
    }

    // Check infrastructure components
    const infraChecks = await this.checkInfrastructureHealth();
    checks.push(...infraChecks);

    const unhealthyChecks = checks.filter(c => c.status === 'down');
    const degradedChecks = checks.filter(c => c.status === 'degraded');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      checks,
    };
  }

  private async checkInfrastructureHealth(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Check Redis cluster
    try {
      const redisInfo = await this.redisService.info('cluster');
      checks.push({
        name: 'redis-cluster',
        status: 'up',
        details: { cluster: true },
      });
    } catch (error) {
      checks.push({
        name: 'redis-cluster',
        status: 'down',
        message: error.message,
      });
    }

    // Check Kafka
    // Implementation would go here

    return checks;
  }

  private async getRegisteredServicesHealth(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    try {
      const services = await this.prisma.serviceRegistry.findMany({
        where: { status: 'ACTIVE' },
        take: 50,
      });

      for (const service of services) {
        const lastHeartbeat = service.lastHeartbeat;
        const heartbeatAge = lastHeartbeat 
          ? Date.now() - lastHeartbeat.getTime() 
          : Infinity;

        checks.push({
          name: service.serviceName,
          status: heartbeatAge < 60000 ? 'up' : heartbeatAge < 120000 ? 'degraded' : 'down',
          details: {
            instanceId: service.instanceId,
            host: service.host,
            port: service.port,
            heartbeatAge: Math.floor(heartbeatAge / 1000),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to get registered services health: ${error.message}`);
    }

    return checks;
  }

  private async startAllHealthChecks(): Promise<void> {
    try {
      const services = await this.prisma.serviceRegistry.findMany({
        where: { status: 'ACTIVE' },
      });

      for (const service of services) {
        this.startHealthCheck(service.id, service.healthCheckInterval);
      }
    } catch (error) {
      this.logger.error(`Failed to start health checks: ${error.message}`);
    }
  }

  private startHealthCheck(serviceId: string, interval: number): void {
    if (this.healthCheckIntervals.has(serviceId)) {
      clearInterval(this.healthCheckIntervals.get(serviceId)!);
    }

    const intervalId = setInterval(async () => {
      await this.performHealthCheck(serviceId);
    }, interval);

    this.healthCheckIntervals.set(serviceId, intervalId);
  }

  private async performHealthCheck(serviceId: string): Promise<void> {
    try {
      const service = await this.prisma.serviceRegistry.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        this.stopHealthCheck(serviceId);
        return;
      }

      const start = Date.now();
      let status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED' | 'TIMEOUT' | 'ERROR' = 'HEALTHY';
      let errorMessage: string | undefined;

      try {
        const healthCheckUrl = service.healthCheckUrl || `http://${service.host}:${service.port}/health`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(healthCheckUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          status = 'DEGRADED';
          errorMessage = `HTTP ${response.status}`;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          status = 'TIMEOUT';
          errorMessage = 'Health check timed out';
        } else {
          status = 'UNHEALTHY';
          errorMessage = error.message;
        }
      }

      const latency = Date.now() - start;

      // Record health check
      await this.prisma.healthCheckLog.create({
        data: {
          serviceRegistryId: service.id,
          status,
          responseTime: latency,
          errorMessage,
        },
      });

      // Update service heartbeat
      await this.prisma.serviceRegistry.update({
        where: { id: service.id },
        data: { lastHeartbeat: new Date() },
      });

      // Check if service should be deregistered
      const recentChecks = await this.prisma.healthCheckLog.findMany({
        where: {
          serviceRegistryId: service.id,
          checkedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        },
        orderBy: { checkedAt: 'desc' },
      });

      const unhealthyCount = recentChecks.filter(c => c.status !== 'HEALTHY').length;
      
      if (unhealthyCount >= service.failureThreshold) {
        await this.prisma.serviceRegistry.update({
          where: { id: service.id },
          data: { status: 'FAILED' },
        });
        this.logger.warn(`Service ${service.serviceName} marked as FAILED after ${unhealthyCount} unhealthy checks`);
      }
    } catch (error: any) {
      this.logger.error(`Health check failed for ${serviceId}: ${error.message}`);
    }
  }

  private stopHealthCheck(serviceId: string): void {
    const interval = this.healthCheckIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serviceId);
    }
  }

  async triggerHealthCheck(serviceId: string): Promise<void> {
    await this.performHealthCheck(serviceId);
  }
}
