import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consul, ConsulOptions, AgentServiceRegistration, AgentServiceChecks } from 'consul';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsulService.name);
  private consul: Consul;
  private readonly serviceId: string;

  constructor(private readonly prisma: PrismaService) {
    this.serviceId = `gateway-${process.env.HOSTNAME || 'local'}-${Date.now()}`;
    
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || '8500', 10),
      secure: process.env.CONSUL_HTTPS === 'true',
      token: process.env.CONSUL_TOKEN,
    } as ConsulOptions);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.registerService();
      await this.watchServices();
      this.logger.log('Consul service initialized');
    } catch (error) {
      this.logger.warn(`Consul initialization failed, running in standalone mode: ${error.message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.deregisterService();
      this.logger.log('Consul service deregistered');
    } catch (error) {
      this.logger.error(`Failed to deregister from Consul: ${error.message}`);
    }
  }

  async registerService(): Promise<void> {
    const serviceName = 'api-gateway';
    const serviceRegistration: AgentServiceRegistration = {
      id: this.serviceId,
      name: serviceName,
      address: process.env.HOSTNAME || 'localhost',
      port: parseInt(process.env.PORT || '3000', 10),
      tags: ['gateway', 'api', 'v1'],
      meta: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      checks: {
        http: {
          http: `http://${process.env.HOSTNAME || 'localhost'}:${process.env.PORT || '3000'}/health/live`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
      },
    };

    await this.consul.agent.service.register(serviceRegistration);
    this.logger.log(`Service registered: ${serviceName} (${this.serviceId})`);

    // Sync with database
    await this.prisma.serviceRegistry.upsert({
      where: { instanceId: this.serviceId },
      create: {
        serviceName,
        instanceId: this.serviceId,
        host: serviceRegistration.address!,
        port: serviceRegistration.port!,
        metadata: serviceRegistration.meta,
        status: 'ACTIVE',
        healthCheckUrl: serviceRegistration.checks?.http?.http,
      },
      update: {
        lastHeartbeat: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  async deregisterService(): Promise<void> {
    await this.consul.agent.service.deregister(this.serviceId);
    
    await this.prisma.serviceRegistry.update({
      where: { instanceId: this.serviceId },
      data: {
        status: 'INACTIVE',
        deregisteredAt: new Date(),
      },
    });
  }

  async getAllServices(): Promise<any[]> {
    const result = await this.consul.agent.service.list();
    
    const services = Object.entries(result).map(([id, service]: [string, any]) => ({
      id,
      serviceName: service.Service,
      address: service.Address,
      port: service.Port,
      tags: service.Tags,
      meta: service.Meta,
    }));

    // Enrich with database info
    const dbServices = await this.prisma.serviceRegistry.findMany({
      where: {
        serviceName: { in: services.map(s => s.serviceName) },
        status: 'ACTIVE',
      },
    });

    return services.map(service => ({
      ...service,
      instances: dbServices.filter(s => s.serviceName === service.serviceName),
    }));
  }

  async getHealthyServices(): Promise<any[]> {
    const services = await this.getAllServices();
    
    return services.filter(service => {
      const healthyInstances = service.instances?.filter(
        (i: any) => i.status === 'ACTIVE' && this.isHeartbeatRecent(i.lastHeartbeat),
      );
      return healthyInstances && healthyInstances.length > 0;
    });
  }

  async getServiceAddress(serviceName: string): Promise<string | null> {
    const services = await this.getAllServices();
    const service = services.find(s => s.serviceName === serviceName);
    
    if (!service || !service.instances?.length) {
      return null;
    }

    // Round-robin load balancing
    const instances = service.instances.filter(
      (i: any) => i.status === 'ACTIVE' && this.isHeartbeatRecent(i.lastHeartbeat),
    );

    if (!instances.length) return null;

    const index = Math.floor(Math.random() * instances.length);
    const instance = instances[index];

    return `${instance.host}:${instance.port}`;
  }

  async getHealthChecks(): Promise<any[]> {
    const checks = await this.consul.agent.check.list();
    return Object.entries(checks).map(([id, check]: [string, any]) => ({
      id,
      name: check.Name,
      status: check.Status,
      output: check.Output,
      serviceId: check.ServiceID,
    }));
  }

  async watchServices(): Promise<void> {
    const watcher = this.consul.watch({
      method: this.consul.health.service,
      options: { passing: true },
    });

    watcher.on('change', (data: any[]) => {
      this.logger.debug(`Service watch: ${data.length} healthy services`);
    });

    watcher.on('error', (error: Error) => {
      this.logger.error(`Service watch error: ${error.message}`);
    });
  }

  async putKV(key: string, value: any): Promise<void> {
    const encodedValue = Buffer.from(JSON.stringify(value)).toString('base64');
    await this.consul.kv.set(key, encodedValue);
  }

  async getKV(key: string): Promise<any> {
    const result = await this.consul.kv.get(key);
    
    if (!result || !result.Value) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(result.Value, 'base64').toString());
    } catch {
      return result.Value;
    }
  }

  async watchKV(key: string, callback: (value: any) => void): Promise<void> {
    const watcher = this.consul.watch({
      method: this.consul.kv.get,
      options: { key },
    });

    watcher.on('change', (data: any) => {
      try {
        const value = data?.Value 
          ? JSON.parse(Buffer.from(data.Value, 'base64').toString())
          : null;
        callback(value);
      } catch (error) {
        this.logger.error(`KV watch parse error: ${error}`);
      }
    });
  }

  private isHeartbeatRecent(heartbeat: Date | null): boolean {
    if (!heartbeat) return false;
    return Date.now() - heartbeat.getTime() < 60000; // 1 minute
  }

  getServiceId(): string {
    return this.serviceId;
  }

  getConsul(): Consul {
    return this.consul;
  }
}
