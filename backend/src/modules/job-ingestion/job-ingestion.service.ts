import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobIngestionService {
  private readonly logger = new Logger(JobIngestionService.name);

  constructor(private prisma: PrismaService) {}

  async getJobPostings(query: { page?: number; limit?: number; search?: string; jobType?: string; remote?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: any = { isExpired: false };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.jobType) where.jobType = query.jobType;
    if (query.remote) where.remotePreference = query.remote;

    const [data, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getJobPostingById(id: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  async searchJobs(searchQuery: { query: string; filters?: any }) {
    const where: any = { isExpired: false };

    if (searchQuery.query) {
      where.OR = [
        { title: { contains: searchQuery.query, mode: 'insensitive' } },
        { company: { contains: searchQuery.query, mode: 'insensitive' } },
        { description: { contains: searchQuery.query, mode: 'insensitive' } },
      ];
    }

    if (searchQuery.filters?.jobType) where.jobType = searchQuery.filters.jobType;
    if (searchQuery.filters?.remote) where.remotePreference = searchQuery.filters.remote;
    if (searchQuery.filters?.location) {
      where.location = { contains: searchQuery.filters.location, mode: 'insensitive' };
    }

    return this.prisma.jobPosting.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobSources(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [data, total] = await Promise.all([
      this.prisma.jobSource.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobSource.count(),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createJobSource(data: any) {
    return this.prisma.jobSource.create({ data });
  }

  async createJobPosting(data: any) {
    if (data.externalId) {
      const existing = await this.prisma.jobPosting.findUnique({
        where: { externalId: data.externalId },
      });
      if (existing) {
        return this.prisma.jobPosting.update({
          where: { id: existing.id },
          data,
        });
      }
    }

    return this.prisma.jobPosting.create({ data });
  }
}
