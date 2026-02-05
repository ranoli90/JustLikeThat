import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { RouteService } from './route.service';
import { RateLimitService } from './rate-limit.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import {
  Route,
  GatewayRequest,
  GatewayResponse,
} from '../interfaces/gateway.interface';
import { HttpStatusConstants } from '../../common/constants';

/**
 * GatewayService handles incoming HTTP requests and routes them to appropriate microservices
 * with rate limiting, circuit breaker protection, and metrics recording.
 */
@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly serviceClients: Map<string, ClientProxy> = new Map();
  private readonly routeRegexCache: Map<string, RegExp> = new Map();

  /**
   * Creates a new GatewayService instance
   * @param routeService - Service for finding matching routes
   * @param rateLimitService - Service for rate limiting
   * @param circuitBreakerService - Service for circuit breaker pattern
   * @param options - Gateway configuration options
   */
  constructor(
    private readonly routeService: RouteService,
    private readonly rateLimitService: RateLimitService,
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject('GATEWAY_OPTIONS') private readonly options: Record<string, unknown>,
  ) {}

  async handleRequest(request: GatewayRequest): Promise<GatewayResponse> {
    const startTime = Date.now();

    try {
      // Find matching route
      const route = await this.routeService.findMatchingRoute(
        request.path,
        request.method,
      );
      if (!route) {
        throw new HttpException('Not Found', HttpStatusConstants.NOT_FOUND);
      }

      // Apply rate limiting
      const rateLimitResult = await this.rateLimitService.checkLimit(
        route.targetService,
        request.clientId,
        request.path,
      );

      if (!rateLimitResult.allowed) {
        throw new HttpException(
          {
            message: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
          },
          HttpStatusConstants.TOO_MANY_REQUESTS,
        );
      }

      // Check circuit breaker
      const circuitState = await this.circuitBreakerService.getState(
        route.targetService,
      );
      if (circuitState === 'OPEN') {
        throw new HttpException(
          { message: 'Service temporarily unavailable' },
          HttpStatusConstants.SERVICE_UNAVAILABLE,
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
      await this.recordMetrics(
        route.targetService,
        request.path,
        latency,
        true,
      );

      return {
        statusCode: HttpStatusConstants.SUCCESS,
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

      this.logger.error(
        `Gateway request failed: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        { message: 'Internal server error' },
        HttpStatusConstants.INTERNAL_SERVER_ERROR,
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
  ): Promise<Record<string, unknown>> {
    // FIX: Use pre-compiled, validated regex patterns from route config
    // to prevent ReDoS attacks from user-controlled route.path
    let targetPath: string;
    if (route.stripPrefix) {
      if (route.pathPattern instanceof RegExp) {
        // Use pre-compiled, validated regex from route configuration
        targetPath = request.path.replace(route.pathPattern, '');
      } else {
        // Fallback to safe string operation
        const prefix = route.path.startsWith('/')
          ? route.path
          : `/${route.path}`;
        targetPath = request.path.startsWith(prefix)
          ? request.path.substring(prefix.length)
          : request.path;
      }
    } else {
      targetPath = route.targetPath || request.path;
    }

    return client
      .send(
        { cmd: route.method.toLowerCase() },
        {
          ...request,
          path: targetPath,
          headers: this.filterHeaders(request.headers),
        },
      )
      .toPromise();
  }

  private filterHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const excludedHeaders = ['connection', 'host', 'accept-encoding'];
    return Object.fromEntries(
      Object.entries(headers).filter(
        ([key]) => !excludedHeaders.includes(key.toLowerCase()),
      ),
    );
  }

  private async recordMetrics(
    service: string,
    path: string,
    latency: number,
    success: boolean,
  ): Promise<void> {
    // Record metrics to time-series database
    this.logger.debug(
      `Metrics recorded: service=${service}, path=${path}, latency=${latency}ms, success=${success}`,
    );
  }
}
