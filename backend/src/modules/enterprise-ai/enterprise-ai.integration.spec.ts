import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EnterpriseAiModule } from './enterprise-ai.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedResume } from './entities/generated-resume.entity';
import { CoverLetter } from './entities/cover-letter.entity';
import { JobDescription } from './entities/job-description.entity';
import { CareerPath } from './entities/career-path.entity';
import { NegotiationSession } from './entities/negotiation-session.entity';
import { InterviewSession } from './entities/interview-session.entity';
import { ResumeTemplate } from './entities/resume-template.entity';

describe('EnterpriseAiController (e2e)', () => {
  let app: INestApplication;

  const mockResumeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCoverLetterRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockJobDescriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCareerPathRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockNegotiationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockInterviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockTemplateRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EnterpriseAiModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            GeneratedResume,
            CoverLetter,
            JobDescription,
            CareerPath,
            NegotiationSession,
            InterviewSession,
            ResumeTemplate,
          ],
          synchronize: true,
        }),
      ],
    })
      .overrideProvider('GeneratedResumeRepository')
      .useValue(mockResumeRepository)
      .overrideProvider('CoverLetterRepository')
      .useValue(mockCoverLetterRepository)
      .overrideProvider('JobDescriptionRepository')
      .useValue(mockJobDescriptionRepository)
      .overrideProvider('CareerPathRepository')
      .useValue(mockCareerPathRepository)
      .overrideProvider('NegotiationSessionRepository')
      .useValue(mockNegotiationRepository)
      .overrideProvider('InterviewSessionRepository')
      .useValue(mockInterviewRepository)
      .overrideProvider('ResumeTemplateRepository')
      .useValue(mockTemplateRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/enterprise-ai/health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/enterprise-ai/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('POST /api/v1/enterprise-ai/resume/generate', () => {
    it('should generate resume', () => {
      const input = {
        userId: 'test-user',
        personalInfo: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          location: 'San Francisco',
        },
        summary: 'Experienced engineer',
        experience: [
          {
            company: 'Tech Corp',
            title: 'Software Engineer',
            startDate: '2020-01',
            current: true,
            description: 'Developing software',
            achievements: ['Launched feature X'],
          },
        ],
        education: [
          {
            institution: 'Stanford',
            degree: 'BS',
            field: 'CS',
            graduationDate: '2019-05',
          },
        ],
        skills: ['JavaScript', 'React'],
      };

      mockTemplateRepository.findOne.mockResolvedValue({
        id: 'template-1',
        name: 'Modern',
        category: 'professional',
        atsCompatible: true,
        styles: {},
        sections: ['header', 'summary', 'experience', 'education', 'skills'],
        isActive: true,
      });

      mockResumeRepository.create.mockImplementation((data) => data);
      mockResumeRepository.save.mockImplementation(async (data) => ({
        ...data,
        id: 'resume-id',
        atsScore: 85,
        keywordsScore: 80,
        formatScore: 95,
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/api/v1/enterprise-ai/resume/generate')
        .send(input)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.atsScore).toBeDefined();
        });
    });
  });

  describe('POST /api/v1/enterprise-ai/cover-letter/generate', () => {
    it('should generate cover letter', () => {
      const input = {
        userId: 'test-user',
        personalInfo: { fullName: 'John Doe', email: 'john@example.com' },
        companyInfo: { name: 'Tech Corp', industry: 'Technology' },
        jobInfo: {
          title: 'Software Engineer',
          requirements: ['JavaScript', 'React'],
          responsibilities: ['Develop features'],
        },
        experience: [
          {
            company: 'Prev Corp',
            title: 'Engineer',
            achievements: ['Built feature X'],
            skills: ['JavaScript'],
          },
        ],
        tone: 'professional',
        length: 'medium',
      };

      mockCoverLetterRepository.create.mockImplementation((data) => data);
      mockCoverLetterRepository.save.mockImplementation(async (data) => ({
        ...data,
        id: 'cover-letter-id',
        draftVersions: ['Version 1', 'Version 2'],
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/api/v1/enterprise-ai/cover-letter/generate')
        .send(input)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.content).toBeDefined();
          expect(res.body.draftVersions.length).toBeGreaterThan(0);
        });
    });
  });

  describe('POST /api/v1/enterprise-ai/job-description/generate', () => {
    it('should generate job description', () => {
      const input = {
        tenantId: 'tenant-1',
        role: 'Software Engineer',
        department: 'Engineering',
        level: 'senior',
        industry: 'Technology',
        requirements: { required: ['5 years experience'] },
        responsibilities: ['Lead development'],
      };

      mockJobDescriptionRepository.create.mockImplementation((data) => data);
      mockJobDescriptionRepository.save.mockImplementation(async (data) => ({
        ...data,
        id: 'jd-id',
        eeocCompliant: true,
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/api/v1/enterprise-ai/job-description/generate')
        .send(input)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.eeocCompliant).toBe(true);
        });
    });
  });

  describe('POST /api/v1/enterprise-ai/career-path', () => {
    it('should generate career path', () => {
      const input = {
        userId: 'test-user',
        currentRole: 'Engineer',
        targetRole: 'Senior Engineer',
        currentSkills: ['JavaScript', 'React'],
        experienceYears: 3,
        timeline: 'moderate',
      };

      mockCareerPathRepository.create.mockImplementation((data) => data);
      mockCareerPathRepository.save.mockImplementation(async (data) => ({
        ...data,
        id: 'path-id',
        progress: 0,
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/api/v1/enterprise-ai/career-path')
        .send(input)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.currentRole).toBe('Engineer');
          expect(res.body.targetRole).toBe('Senior Engineer');
        });
    });
  });

  describe('POST /api/v1/enterprise-ai/negotiation/analyze', () => {
    it('should analyze job offer', () => {
      const input = {
        userId: 'test-user',
        currentOffer: { baseSalary: 120000, bonus: 15000 },
        marketData: { role: 'Engineer', industry: 'Technology', location: 'SF' },
      };

      mockNegotiationRepository.create.mockImplementation((data) => data);
      mockNegotiationRepository.save.mockImplementation(async (data) => ({
        ...data,
        id: 'session-id',
        successPrediction: 75,
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/api/v1/enterprise-ai/negotiation/analyze')
        .send(input)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.successPrediction).toBeDefined();
          expect(res.body.counterOffer).toBeDefined();
        });
    });
  });

  describe('POST /api/v1/enterprise-ai/interview/start', () => {
    it('should start interview session', () => {
      const input = {
        userId: 'test-user',
        jobDetails: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          requiredSkills: ['JavaScript', 'React'],
        },
      };

      mockInterviewRepository.create.mockImplementation((data) => data);
      mockInterviewRepository.save.mockImplementation(async (data) => ({
        ...data,
        id: 'session-id',
        overallScore: 0,
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/api/v1/enterprise-ai/interview/start')
        .send(input)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.questionBank).toBeDefined();
          expect(res.body.currentQuestion).toBeDefined();
        });
    });
  });
});
