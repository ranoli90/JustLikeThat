// ============ JOB BOARD SERVICES UNIT TESTS ============

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LinkedInService } from './linkedin.service';
import { IndeedService } from './indeed.service';
import { GlassdoorService } from './glassdoor.service';

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
    it('should generate authorization URL', () => {
      const state = 'test-state';
      const url = service.getAuthorizationUrl(state);

      expect(url).toContain('linkedin.com/oauth/v2/authorization');
      expect(url).toContain('response_type=code');
    });
  });

  describe('connect', () => {
    it('should connect with credentials', async () => {
      const result = await service.connect({ accessToken: 'test' });
      expect(result.success).toBeDefined();
    });
  });

  describe('searchJobs', () => {
    it('should return empty when no token', async () => {
      const result = await service.searchJobs({ query: 'test' });
      expect(result.jobs).toEqual([]);
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
    it('should connect with API key', async () => {
      const result = await service.connect({ apiKey: 'test-key' });
      expect(result.success).toBe(true);
    });
  });
});

describe('GlassdoorService', () => {
  let service: GlassdoorService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GLASSDOOR_API_KEY: 'test-key',
          GLASSDOOR_USER_ID: 'test-user',
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
    it('should connect with credentials', async () => {
      const result = await service.connect({ apiKey: 'test-key' });
      expect(result.success).toBe(true);
    });
  });
});
