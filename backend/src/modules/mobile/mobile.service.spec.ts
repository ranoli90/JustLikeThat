/**
 * Mobile Service Unit Tests
 * Sprint 46 - Mobile Application Development
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MobileService } from './mobile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MobileService', () => {
  let service: MobileService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrisma = {
    jobPosting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    savedJob: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    resume: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    interviewSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    interviewQuestion: {
      findMany: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MobileService>(MobileService);
    prismaService = module.get(PrismaService);
    
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('searchJobs', () => {
    it('should return paginated job results', async () => {
      const mockJobs = [
        {
          id: '1',
          title: 'Senior Developer',
          company: { name: 'TechCorp' },
        },
      ];

      mockPrisma.jobPosting.findMany.mockResolvedValue(mockJobs);
      mockPrisma.jobPosting.count.mockResolvedValue(1);
      mockPrisma.savedJob.findMany.mockResolvedValue([]);

      const result = await service.searchJobs('user-1', {
        query: 'developer',
        page: 1,
        limit: 10,
        jobTypes: [],
        remoteTypes: [],
        salaryMin: null,
        salaryMax: null,
      });

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
    });

    it('should filter by job types', async () => {
      mockPrisma.jobPosting.findMany.mockResolvedValue([]);
      mockPrisma.jobPosting.count.mockResolvedValue(0);
      mockPrisma.savedJob.findMany.mockResolvedValue([]);

      await service.searchJobs('user-1', {
        query: null,
        page: 1,
        limit: 20,
        jobTypes: ['FULL_TIME', 'CONTRACT'],
        remoteTypes: [],
        salaryMin: null,
        salaryMax: null,
      });

      expect(mockPrisma.jobPosting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobType: { in: ['FULL_TIME', 'CONTRACT'] },
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      mockPrisma.jobPosting.findMany.mockResolvedValue([]);
      mockPrisma.jobPosting.count.mockResolvedValue(0);
      mockPrisma.savedJob.findMany.mockResolvedValue([]);

      const result = await service.searchJobs('user-1', {
        query: 'nonexistent',
        page: 1,
        limit: 10,
        jobTypes: [],
        remoteTypes: [],
        salaryMin: null,
        salaryMax: null,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });
  });

  describe('getApplications', () => {
    it('should return paginated applications', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          status: 'submitted',
          job: { title: 'Developer' },
        },
      ];

      mockPrisma.application.findMany.mockResolvedValue(mockApplications);
      mockPrisma.application.count.mockResolvedValue(1);

      const result = await service.getApplications('user-1', {
        page: 1,
        limit: 10,
        status: undefined,
      });

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);

      await service.getApplications('user-1', {
        page: 1,
        limit: 10,
        status: 'interview',
      });

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'interview',
          }),
        })
      );
    });
  });

  describe('getResumes', () => {
    it('should return user resumes', async () => {
      const mockResumes = [
        { id: 'resume-1', title: 'Resume 2024' },
        { id: 'resume-2', title: 'Resume Tech' },
      ];

      mockPrisma.resume.findMany.mockResolvedValue(mockResumes);

      const result = await service.getResumes('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getInterviews', () => {
    it('should return upcoming interviews', async () => {
      const mockInterviews = [
        {
          id: 'interview-1',
          type: 'video',
          scheduledAt: new Date(),
        },
      ];

      mockPrisma.interviewSession.findMany.mockResolvedValue(mockInterviews);

      const result = await service.getInterviews('user-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.interviewSession.findMany).toHaveBeenCalledWith({
        where: { application: { userId: 'user-1' } },
        orderBy: { scheduledAt: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'New Job Match' },
        { id: 'notif-2', title: 'Application Update' },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(2);

      const result = await service.getNotifications('user-1', {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(2);
      expect(result.hasNext).toBe(false);
    });
  });

  describe('markNotificationRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = {
        id: 'notif-1',
        read: true,
        readAt: new Date(),
      };

      mockPrisma.notification.update.mockResolvedValue(updatedNotification);

      const result = await service.markNotificationRead('notif-1');

      expect(result.read).toBe(true);
      expect(result.readAt).toBeDefined();
    });
  });

  describe('saveJob', () => {
    it('should save a job for user', async () => {
      const savedJob = {
        id: 'saved-1',
        userId: 'user-1',
        jobId: 'job-1',
      };

      mockPrisma.savedJob.create.mockResolvedValue(savedJob);

      const result = await service.saveJob('user-1', 'job-1');

      expect(result.userId).toBe('user-1');
      expect(result.jobId).toBe('job-1');
    });
  });

  describe('createApplication', () => {
    it('should create a new application', async () => {
      const newApplication = {
        id: 'app-1',
        userId: 'user-1',
        jobId: 'job-1',
        status: 'submitted',
      };

      mockPrisma.application.create.mockResolvedValue(newApplication);

      const result = await service.createApplication('user-1', {
        jobId: 'job-1',
        resumeId: 'resume-1',
        coverLetter: 'My cover letter',
        notes: 'Some notes',
      });

      expect(result.status).toBe('submitted');
      expect(mockPrisma.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          jobId: 'job-1',
          status: 'submitted',
        }),
      });
    });
  });
});
