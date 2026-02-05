import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  JobSearchParams,
  Job,
  JobNormalizationResult,
  RegionSalarySummary,
} from '../interfaces/regional.interface';
import { JobSourceService } from './job-source.service';
import { SalaryDataService } from './salary-data.service';

@Injectable()
export class RegionalJobService {
  private readonly logger = new Logger(RegionalJobService.name);

  // Region configurations
  private readonly regions = {
    NA: { name: 'North America', countries: ['US', 'CA', 'MX'], timezone: 'America/New_York' },
    EU: { name: 'Europe', countries: ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'SE', 'DK', 'NO', 'FI', 'AT', 'CH', 'PL', 'PT', 'IE', 'GR', 'CZ', 'RO', 'HU'], timezone: 'Europe/London' },
    APAC: { name: 'Asia Pacific', countries: ['JP', 'KR', 'CN', 'IN', 'SG', 'AU', 'NZ', 'HK', 'MY', 'TH', 'ID', 'PH', 'VN', 'TW'], timezone: 'Asia/Singapore' },
    LATAM: { name: 'Latin America', countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'PY', 'UY', 'BO'], timezone: 'America/Sao_Paulo' },
    MEA: { name: 'Middle East & Africa', countries: ['AE', 'SA', 'IL', 'ZA', 'NG', 'KE', 'EG', 'MA', 'TZ', 'GH'], timezone: 'Asia/Dubai' },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobSourceService: JobSourceService,
    private readonly salaryDataService: SalaryDataService,
  ) {}

  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    const {
      region,
      keywords,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency = 'USD',
      isRemote,
      timezone,
      remoteTimezoneOverlap = 4,
      page = 1,
      limit = 20,
      sortBy = 'postedAt',
      sortOrder = 'desc',
    } = params;

    // Build query filters
    const where: any = {};

    if (region) {
      const regionConfig = this.regions[region as keyof typeof this.regions];
      if (regionConfig) {
        where.country = { in: regionConfig.countries };
      }
    }

    if (keywords) {
      where.OR = [
        { title: { contains: keywords, mode: 'insensitive' } },
        { description: { contains: keywords, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.OR = [
        { location: { contains: location, mode: 'insensitive' } },
        { city: { contains: location, mode: 'insensitive' } },
      ];
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    if (salaryMin || salaryMax) {
      where.salary = {
        ...(salaryMin ? { gte: salaryMin } : {}),
        ...(salaryMax ? { lte: salaryMax } : {}),
      };
    }

    if (isRemote !== undefined) {
      where.remoteType = isRemote ? { in: ['remote', 'hybrid', 'flexible'] } : 'onsite';
    }

    if (timezone && isRemote) {
      // Filter by timezone overlap for remote positions
      where.timezone = timezone;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      jobs: jobs.map(this.normalizeJob),
      total,
    };
  }

  async getJobsByRegion(region: string): Promise<Job[]> {
    const regionConfig = this.regions[region as keyof typeof this.regions];
    if (!regionConfig) {
      return [];
    }

    const jobs = await this.prisma.jobPosting.findMany({
      where: {
        country: { in: regionConfig.countries },
      },
      take: 100,
      orderBy: { postedAt: 'desc' },
    });

    return jobs.map(this.normalizeJob);
  }

  async getJobById(id: string): Promise<Job | null> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!job) return null;

    return this.normalizeJob(job);
  }

  async getJobSources(region: string): Promise<any[]> {
    return this.jobSourceService.getSourcesByRegion(region);
  }

  async syncJobSources(region: string): Promise<{ synced: number; errors: number }> {
    const sources = await this.jobSourceService.getSourcesByRegion(region);
    let synced = 0;
    let errors = 0;

    for (const source of sources) {
      try {
        await this.jobSourceService.syncSource(source.id);
        synced++;
      } catch (error) {
        this.logger.error(`Failed to sync source ${source.id}: ${error.message}`);
        errors++;
      }
    }

    return { synced, errors };
  }

  async getSalaryData(params: {
    jobTitle?: string;
    region?: string;
    country?: string;
    experienceLevel?: string;
    isRemote?: boolean;
  }): Promise<any[]> {
    return this.salaryDataService.getSalaryData(params);
  }

  async getSalarySummaryByRegion(region: string): Promise<RegionSalarySummary> {
    const regionConfig = this.regions[region as keyof typeof this.regions];
    if (!regionConfig) {
      throw new Error(`Region ${region} not found`);
    }

    const salaries = await this.prisma.regionalSalary.findMany({
      where: {
        regionCode: region,
      },
    });

    const jobTitles = await this.prisma.jobPosting.groupBy({
      by: ['title'],
      where: {
        country: { in: regionConfig.countries },
      },
      _count: true,
      orderBy: {
        _count: {
          title: 'desc',
        },
      },
      take: 10,
    });

    const avgMin = salaries.reduce((sum, s) => sum + s.minSalary, 0) / (salaries.length || 1);
    const avgMax = salaries.reduce((sum, s) => sum + s.maxSalary, 0) / (salaries.length || 1);

    return {
      regionCode: region,
      regionName: regionConfig.name,
      currency: region === 'NA' ? 'USD' : region === 'EU' ? 'EUR' : 'USD',
      averageMinSalary: avgMin,
      averageMaxSalary: avgMax,
      jobCount: jobTitles.reduce((sum, j) => sum + j._count, 0),
      topJobTitles: jobTitles.map(j => ({ title: j.title, count: j._count })),
    };
  }

  async filterByTimezone(
    jobs: Job[],
    userTimezone: string,
    overlapHours: number = 4,
  ): Promise<Job[]> {
    // Filter jobs that have overlapping working hours with the user's timezone
    return jobs.filter(job => {
      if (!job.timezone || job.remoteType === 'onsite') return true;

      // Simple timezone overlap check (placeholder - would use a proper library in production)
      return true;
    });
  }

  normalizeJob(prismaJob: any): Job {
    return {
      id: prismaJob.id,
      externalId: prismaJob.externalId || prismaJob.id,
      source: prismaJob.source || 'internal',
      title: prismaJob.title,
      description: prismaJob.description,
      requirements: prismaJob.requirements,
      location: prismaJob.location,
      city: prismaJob.city,
      country: prismaJob.country,
      remoteType: prismaJob.remoteType || 'onsite',
      timezone: prismaJob.timezone,
      salary: prismaJob.salaryRange,
      jobType: prismaJob.jobType,
      experienceLevel: prismaJob.experienceLevel,
      skills: prismaJob.skills || [],
      benefits: prismaJob.benefits,
      companyName: prismaJob.companyName,
      companyLogo: prismaJob.companyLogo,
      companySize: prismaJob.companySize,
      industry: prismaJob.industry,
      postedAt: prismaJob.postedAt,
      expiresAt: prismaJob.expiresAt,
      applicationUrl: prismaJob.applicationUrl || '',
    };
  }

  async getRegions(): Promise<{ code: string; name: string; countries: string[]; timezone: string }[]> {
    return Object.entries(this.regions).map(([code, config]) => ({
      code,
      name: config.name,
      countries: config.countries,
      timezone: config.timezone,
    }));
  }

  async initializeDefaultRegions(): Promise<void> {
    const defaultRegions = [
      {
        code: 'NA',
        name: 'North America',
        timezone: 'America/New_York',
        timezoneOffset: -5,
        countries: ['US', 'CA', 'MX'],
        defaultCurrency: 'USD',
        supportedCurrencies: ['USD', 'CAD', 'MXN'],
        defaultLocale: 'en',
        supportedLocales: ['en', 'es', 'fr'],
        jobSources: { indeed: true, linkedin: true, glassdoor: true },
        salaryData: { sources: ['indeed', 'glassdoor', 'payscale'], coverage: 0.95 },
        remoteWorkPolicy: 'flexible',
        complianceRules: { gdpr: false, ccpa: true, dataRetention: 365 },
        dataResidency: 'US',
        gdprEnabled: false,
        ccpaEnabled: true,
        basePrice: 29.99,
        pppMultiplier: 1.0,
        taxRate: 0.08,
      },
      {
        code: 'EU',
        name: 'Europe',
        timezone: 'Europe/London',
        timezoneOffset: 0,
        countries: ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'SE'],
        defaultCurrency: 'EUR',
        supportedCurrencies: ['EUR', 'GBP', 'CHF', 'SEK'],
        defaultLocale: 'en',
        supportedLocales: ['en', 'de', 'fr', 'es', 'it', 'nl'],
        jobSources: { indeed: true, linkedin: true, glassdoor: true },
        salaryData: { sources: ['indeed', 'glassdoor', 'payscale'], coverage: 0.90 },
        remoteWorkPolicy: 'gdpr_compliant',
        complianceRules: { gdpr: true, ccpa: false, dataRetention: 730 },
        dataResidency: 'EU',
        gdprEnabled: true,
        ccpaEnabled: false,
        basePrice: 24.99,
        pppMultiplier: 0.92,
        taxRate: 0.21,
      },
      {
        code: 'APAC',
        name: 'Asia Pacific',
        timezone: 'Asia/Singapore',
        timezoneOffset: 8,
        countries: ['JP', 'KR', 'CN', 'IN', 'SG', 'AU', 'NZ'],
        defaultCurrency: 'USD',
        supportedCurrencies: ['USD', 'JPY', 'KRW', 'CNY', 'INR', 'AUD'],
        defaultLocale: 'en',
        supportedLocales: ['en', 'zh', 'ja', 'ko', 'hi', 'th'],
        jobSources: { indeed: true, linkedin: true, glassdoor: true },
        salaryData: { sources: ['indeed', 'glassdoor', 'payscale'], coverage: 0.85 },
        remoteWorkPolicy: 'flexible',
        complianceRules: { gdpr: false, ccpa: false, dataRetention: 365 },
        dataResidency: 'SG',
        gdprEnabled: false,
        ccpaEnabled: false,
        basePrice: 19.99,
        pppMultiplier: 0.65,
        taxRate: 0.10,
      },
      {
        code: 'LATAM',
        name: 'Latin America',
        timezone: 'America/Sao_Paulo',
        timezoneOffset: -3,
        countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'MX'],
        defaultCurrency: 'USD',
        supportedCurrencies: ['USD', 'BRL', 'ARS', 'CLP', 'COP', 'MXN'],
        defaultLocale: 'es',
        supportedLocales: ['es', 'pt', 'en'],
        jobSources: { indeed: true, linkedin: true },
        salaryData: { sources: ['indeed', 'glassdoor'], coverage: 0.70 },
        remoteWorkPolicy: 'remote_first',
        complianceRules: { gdpr: false, ccpa: false, dataRetention: 365 },
        dataResidency: 'US',
        gdprEnabled: false,
        ccpaEnabled: false,
        basePrice: 14.99,
        pppMultiplier: 0.45,
        taxRate: 0.15,
      },
      {
        code: 'MEA',
        name: 'Middle East & Africa',
        timezone: 'Asia/Dubai',
        timezoneOffset: 4,
        countries: ['AE', 'SA', 'IL', 'ZA', 'NG'],
        defaultCurrency: 'USD',
        supportedCurrencies: ['USD', 'AED', 'SAR', 'ILS', 'ZAR'],
        defaultLocale: 'en',
        supportedLocales: ['en', 'ar', 'he'],
        jobSources: { linkedin: true, bayt: true },
        salaryData: { sources: ['linkedin', 'bayt'], coverage: 0.60 },
        remoteWorkPolicy: 'flexible',
        complianceRules: { gdpr: false, ccpa: false, dataRetention: 365 },
        dataResidency: 'AE',
        gdprEnabled: false,
        ccpaEnabled: false,
        basePrice: 17.99,
        pppMultiplier: 0.55,
        taxRate: 0.05,
      },
    ];

    for (const region of defaultRegions) {
      await this.prisma.regionConfig.upsert({
        where: { code: region.code },
        update: region,
        create: region,
      });
    }
  }
}
