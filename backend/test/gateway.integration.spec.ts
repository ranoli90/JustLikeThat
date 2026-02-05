import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Gateway Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('GET /health/live should return liveness status', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
        });
    });

    it('GET /health/ready should return readiness status', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body.checks).toBeDefined();
        });
    });

    it('GET /health/cluster should return cluster health', () => {
      return request(app.getHttpServer())
        .get('/health/cluster')
        .expect(200)
        .expect((res) => {
          expect(res.body.checks).toBeDefined();
          expect(res.body.status).toBeDefined();
        });
    });
  });

  describe('Gateway Routes', () => {
    it('GET /api/v1/gateway/routes should return routes', () => {
      return request(app.getHttpServer())
        .get('/api/v1/gateway/routes')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('POST /api/v1/gateway/routes should create a route', () => {
      const newRoute = {
        path: '/api/v1/test',
        method: 'GET',
        targetService: 'test-service',
        active: true,
      };

      return request(app.getHttpServer())
        .post('/api/v1/gateway/routes')
        .send(newRoute)
        .expect(201)
        .expect((res) => {
          expect(res.body.path).toBe(newRoute.path);
          expect(res.body.targetService).toBe(newRoute.targetService);
        });
    });
  });

  describe('Scaling Endpoints', () => {
    it('GET /api/v1/scaling/status should return scaling status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/scaling/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.services).toBeDefined();
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in response', () => {
      return request(app.getHttpServer())
        .get('/api/v1/gateway/routes')
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-ratelimit-limit']).toBeDefined();
          expect(res.headers['x-ratelimit-remaining']).toBeDefined();
        });
    });
  });
});
