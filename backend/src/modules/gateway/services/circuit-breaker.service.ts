import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CircuitBreakerState } from '../interfaces/gateway.interface';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly stateCache: Map<string, CircuitBreakerState> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getState(service: string): Promise<'CLOSED' | 'OPEN' | 'HALF_OPEN'> {
    // Check memory cache first
    const cached = this.stateCache.get(service);
    if (cached) {
      if (this.isExpired(cached)) {
        this.stateCache.delete(service);
      } else {
        return cached.state;
      }
    }

    // Fetch from Redis or database
    const state = await this.fetchState(service);
    this.stateCache.set(service, state);
    
    return state.state;
  }

  async execute<T>(
    service: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const state = await this.getState(service);

    if (state === 'OPEN') {
      // Check if we should try half-open
      const config = await this.getConfig(service);
      if (state.nextAttempt && Date.now() >= state.nextAttempt.getTime()) {
        await this.setState(service, 'HALF_OPEN');
      } else {
        throw new Error(`Circuit breaker is OPEN for service: ${service}`);
      }
    }

    try {
      const result = await fn();
      await this.onSuccess(service);
      return result;
    } catch (error) {
      await this.onFailure(service, error);
      throw error;
    }
  }

  private async onSuccess(service: string): Promise<void> {
    const state = await this.fetchState(service);
    const config = await this.getConfig(service);

    if (state.state === 'HALF_OPEN') {
      // Successful half-open request, close circuit
      await this.setState(service, 'CLOSED');
      this.logger.log(`Circuit breaker CLOSED for service: ${service}`);
    } else {
      // Update success count
      await this.redisService.incr(`circuitbreaker:${service}:success`);
    }

    // Record event
    await this.recordEvent(service, 'SUCCESS', 'Request succeeded');
  }

  private async onFailure(service: string, error: Error): Promise<void> {
    const state = await this.fetchState(service);
    const config = await this.getConfig(service);

    // Increment failure count
    const failureCount = await this.redisService.incr(`circuitbreaker:${service}:failure`);
    await this.redisService.set(
      `circuitbreaker:${service}:last_failure`,
      new Date().toISOString(),
    );

    // Record event
    await this.recordEvent(service, 'FAILURE', error.message);

    // Check if we should open the circuit
    if (failureCount >= config.failureThreshold) {
      const nextAttempt = new Date(Date.now() + config.timeoutMs);
      await this.setState(service, 'OPEN', nextAttempt);
      this.logger.warn(`Circuit breaker OPEN for service: ${service} after ${failureCount} failures`);
    } else if (state.state === 'HALF_OPEN') {
      // Failed half-open request, reopen circuit
      await this.setState(service, 'OPEN');
    }
  }

  private async setState(
    service: string,
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    nextAttempt?: Date,
  ): Promise<void> {
    const newState: CircuitBreakerState = {
      service,
      state,
      failureCount: 0,
      successCount: 0,
      lastSuccess: state === 'CLOSED' ? new Date() : undefined,
      nextAttempt,
    };

    // Update memory cache
    this.stateCache.set(service, newState);

    // Update database
    await this.prisma.circuitBreakerConfig.upsert({
      where: { serviceName: service },
      create: {
        serviceName: service,
        status: state,
        lastStateChange: new Date(),
      },
      update: {
        status: state,
        lastStateChange: new Date(),
      },
    });

    // Update Redis for fast access
    await this.redisService.hset(`circuitbreaker:state:${service}`, {
      state,
      last_state_change: new Date().toISOString(),
      next_attempt: nextAttempt?.toISOString() || '',
    });
  }

  private async fetchState(service: string): Promise<CircuitBreakerState> {
    // Try Redis first
    try {
      const redisState = await this.redisService.hgetall(`circuitbreaker:state:${service}`);
      
      if (Object.keys(redisState).length > 0) {
        return {
          service,
          state: redisState.state as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
          failureCount: parseInt(redisState.failure_count || '0', 10),
          successCount: parseInt(redisState.success_count || '0', 10),
          lastFailure: redisState.last_failure ? new Date(redisState.last_failure) : undefined,
          nextAttempt: redisState.next_attempt ? new Date(redisState.next_attempt) : undefined,
        };
      }
    } catch {
      // Fall through to database
    }

    // Fall back to database
    const config = await this.prisma.circuitBreakerConfig.findUnique({
      where: { serviceName: service },
    });

    if (!config) {
      return {
        service,
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
      };
    }

    return {
      service,
      state: config.status,
      failureCount: parseInt(redisState?.failure_count || '0', 10),
      successCount: parseInt(redisState?.success_count || '0', 10),
      lastFailure: config.lastStateChange,
      nextAttempt: config.lastStateChange 
        ? new Date(config.lastStateChange.getTime() + config.timeoutMs)
        : undefined,
    };
  }

  private async getConfig(service: string): Promise<{
    failureThreshold: number;
    timeoutMs: number;
    halfOpenRequests: number;
  }> {
    const config = await this.prisma.circuitBreakerConfig.findUnique({
      where: { serviceName: service },
    });

    if (config) {
      return {
        failureThreshold: config.failureThreshold,
        timeoutMs: config.timeoutMs,
        halfOpenRequests: config.halfOpenRequests,
      };
    }

    // Default configuration
    return {
      failureThreshold: 5,
      timeoutMs: 60000,
      halfOpenRequests: 3,
    };
  }

  private async recordEvent(
    service: string,
    eventType: string,
    message: string,
  ): Promise<void> {
    const circuit = await this.prisma.circuitBreakerConfig.findUnique({
      where: { serviceName: service },
    });

    if (circuit) {
      await this.prisma.circuitBreakerEvent.create({
        data: {
          circuitBreakerId: circuit.id,
          eventType: eventType as any,
          message,
        },
      });
    }
  }

  private isExpired(state: CircuitBreakerState): boolean {
    // Cache expires after 30 seconds
    return Date.now() - (state.lastSuccess?.getTime() || 0) > 30000;
  }

  async resetCircuit(service: string): Promise<void> {
    this.stateCache.delete(service);
    await this.redisService.del(`circuitbreaker:${service}:failure`);
    await this.redisService.del(`circuitbreaker:${service}:success`);
    await this.redisService.del(`circuitbreaker:state:${service}`);
    await this.setState(service, 'CLOSED');
  }
}
