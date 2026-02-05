/**
 * Mobile Service - Business logic for mobile API
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ JOBS ============

  async searchJobs(userId: string, criteria: any) {
    const { query, page, limit, jobTypes, remoteTypes, salaryMin, salaryMax } = criteria;

    const where: any = {
      status: 'active',
      applicationDeadline: { gte: new Date() },
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (jobTypes.length > 0) {
      where.jobType = { in: jobTypes };
    }

    if (remoteTypes.length > 0) {
      where.remoteType = { in: remoteTypes };
    }

    if (salaryMin || salaryMax) {
      where.salaryRange = {};
      if (salaryMin) where.salaryRange.gte = salaryMin;
      if (salaryMax) where.salaryRange.lte = salaryMax;
    }

    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { postedAt: 'desc' },
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true, website: true, size: true, industry: true },
          },
          location: true,
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    // Check saved jobs
    const savedJobIds = await this.prisma.savedJob.findMany({
      where: { userId, jobId: { in: items.map(j => j.id) } },
      select: { jobId: true },
    });
    const savedIds = new Set(savedJobIds.map(s => s.jobId));

    const jobs = items.map(job => ({
      ...job,
      isSaved: savedIds.has(job.id),
    }));

    return {
      items: jobs,
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };
  }

  async getJob(id: string) {
    return this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        company: true,
        location: true,
      },
    });
  }

  async saveJob(userId: string, jobId: string) {
    return this.prisma.savedJob.create({
      data: { userId, jobId },
    });
  }

  async unsaveJob(userId: string, jobId: string) {
    return this.prisma.savedJob.delete({
      where: { userId_jobId: { userId, jobId } },
    });
  }

  async getSavedJobs(userId: string) {
    return this.prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            company: true,
            location: true,
          },
        },
      },
    });
  }

  async getJobRecommendations(userId: string) {
    // Get user's application history and saved jobs to generate recommendations
    const userApplications = await this.prisma.application.findMany({
      where: { userId },
      select: { jobId: true },
    });

    const userSavedJobs = await this.prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
    });

    const appliedJobIds = userApplications.map(a => a.jobId);
    const savedJobIds = userSavedJobs.map(s => s.jobId);

    // Find similar jobs based on applied job categories
    const recommendations = await this.prisma.jobPosting.findMany({
      where: {
        id: { notIn: [...appliedJobIds, ...savedJobIds] },
        status: 'active',
        applicationDeadline: { gte: new Date() },
      },
      take: 10,
      orderBy: { postedAt: 'desc' },
      include: {
        company: true,
        location: true,
      },
    });

    return recommendations;
  }

  // ============ APPLICATIONS ============

  async getApplications(userId: string, options: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = options;

    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          job: {
            include: {
              company: true,
              location: true,
            },
          },
          resume: true,
          documents: true,
          interviews: true,
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };
  }

  async getApplication(id: string) {
    return this.prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
            location: true,
          },
        },
        resume: true,
        documents: true,
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });
  }

  async createApplication(userId: string, data: any) {
    return this.prisma.application.create({
      data: {
        userId,
        jobId: data.jobId,
        resumeId: data.resumeId,
        coverLetter: data.coverLetter,
        notes: data.notes,
        status: 'submitted',
      },
    });
  }

  async updateApplication(id: string, data: any) {
    return this.prisma.application.update({
      where: { id },
      data: {
        resumeId: data.resumeId,
        coverLetter: data.coverLetter,
        notes: data.notes,
      },
    });
  }

  async withdrawApplication(id: string) {
    return this.prisma.application.update({
      where: { id },
      data: { status: 'withdrawn' },
    });
  }

  // ============ RESUMES ============

  async getResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResume(id: string) {
    return this.prisma.resume.findUnique({ where: { id } });
  }

  async deleteResume(id: string) {
    return this.prisma.resume.delete({ where: { id } });
  }

  async setDefaultResume(userId: string, resumeId: string) {
    // Remove default from all user resumes
    await this.prisma.resume.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    return this.prisma.resume.update({
      where: { id: resumeId },
      data: { isDefault: true },
    });
  }

  // ============ INTERVIEWS ============

  async getInterviews(userId: string) {
    return this.prisma.interviewSession.findMany({
      where: { application: { userId } },
      orderBy: { scheduledAt: 'asc' },
      include: {
        application: {
          include: {
            job: { include: { company: true } },
          },
        },
      },
    });
  }

  async getInterview(id: string) {
    return this.prisma.interviewSession.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: { include: { company: true, location: true } },
          },
        },
        interviewers: true,
      },
    });
  }

  async updateInterview(id: string, data: any) {
    return this.prisma.interviewSession.update({
      where: { id },
      data: {
        notes: data.notes,
        feedback: data.feedback,
      },
    });
  }

  // ============ INTERVIEW QUESTIONS ============

  async getInterviewQuestions(options: { category?: string; difficulty?: string; limit: number }) {
    const where: any = {};
    if (options.category) where.category = options.category;
    if (options.difficulty) where.difficulty = options.difficulty;

    return this.prisma.interviewQuestion.findMany({
      where,
      take: options.limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPracticeQuestions(applicationId?: string) {
    // Return questions relevant to the job/application if provided
    if (applicationId) {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true },
      });

      if (application) {
        return this.prisma.interviewQuestion.findMany({
          where: {
            OR: [
              { relatedSkills: { hasSome: application.job.skills } },
              { category: 'general' },
            ],
          },
          take: 10,
        });
      }
    }

    // Return general practice questions
    return this.prisma.interviewQuestion.findMany({
      where: { category: 'behavioral' },
      take: 10,
    });
  }

  // ============ NOTIFICATIONS ============

  async getNotifications(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items,
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };
  }

  async markNotificationRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
}
