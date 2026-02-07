import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MatchingService', () => {
  let service: MatchingService;
  let prisma: any;

  const mockPersona = {
    id: 'persona-1',
    userId: 'user-1',
    name: 'Full-Stack Dev',
    targetRole: 'Senior Developer',
    experienceLevel: 'SENIOR',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    isDefault: true,
    profile: {
      user: {
        preferences: {
          salaryMin: 120000,
          salaryMax: 180000,
          desiredLocations: ['San Francisco', 'Remote'],
        },
      },
    },
  };

  const mockJobs = [
    {
      id: 'job-1',
      title: 'Senior Full-Stack Engineer',
      company: 'TechCo',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
      location: 'San Francisco, CA',
      remotePreference: 'REMOTE',
      salaryRange: { min: 150000, max: 200000 },
      isExpired: false,
    },
    {
      id: 'job-2',
      title: 'Junior Python Developer',
      company: 'PyShop',
      skills: ['Python', 'Django', 'Flask'],
      location: 'Boston, MA',
      remotePreference: 'ONSITE',
      salaryRange: { min: 60000, max: 80000 },
      isExpired: false,
    },
    {
      id: 'job-3',
      title: 'React Developer',
      company: 'UILab',
      skills: ['React', 'TypeScript', 'CSS'],
      location: 'Remote',
      remotePreference: 'REMOTE',
      salaryRange: { min: 110000, max: 140000 },
      isExpired: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: PrismaService,
          useValue: {
            persona: {
              findMany: jest.fn().mockResolvedValue([mockPersona]),
              findUnique: jest.fn().mockResolvedValue(mockPersona),
            },
            jobPosting: {
              findMany: jest.fn().mockResolvedValue(mockJobs),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchesForUser', () => {
    it('should return matches sorted by score', async () => {
      const result = await service.getMatchesForUser('user-1', { limit: 10 });

      expect(result.matches).toBeDefined();
      expect(Array.isArray(result.matches)).toBe(true);
      expect(result.personaId).toBe('persona-1');

      // The first match should have a higher score than subsequent ones
      if (result.matches.length > 1) {
        expect(result.matches[0].overallScore).toBeGreaterThanOrEqual(result.matches[1].overallScore);
      }
    });

    it('should return message when no personas exist', async () => {
      prisma.persona.findMany.mockResolvedValue([]);

      const result = await service.getMatchesForUser('user-1', { limit: 10 });
      expect(result.message).toContain('Create a persona');
      expect(result.matches).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const result = await service.getMatchesForUser('user-1', { limit: 1 });
      expect(result.matches.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getMatchScore', () => {
    it('should return a score for valid persona and job', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(mockJobs[0]);

      const result = await service.getMatchScore('persona-1', 'job-1');

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('thresholdMet');
      expect(result).toHaveProperty('reasons');
      expect(result.jobPostingId).toBe('job-1');
      expect(result.personaId).toBe('persona-1');
    });

    it('should throw NotFoundException for invalid persona', async () => {
      prisma.persona.findUnique.mockResolvedValue(null);

      await expect(service.getMatchScore('invalid', 'job-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid job', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(null);

      await expect(service.getMatchScore('persona-1', 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should score remote jobs higher for remote-preferring candidates', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(mockJobs[0]); // REMOTE job
      const remoteResult = await service.getMatchScore('persona-1', 'job-1');

      prisma.jobPosting.findUnique.mockResolvedValue(mockJobs[1]); // ONSITE job in Boston
      const onsiteResult = await service.getMatchScore('persona-1', 'job-2');

      expect(remoteResult.overallScore).toBeGreaterThan(onsiteResult.overallScore);
    });

    it('should score skill-matching jobs higher', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(mockJobs[0]); // TypeScript, React, Node.js match
      const matchingResult = await service.getMatchScore('persona-1', 'job-1');

      prisma.jobPosting.findUnique.mockResolvedValue(mockJobs[1]); // Python, Django - no match
      const nonMatchingResult = await service.getMatchScore('persona-1', 'job-2');

      expect(matchingResult.breakdown.skills).toBeGreaterThan(nonMatchingResult.breakdown.skills);
    });
  });
});
