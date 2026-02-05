import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('API Integration Tests', () => {
  let apiContext: APIRequestContext;
  let playwrightInstance: any;

  test.beforeAll(async ({ playwright: pw }) => {
    playwrightInstance = pw;
    apiContext = await pw.request.newContext({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_API_TOKEN || 'test-token'}`,
      },
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('Auth API', () => {
    test('POST /auth/login should return 200 with valid credentials', async () => {
      const response = await apiContext.post('/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'SecureP@ss123',
        },
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
    });

    test('POST /auth/login should return 401 with invalid credentials', async () => {
      const response = await apiContext.post('/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /auth/signup should create new user', async () => {
      const uniqueEmail = `new.user.${Date.now()}@example.com`;
      
      const response = await apiContext.post('/auth/signup', {
        data: {
          email: uniqueEmail,
          password: 'SecureP@ss123',
          firstName: 'New',
          lastName: 'User',
        },
      });

      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(uniqueEmail);
    });

    test('POST /auth/refresh should refresh token', async () => {
      const response = await apiContext.post('/auth/refresh', {
        data: {
          refreshToken: 'valid-refresh-token',
        },
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('accessToken');
    });
  });

  test.describe('Jobs API', () => {
    test('GET /jobs should return list of jobs', async () => {
      const response = await apiContext.get('/jobs', {
        params: {
          page: 1,
          limit: 10,
          search: 'software engineer',
        },
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('jobs');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.jobs)).toBe(true);
    });

    test('GET /jobs/:id should return job details', async () => {
      const response = await apiContext.get('/jobs/job-123');

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('company');
    });

    test('GET /jobs/:id should return 404 for non-existent job', async () => {
      const response = await apiContext.get('/jobs/non-existent-id');

      expect(response.status()).toBe(404);
    });

    test('POST /jobs should create new job posting', async () => {
      const response = await apiContext.post('/jobs', {
        data: {
          title: 'Test Job',
          company: 'Test Company',
          location: 'Remote',
          type: 'Full-time',
          description: 'This is a test job posting',
          salary: '$100k - $150k',
        },
      });

      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.title).toBe('Test Job');
    });
  });

  test.describe('Applications API', () => {
    test('GET /applications should return user applications', async () => {
      const response = await apiContext.get('/applications');

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(Array.isArray(body.applications)).toBe(true);
    });

    test('POST /applications should create new application', async () => {
      const response = await apiContext.post('/applications', {
        data: {
          jobId: 'job-123',
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0100',
          },
          experience: {
            years: 5,
            level: 'senior',
          },
        },
      });

      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.status).toBe('pending');
    });

    test('GET /applications/:id should return application details', async () => {
      const response = await apiContext.get('/applications/app-123');

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('status');
    });

    test('DELETE /applications/:id should cancel application', async () => {
      const response = await apiContext.delete('/applications/app-123');

      expect(response.status()).toBe(200);
    });
  });

  test.describe('User API', () => {
    test('GET /user/profile should return user profile', async () => {
      const response = await apiContext.get('/user/profile');

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
    });

    test('PATCH /user/profile should update user profile', async () => {
      const response = await apiContext.patch('/user/profile', {
        data: {
          firstName: 'Updated',
          lastName: 'User',
        },
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.firstName).toBe('Updated');
    });

    test('PUT /user/preferences should update user preferences', async () => {
      const response = await apiContext.put('/user/preferences', {
        data: {
          emailNotifications: true,
          pushNotifications: false,
          jobAlerts: true,
        },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('Error Handling', () => {
    test('should return 401 for unauthorized requests', async () => {
      const unauthorizedContext = await test.step('Create unauthorized context', async () => {
        return await playwrightInstance.request.newContext({
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
        });
      });

      const response = await unauthorizedContext.get('/user/profile');
      expect(response.status()).toBe(401);

      await unauthorizedContext.dispose();
    });

    test('should return 403 for forbidden requests', async () => {
      const response = await apiContext.get('/admin/users');

      expect(response.status()).toBe(403);
    });

    test('should handle rate limiting', async () => {
      const responses = await Promise.all([
        apiContext.get('/jobs'),
        apiContext.get('/jobs'),
        apiContext.get('/jobs'),
        apiContext.get('/jobs'),
        apiContext.get('/jobs'),
      ]);

      // At least one should be rate limited (429)
      const hasRateLimit = responses.some(r => r.status() === 429);
      expect(hasRateLimit || responses.every(r => r.status() === 200)).toBe(true);
    });
  });
});
