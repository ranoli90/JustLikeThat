import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobSourceService {
  private readonly logger = new Logger(JobSourceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSourcesByRegion(regionCode: string): Promise<any[]> {
    return this.prisma.jobSource.findMany({
      where: { regionCode, isActive: true },
    });
  }

  async getAllSources(): Promise<any[]> {
    return this.prisma.jobSource.findMany({
      where: { isActive: true },
      orderBy: { regionCode: 'asc' },
    });
  }

  async getSourceById(id: string): Promise<any> {
    return this.prisma.jobSource.findUnique({
      where: { id },
    });
  }

  async createSource(data: {
    regionCode: string;
    name: string;
    type: string;
    baseUrl?: string;
    apiEndpoint?: string;
    apiKey?: string;
    apiConfig?: any;
  }): Promise<any> {
    return this.prisma.jobSource.create({
      data: {
        ...data,
        type: data.type as any,
        syncStatus: 'IDLE',
      },
    });
  }

  async updateSource(id: string, data: Partial<{
    name: string;
    type: string;
    baseUrl: string;
    apiEndpoint: string;
    apiKey: string;
    apiConfig: any;
    isActive: boolean;
  }>): Promise<any> {
    return this.prisma.jobSource.update({
      where: { id },
      data,
    });
  }

  async deleteSource(id: string): Promise<void> {
    await this.prisma.jobSource.delete({
      where: { id },
    });
  }

  async syncSource(id: string): Promise<any> {
    const source = await this.getSourceById(id);
    if (!source) {
      throw new Error(`Job source ${id} not found`);
    }

    await this.prisma.jobSource.update({
      where: { id },
      data: { syncStatus: 'SYNCING' },
    });

    try {
      // Simulate fetching jobs from source
      // In production, this would call the actual API
      const jobCount = Math.floor(Math.random() * 100);

      await this.prisma.jobSource.update({
        where: { id },
        data: {
          syncStatus: 'SUCCESS',
          lastSyncAt: new Date(),
          lastJobCount: jobCount,
          totalJobs: { increment: jobCount },
        },
      });

      return { synced: jobCount };
    } catch (error) {
      await this.prisma.jobSource.update({
        where: { id },
        data: { syncStatus: 'FAILED' },
      });
      throw error;
    }
  }

  async initializeDefaultSources(): Promise<void> {
    const defaultSources = [
      // North America
      { regionCode: 'NA', name: 'Indeed', type: 'API', baseUrl: 'https://api.indeed.com' },
      { regionCode: 'NA', name: 'LinkedIn', type: 'API', baseUrl: 'https://api.linkedin.com' },
      { regionCode: 'NA', name: 'Glassdoor', type: 'API', baseUrl: 'https://api.glassdoor.com' },
      { regionCode: 'NA', name: 'Monster', type: 'API', baseUrl: 'https://api.monster.com' },
      { regionCode: 'NA', name: 'CareerBuilder', type: 'API', baseUrl: 'https://api.careerbuilder.com' },
      // Europe
      { regionCode: 'EU', name: 'Indeed UK', type: 'API', baseUrl: 'https://api.indeed.co.uk' },
      { regionCode: 'EU', name: 'LinkedIn EU', type: 'API', baseUrl: 'https://api.linkedin.com/eu' },
      { regionCode: 'EU', name: 'Glassdoor EU', type: 'API', baseUrl: 'https://api.glassdoor.eu' },
      { regionCode: 'EU', name: 'Jobbe', type: 'API', baseUrl: 'https://api.jobbe.eu' },
      { regionCode: 'EU', name: 'StepStone', type: 'API', baseUrl: 'https://api.stepstone.com' },
      // APAC
      { regionCode: 'APAC', name: 'LinkedIn APAC', type: 'API', baseUrl: 'https://api.linkedin.com/apac' },
      { regionCode: 'APAC', name: 'Indeed APAC', type: 'API', baseUrl: 'https://api.indeed.com/apac' },
      { regionCode: 'APAC', name: 'Glassdoor APAC', type: 'API', baseUrl: 'https://api.glassdoor.com/apac' },
      { regionCode: 'APAC', name: 'JobStreet', type: 'API', baseUrl: 'https://api.jobstreet.com' },
      { regionCode: 'APAC', name: 'CareerOne', type: 'API', baseUrl: 'https://api.careerone.com.au' },
      // LATAM
      { regionCode: 'LATAM', name: 'Indeed LATAM', type: 'API', baseUrl: 'https://api.indeed.com/latam' },
      { regionCode: 'LATAM', name: 'LinkedIn LATAM', type: 'API', baseUrl: 'https://api.linkedin.com/latam' },
      { regionCode: 'LATAM', name: 'Bumeran', type: 'API', baseUrl: 'https://api.bumeran.com' },
      { regionCode: 'LATAM', name: 'CompuTrabajo', type: 'API', baseUrl: 'https://api.computrabajo.com' },
      // MEA
      { regionCode: 'MEA', name: 'LinkedIn MEA', type: 'API', baseUrl: 'https://api.linkedin.com/mea' },
      { regionCode: 'MEA', name: 'Bayt', type: 'API', baseUrl: 'https://api.bayt.com' },
      { regionCode: 'MEA', name: 'Naukri Gulf', type: 'API', baseUrl: 'https://api.naukrigulf.com' },
      { regionCode: 'MEA', name: 'Jobberman', type: 'API', baseUrl: 'https://api.jobberman.com' },
    ];

    for (const source of defaultSources) {
      await this.prisma.jobSource.upsert({
        where: {
          id: source.id, // This would need a unique identifier
        },
        update: source,
        create: {
          ...source,
          id: `${source.regionCode}-${source.name.toLowerCase().replace(/\s+/g, '-')}`,
          syncStatus: 'IDLE',
          totalJobs: 0,
          lastJobCount: 0,
        },
      });
    }
  }
}
