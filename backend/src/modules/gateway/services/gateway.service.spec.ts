import { Test, TestingModule } from '@nestjs/testing';
import { GatewayService } from './gateway.service';
import { RouteService } from './route.service';
import { RateLimitService } from './rate-limit.service';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('GatewayService', () => {
  let service: GatewayService;
  let routeService: jest.Mocked<RouteService>;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let circuitBreakerService: jest.Mocked<CircuitBreakerService>;

  const mockRoute = {
    id: 'test-route-1',
    path: '/api/v1/users',
    method: 'GET',
    targetService: 'user-service',
    stripPrefix: false,
    preserveHost: false,
    active: true,
    priority: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRouteService = {
      findMatchingRoute: jest.fn(),
    };

    const mockRateLimitService = {
      checkLimit: jest.fn(),
    };

    const mockCircuitBreakerService = {
      getState: jest.fn(),
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: RouteService, useValue: mockRouteService },
        { provide: RateLimitService, useValue: mockRateLimitService },
        { provide: CircuitBreakerService, useValue: mockCircuitBreakerService },
        { provide: 'GATEWAY_OPTIONS', useValue: {} },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
    routeService = module.get(RouteService);
    rateLimitService = module.get(RateLimitService);
    circuitBreakerService = module.get(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should route request successfully', async () => {
      const mockRequest = {
        path: '/api/v1/users',
        method: 'GET',
        headers: { 'content-type': 'application/json' },
        clientId: 'client-123',
        ip: '127.0.0.1',
        timestamp: Date.now(),
      };

      routeService.findMatchingRoute.mockResolvedValue(mockRoute);
      rateLimitService.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        remaining: 999,
        resetAt: Date.now() + 60000,
      });
      circuitBreakerService.getState.mockResolvedValue('CLOSED');

      const result = await service.handleRequest(mockRequest);

      expect(result.statusCode).toBe(200);
      expect(routeService.findMatchingRoute).toHaveBeenCalledWith('/api/v1/users', 'GET');
    });

    it('should return 404 for unmatched route', async () => {
      const mockRequest = {
        path: '/api/v1/nonexistent',
        method: 'GET',
        headers: {},
        clientId: 'client-123',
        ip: '127.0.0.1',
        timestamp: Date.now(),
      };

      routeService.findMatchingRoute.mockResolvedValue(null);

      await expect(service.handleRequest(mockRequest)).rejects.toThrow('Not Found');
    });

    it('should reject request when rate limited', async () => {
      const mockRequest = {
        path: '/api/v1/users',
        method: 'GET',
        headers: {},
        clientId: 'client-123',
        ip: '127.0.0.1',
        timestamp: Date.now(),
      };

      routeService.findMatchingRoute.mockResolvedValue(mockRoute);
      rateLimitService.checkLimit.mockResolvedValue({
        allowed: false,
        limit: 1000,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfter: 30,
      });

      await expect(service.handleRequest(mockRequest)).rejects.toThrow('Rate limit exceeded');
    });

    it('should reject request when circuit breaker is open', async () => {
      const mockRequest = {
        path: '/api/v1/users',
        method: 'GET',
        headers: {},
        clientId: 'client-123',
        ip: '127.0.0.1',
        timestamp: Date.now(),
      };

      routeService.findMatchingRoute.mockResolvedValue(mockRoute);
      rateLimitService.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 1000,
        remaining: 999,
        resetAt: Date.now() + 60000,
      });
      circuitBreakerService.getState.mockResolvedValue('OPEN');

      await expect(service.handleRequest(mockRequest)).rejects.toThrow('Service temporarily unavailable');
    });
  });
});
