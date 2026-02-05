import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalaryDataService {
  private readonly logger = new Logger(SalaryDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSalaryData(params: {
    jobTitle?: string;
    region?: string;
    country?: string;
    city?: string;
    experienceLevel?: string;
    isRemote?: boolean;
    currency?: string;
  }): Promise<any[]> {
    const where: any = {};

    if (params.jobTitle) {
      where.jobTitle = { contains: params.jobTitle, mode: 'insensitive' };
    }

    if (params.region) {
      where.regionCode = params.region;
    }

    if (params.country) {
      where.countryCode = params.country;
    }

    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }

    if (params.experienceLevel) {
      where.experienceLevel = params.experienceLevel;
    }

    if (params.isRemote !== undefined) {
      where.isRemote = params.isRemote;
    }

    if (params.currency) {
      where.currency = params.currency;
    }

    return this.prisma.regionalSalary.findMany({
      where,
      orderBy: [{ medianSalary: 'desc' }],
      take: 50,
    });
  }

  async getSalaryByJobTitle(
    jobTitle: string,
    region?: string,
  ): Promise<any> {
    const where: any = {
      jobTitle: { contains: jobTitle, mode: 'insensitive' },
    };

    if (region) {
      where.regionCode = region;
    }

    const salaries = await this.prisma.regionalSalary.findMany({
      where,
      orderBy: { medianSalary: 'desc' },
    });

    if (salaries.length === 0) {
      return null;
    }

    // Calculate aggregates
    const avgMin = salaries.reduce((sum, s) => sum + s.minSalary, 0) / salaries.length;
    const avgMax = salaries.reduce((sum, s) => sum + s.maxSalary, 0) / salaries.length;
    const avgMedian = salaries.reduce((sum, s) => sum + (s.medianSalary || s.minSalary), 0) / salaries.length;

    return {
      jobTitle,
      region,
      currency: salaries[0].currency,
      minSalary: Math.min(...salaries.map(s => s.minSalary)),
      maxSalary: Math.max(...salaries.map(s => s.maxSalary)),
      averageMinSalary: avgMin,
      averageMaxSalary: avgMax,
      averageMedianSalary: avgMedian,
      sampleCount: salaries.length,
      sources: [...new Set(salaries.map(s => s.source))],
      dataDate: new Date(),
    };
  }

  async getRegionalSalarySummary(): Promise<{ region: string; jobCount: number; averageMinSalary: number; averageMaxSalary: number; currency: string }[]> {
    const regions = ['NA', 'EU', 'APAC', 'LATAM', 'MEA'];
    const summary = [];

    for (const region of regions) {
      const salaries = await this.prisma.regionalSalary.findMany({
        where: { regionCode: region },
      });

      if (salaries.length > 0) {
        const avgMin = salaries.reduce((sum, s) => sum + s.minSalary, 0) / salaries.length;
        const avgMax = salaries.reduce((sum, s) => sum + s.maxSalary, 0) / salaries.length;

        summary.push({
          region,
          jobCount: salaries.length,
          averageMinSalary: avgMin,
          averageMaxSalary: avgMax,
          currency: salaries[0].currency,
        });
      }
    }

    return summary;
  }

  async initializeDefaultSalaryData(): Promise<void> {
    const defaultSalaryData = [
      // North America
      { jobTitle: 'Software Engineer', regionCode: 'NA', countryCode: 'US', currency: 'USD', minSalary: 80000, maxSalary: 180000, medianSalary: 120000, source: 'indeed', experienceLevel: 'MID', sampleSize: 5000 },
      { jobTitle: 'Senior Software Engineer', regionCode: 'NA', countryCode: 'US', currency: 'USD', minSalary: 130000, maxSalary: 250000, medianSalary: 180000, source: 'indeed', experienceLevel: 'SENIOR', sampleSize: 3000 },
      { jobTitle: 'Product Manager', regionCode: 'NA', countryCode: 'US', currency: 'USD', minSalary: 90000, maxSalary: 200000, medianSalary: 140000, source: 'glassdoor', experienceLevel: 'MID', sampleSize: 2000 },
      { jobTitle: 'Data Scientist', regionCode: 'NA', countryCode: 'US', currency: 'USD', minSalary: 85000, maxSalary: 170000, medianSalary: 120000, source: 'payscale', experienceLevel: 'MID', sampleSize: 1500 },
      { jobTitle: 'DevOps Engineer', regionCode: 'NA', countryCode: 'US', currency: 'USD', minSalary: 90000, maxSalary: 180000, medianSalary: 130000, source: 'indeed', experienceLevel: 'MID', sampleSize: 1000 },
      // Europe
      { jobTitle: 'Software Engineer', regionCode: 'EU', countryCode: 'DE', currency: 'EUR', minSalary: 50000, maxSalary: 100000, medianSalary: 70000, source: 'indeed', experienceLevel: 'MID', sampleSize: 2000 },
      { jobTitle: 'Senior Software Engineer', regionCode: 'EU', countryCode: 'DE', currency: 'EUR', minSalary: 80000, maxSalary: 140000, medianSalary: 100000, source: 'indeed', experienceLevel: 'SENIOR', sampleSize: 1000 },
      { jobTitle: 'Product Manager', regionCode: 'EU', countryCode: 'UK', currency: 'GBP', minSalary: 50000, maxSalary: 100000, medianSalary: 70000, source: 'glassdoor', experienceLevel: 'MID', sampleSize: 1000 },
      { jobTitle: 'Software Engineer', regionCode: 'EU', countryCode: 'FR', currency: 'EUR', minSalary: 45000, maxSalary: 90000, medianSalary: 60000, source: 'indeed', experienceLevel: 'MID', sampleSize: 1500 },
      // APAC
      { jobTitle: 'Software Engineer', regionCode: 'APAC', countryCode: 'JP', currency: 'JPY', minSalary: 5000000, maxSalary: 12000000, medianSalary: 8000000, source: 'indeed', experienceLevel: 'MID', sampleSize: 2000 },
      { jobTitle: 'Software Engineer', regionCode: 'APAC', countryCode: 'AU', currency: 'AUD', minSalary: 70000, maxSalary: 140000, medianSalary: 100000, source: 'indeed', experienceLevel: 'MID', sampleSize: 1000 },
      { jobTitle: 'Software Engineer', regionCode: 'APAC', countryCode: 'IN', currency: 'INR', minSalary: 500000, maxSalary: 2000000, medianSalary: 1000000, source: 'naukri', experienceLevel: 'MID', sampleSize: 3000 },
      // LATAM
      { jobTitle: 'Software Engineer', regionCode: 'LATAM', countryCode: 'BR', currency: 'BRL', minSalary: 60000, maxSalary: 180000, medianSalary: 100000, source: 'indeed', experienceLevel: 'MID', sampleSize: 1000 },
      { jobTitle: 'Software Engineer', regionCode: 'LATAM', countryCode: 'MX', currency: 'MXN', minSalary: 300000, maxSalary: 900000, medianSalary: 500000, source: 'indeed', experienceLevel: 'MID', sampleSize: 500 },
      // MEA
      { jobTitle: 'Software Engineer', regionCode: 'MEA', countryCode: 'AE', currency: 'AED', minSalary: 180000, maxSalary: 400000, medianSalary: 280000, source: 'bayt', experienceLevel: 'MID', sampleSize: 500 },
      { jobTitle: 'Software Engineer', regionCode: 'MEA', countryCode: 'IL', currency: 'ILS', minSalary: 180000, maxSalary: 400000, medianSalary: 280000, source: 'linkedin', experienceLevel: 'MID', sampleSize: 500 },
    ];

    for (const salary of defaultSalaryData) {
      await this.prisma.regionalSalary.create({
        data: {
          ...salary,
          dataDate: new Date(),
          isRemote: false,
          skills: ['Programming', 'Problem Solving'],
        },
      });
    }
  }
}
