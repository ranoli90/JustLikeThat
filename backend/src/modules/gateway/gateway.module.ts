import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { GatewayController } from './controllers/gateway.controller';
import { GatewayService } from './services/gateway.service';
import { RouteService } from './services/route.service';
import { RateLimitService } from './services/rate-limit.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { HealthCheckService } from './services/health-check.service';
import { ConsulModule } from '../consul/consul.module';
import { RedisModule } from '../redis/redis.module';

@Module({})
export class GatewayModule {
  static forRoot(options?: GatewayOptions): DynamicModule {
    const providers: Provider[] = [
      GatewayService,
      RouteService,
      RateLimitService,
      CircuitBreakerService,
      HealthCheckService,
      {
        provide: 'GATEWAY_OPTIONS',
        useValue: options || {},
      },
    ];

    const imports = [];
    if (options?.useConsul !== false) {
      imports.push(ConsulModule);
    }
    if (options?.useRedis !== false) {
      imports.push(RedisModule);
    }

    return {
      module: GatewayModule,
      controllers: [GatewayController],
      providers,
      imports,
      exports: [GatewayService, RouteService],
      global: options?.global || false,
    };
  }
}

export interface GatewayOptions {
  global?: boolean;
  useConsul?: boolean;
  useRedis?: boolean;
  defaultTimeout?: number;
  defaultRetries?: number;
  maxRetries?: number;
}
