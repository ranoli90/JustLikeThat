import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from '../../redis/redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      setex: jest.fn(),
      incr: jest.fn(),
      incrby: jest.fn(),
      ttl: jest.fn(),
      hgetall: jest.fn(),
      hset: jest.fn(),
      expire: jest.fn(),
      hincrby: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLimit', () => {
    it('should allow first request in window', async () => {
      const result = await service.checkLimit('test-service', 'client-1', '/api/test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999);
      expect(redisService.setex).toHaveBeenCalled();
    });

    it('should reject when rate limit exceeded', async () => {
      redisService.get.mockResolvedValue('1000');
      redisService.ttl.mockResolvedValue(30);

      const result = await service.checkLimit('test-service', 'client-1', '/api/test');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBe(30);
    });

    it('should fail open when Redis is unavailable', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.checkLimit('test-service', 'client-1', '/api/test');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1000);
    });

    it('should increment counter for subsequent requests', async () => {
      redisService.get.mockResolvedValue('5');

      const result = await service.checkLimit('test-service', 'client-1', '/api/test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(994);
      expect(redisService.incr).toHaveBeenCalled();
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return custom config when available', async () => {
      redisService.hgetall.mockResolvedValue({
        max_requests: '2000',
        window_seconds: '120',
      });

      const config = await service.getRateLimitConfig('test-service', '/api/test');

      expect(config.maxRequests).toBe(2000);
      expect(config.windowSeconds).toBe(120);
    });

    it('should return default config when no custom config', async () => {
      redisService.hgetall.mockResolvedValue({});

      const config = await service.getRateLimitConfig('test-service', '/api/test');

      expect(config.maxRequests).toBe(1000);
      expect(config.windowSeconds).toBe(60);
    });

    it('should return default config on error', async () => {
      redisService.hgetall.mockRejectedValue(new Error('Redis error'));

      const config = await service.getRateLimitConfig('test-service', '/api/test');

      expect(config.maxRequests).toBe(1000);
      expect(config.windowSeconds).toBe(60);
    });
  });

  describe('setRateLimitConfig', () => {
    it('should set custom rate limit config', async () => {
      await service.setRateLimitConfig('test-service', '/api/test', 500, 30);

      expect(redisService.hset).toHaveBeenCalledWith(
        'ratelimit:config:test-service:/api/test',
        {
          max_requests: '500',
          window_seconds: '30',
        },
      );
      expect(redisService.expire).toHaveBeenCalled();
    });

    it('should set default config for wildcard endpoint', async () => {
      await service.setRateLimitConfig('test-service', '*', 2000, 60);

      expect(redisService.hset).toHaveBeenCalledWith(
        'ratelimit:config:test-service:default',
        expect.objectContaining({
          max_requests: '2000',
        }),
      );
    });
  });
});
