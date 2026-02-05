import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RouteService } from './route.service';
import { RateLimitService } from './rate-limit.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { Route, GatewayRequest, GatewayResponse } from '../interfaces/gateway.interface';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly serviceClients: Map<string, ClientProxy> = new Map();

  constructor(
    private readonly routeService: RouteService,
    private readonly rateLimitService: RateLimitService,
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject('GATEWAY_OPTIONS') private readonly options: Record<string, any>,
  ) {}

  async handleRequest(request: GatewayRequest): Promise<GatewayResponse> {
    const startTime = Date.now();
    
    try {
      // Find matching route
      const route = await this.routeService.findMatchingRoute(request.path, request.method);
      if (!route) {
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
      }

      // Apply rate limiting
      const rateLimitResult = await this.rateLimitService.checkLimit(
        route.targetService,
        request.clientId,
        request.path,
      );
      
      if (!rateLimitResult.allowed) {
        throw new HttpException(
          { message: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check circuit breaker
      const circuitState = await this.circuitBreakerService.getState(route.targetService);
      if (circuitState === 'OPEN') {
        throw new HttpException(
          { message: 'Service temporarily unavailable' },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Get service client
      const client = this.getOrCreateClient(route.targetService);
      
      // Execute request with circuit breaker protection
      const response = await this.circuitBreakerService.execute(
        route.targetService,
        () => this.forwardRequest(client, request, route),
      );

      // Record metrics
      const latency = Date.now() - startTime;
      await this.recordMetrics(route.targetService, request.path, latency, true);

      return {
        statusCode: HttpStatus.OK,
        data: response,
        headers: {
          'X-Response-Time': `${latency}ms`,
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      await this.recordMetrics(
        request.path.split('/')[2] || 'unknown',
        request.path,
        latency,
        false,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Gateway request failed: ${error.message}`, error.stack);
      throw new HttpException(
        { message: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getOrCreateClient(serviceName: string): ClientProxy {
    if (!this.serviceClients.has(serviceName)) {
      // Create gRPC client for the service
      const client = ClientProxyFactory.create({
        transport: Transport.GRPC,
        options: {
          package: serviceName,
          protoPath: `src/proto/${serviceName}.proto`,
          url: `${serviceName}:50051`,
        },
      });
      this.serviceClients.set(serviceName, client);
    }
    return this.serviceClients.get(serviceName)!;
  }

  private async forwardRequest(
    client: ClientProxy,
    request: GatewayRequest,
    route: Route,
  ): Promise<any> {
    const targetPath = route.stripPrefix
      ? request.path.replace(new RegExp(`^${route.path}`), '')
      : route.targetPath || request.path;

    return client.send(
      { cmd: route.method.toLowerCase() },
      {
        ...request,
        path: targetPath,
        headers: this.filterHeaders(request.headers),
      },
    ).toPromise();
  }

  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    const excludedHeaders = ['connection', 'host', 'accept-encoding'];
    return Object.fromEntries(
      Object.entries(headers).filter(([key]) => !excludedHeaders.includes(key.toLowerCase())),
    );
  }

  private async recordMetrics(
    service: string,
    path: string,
    latency: number,
    success: boolean,
  ): Promise<void> {
    // Record metrics to time-series database
    this.logger.debug(`Metrics recorded: service=${service}, path=${path}, latency=${latency}ms, success=${success}`);
  }
}
