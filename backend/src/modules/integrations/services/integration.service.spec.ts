// ============ LINKEDIN SERVICE UNIT TESTS ============

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LinkedInService } from '../services/job-boards/linkedin.service';

describe('LinkedInService', () => {
  let service: LinkedInService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          LINKEDIN_CLIENT_ID: 'test-client-id',
          LINKEDIN_CLIENT_SECRET: 'test-client-secret',
          LINKEDIN_REDIRECT_URI: 'http://localhost:3000/callback',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LinkedInService>(LinkedInService);
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with correct parameters', () => {
      const state = 'test-state-123';
      const url = service.getAuthorizationUrl(state);

      expect(url).toContain('https://www.linkedin.com/oauth/v2/authorization');
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('state=test-state-123');
      expect(url).toContain('scope=');
    });

    it('should include required LinkedIn scopes', () => {
      const url = service.getAuthorizationUrl('state');
      expect(url).toContain('r_liteprofile');
      expect(url).toContain('r_emailaddress');
      expect(url).toContain('w_member_social');
      expect(url).toContain('r_jobs');
    });
  });

  describe('connect', () => {
    it('should return connected status with valid credentials', async () => {
      const credentials = {
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
        expiresIn: 3600,
      };

      const result = await service.connect(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.connected).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
      const credentials = {
        accessToken: 'invalid-token',
        refreshToken: 'invalid-token',
      };

      const result = await service.connect(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('searchJobs', () => {
    it('should return empty array when no access token', async () => {
      const params = { query: 'software engineer', location: 'San Francisco' };

      const result = await service.searchJobs(params);

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('applyToJob', () => {
    it('should return application URL', async () => {
      const credentials = { accessToken: 'test-token' };
      const jobId = '123456';
      const resumeId = 'resume-123';

      const result = await service.applyToJob(credentials, jobId, resumeId);

      expect(result.success).toBe(true);
      expect(result.data.applied).toBe(false);
      expect(result.data.applicationUrl).toContain('linkedin.com/jobs/view');
    });
  });
});

describe('IndeedService', () => {
  let service: IndeedService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndeedService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<IndeedService>(IndeedService);
  });

  describe('connect', () => {
    it('should connect with valid API key', async () => {
      const credentials = { apiKey: 'valid-api-key' };

      const result = await service.connect(credentials);

      expect(result.success).toBe(true);
      expect(result.data.connected).toBe(true);
    });
  });

  describe('searchJobs', () => {
    it('should return jobs in correct format', async () => {
      const params = { query: 'developer', page: 1, limit: 10 };

      const result = await service.searchJobs(params);

      expect(result.jobs).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.total).toBeDefined();
    });
  });
});

describe('GlassdoorService', () => {
  let service: GlassdoorService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GLASSDOOR_API_KEY: 'test-api-key',
          GLASSDOOR_USER_ID: 'test-user-id',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlassdoorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GlassdoorService>(GlassdoorService);
  });

  describe('connect', () => {
    it('should connect with valid credentials', async () => {
      const credentials = { apiKey: 'test-key' };

      const result = await service.connect(credentials);

      expect(result.success).toBe(true);
    });
  });
});
