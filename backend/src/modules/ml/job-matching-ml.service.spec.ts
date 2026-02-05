import { Test, TestingModule } from '@nestjs/testing';
import { JobMatchingMLService, JobMatchingInput } from './job-matching-ml.service';
import { MLInfrastructureService } from './ml-infrastructure.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JobMatchingMLService', () => {
  let service: JobMatchingMLService;
  let mlInfrastructure: MLInfrastructureService;
  let prisma: PrismaService;

  const mockPrisma = {
    jobPosting: {
      findUnique: jest.fn(),
    },
    jobMatchPrediction: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockMLInfrastructure = {
    getEmbedding: jest.fn().mockResolvedValue(new Array(768).fill(0.5)),
    cosineSimilarity: jest.fn().mockReturnValue(0.85),
    euclideanDistance: jest.fn().mockReturnValue(0.3),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobMatchingMLService,
        {
          provide: MLInfrastructureService,
          useValue: mockMLInfrastructure,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<JobMatchingMLService>(JobMatchingMLService);
    mlInfrastructure = module.get<MLInfrastructureService>(MLInfrastructureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('matchCandidateToJob', () => {
    it('should return match result for valid input', async () => {
      const mockJob = {
        id: 'job-123',
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior software engineer...',
        requirements: '5+ years of experience required',
        skills: ['React', 'Node.js', 'TypeScript'],
        location: 'San Francisco, CA',
      };

      mockPrisma.jobPosting.findUnique.mockResolvedValue(mockJob);

      const input: JobMatchingInput = {
        candidateId: 'candidate-123',
        candidateProfile: {
          skills: ['React', 'Node.js', 'TypeScript', 'Python'],
          experience: [
            { title: 'Software Engineer', duration: 5, description: 'Full-stack development' },
          ],
          education: [
            { degree: 'Bachelor', field: 'Computer Science' },
          ],
          summary: 'Experienced software engineer with full-stack development skills',
        },
        preferences: {
          location: 'San Francisco',
          remotePreference: 'hybrid',
          salaryExpectation: 150000,
        },
      };

      const result = await service.matchCandidateToJob(input, 'job-123');

      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-123');
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(1);
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.successProbability).toBeLessThanOrEqual(1);
      expect(result.factors).toBeInstanceOf(Array);
      expect(result.matchedSkills).toBeInstanceOf(Array);
      expect(result.missingSkills).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should throw error for non-existent job', async () => {
      mockPrisma.jobPosting.findUnique.mockResolvedValue(null);

      const input: JobMatchingInput = {
        candidateId: 'candidate-123',
        candidateProfile: {
          skills: ['React'],
          experience: [],
          education: [],
        },
      };

      await expect(service.matchCandidateToJob(input, 'non-existent'))
        .rejects.toThrow('Job not found: non-existent');
    });

    it('should calculate skill match correctly', async () => {
      const mockJob = {
        id: 'job-123',
        title: 'Test Job',
        description: 'Test description',
        requirements: 'Test requirements',
        skills: ['React', 'Node.js', 'TypeScript'],
        location: 'Remote',
      };

      mockPrisma.jobPosting.findUnique.mockResolvedValue(mockJob);

      const input: JobMatchingInput = {
        candidateId: 'candidate-123',
        candidateProfile: {
          skills: ['React', 'Node.js'],
          experience: [],
          education: [],
        },
      };

      const result = await service.matchCandidateToJob(input, 'job-123');

      // Should have matched 2 out of 3 skills
      expect(result.matchedSkills.length).toBeGreaterThanOrEqual(1);
      expect(result.missingSkills).toContain('TypeScript');
    });

    it('should use custom weights when provided', async () => {
      const mockJob = {
        id: 'job-123',
        title: 'Test Job',
        description: 'Test description',
        requirements: 'Test requirements',
        skills: ['React'],
        location: 'Remote',
      };

      mockPrisma.jobPosting.findUnique.mockResolvedValue(mockJob);

      const input: JobMatchingInput = {
        candidateId: 'candidate-123',
        candidateProfile: {
          skills: ['React'],
          experience: [],
          education: [],
        },
      };

      const customWeights = {
        skillMatch: 0.5,
        experienceMatch: 0.2,
        educationMatch: 0.1,
        culturalFit: 0.1,
        locationMatch: 0.1,
      };

      const result = await service.matchCandidateToJob(input, 'job-123', customWeights);

      expect(result).toBeDefined();
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('batchMatchCandidateToJobs', () => {
    it('should match candidate to multiple jobs', async () => {
      const mockJob = {
        id: 'job-123',
        title: 'Test Job',
        description: 'Test description',
        requirements: 'Test requirements',
        skills: ['React'],
        location: 'Remote',
      };

      mockPrisma.jobPosting.findUnique.mockResolvedValue(mockJob);

      const input: JobMatchingInput = {
        candidateId: 'candidate-123',
        candidateProfile: {
          skills: ['React'],
          experience: [],
          education: [],
        },
      };

      const jobIds = ['job-1', 'job-2', 'job-3'];
      const results = await service.batchMatchCandidateToJobs(input, jobIds);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(jobIds.length);
      // Results should be sorted by match score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(results[i].matchScore);
      }
    });
  });

  describe('getMatchExplanation', () => {
    it('should return null for non-existent prediction', async () => {
      mockPrisma.jobMatchPrediction.findUnique.mockResolvedValue(null);

      const result = await service.getMatchExplanation('non-existent');

      expect(result).toBeNull();
    });

    it('should return prediction for existing prediction', async () => {
      const mockPrediction = {
        id: 'prediction-123',
        candidateId: 'candidate-123',
        jobId: 'job-123',
        matchScore: 0.75,
        successProb: 0.7,
        factors: [],
        explanation: {
          summary: 'Good match',
          strengths: ['Strong skills'],
          concerns: [],
          tips: [],
        },
      };

      mockPrisma.jobMatchPrediction.findUnique.mockResolvedValue(mockPrediction);

      const result = await service.getMatchExplanation('prediction-123');

      expect(result).toBeDefined();
      expect(result?.jobId).toBe('job-123');
      expect(result?.matchScore).toBe(0.75);
    });
  });

  describe('storeMatchPrediction', () => {
    it('should store prediction and return id', async () => {
      mockPrisma.jobMatchPrediction.create.mockResolvedValue({
        id: 'new-prediction-id',
      });

      const result = await service.storeMatchPrediction(
        'candidate-123',
        'job-123',
        {
          jobId: 'job-123',
          matchScore: 0.75,
          successProbability: 0.7,
          factors: [],
          explanation: { summary: 'Test', strengths: [], concerns: [], tips: [] },
          matchedSkills: [],
          missingSkills: [],
          recommendations: [],
        },
      );

      expect(result).toBe('new-prediction-id');
      expect(mockPrisma.jobMatchPrediction.create).toHaveBeenCalled();
    });
  });
});
