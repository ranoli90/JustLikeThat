import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { RegionalJobService } from '../services/regional-job.service';
import { JobSourceService } from '../services/job-source.service';
import { SalaryDataService } from '../services/salary-data.service';

@Controller('api/v1/regional')
export class RegionalController {
  constructor(
    private readonly regionalJobService: RegionalJobService,
    private readonly jobSourceService: JobSourceService,
    private readonly salaryDataService: SalaryDataService,
  ) {}

  @Get('regions')
  async getRegions() {
    return this.regionalJobService.getRegions();
  }

  @Get('jobs')
  async searchJobs(
    @Query('region') region?: string,
    @Query('keywords') keywords?: string,
    @Query('location') location?: string,
    @Query('jobType') jobType?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('salaryMin') salaryMin?: string,
    @Query('salaryMax') salaryMax?: string,
    @Query('currency') currency?: string,
    @Query('isRemote') isRemote?: string,
    @Query('timezone') timezone?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.regionalJobService.searchJobs({
      region,
      keywords,
      location,
      jobType,
      experienceLevel,
      salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
      salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
      currency,
      isRemote: isRemote === 'true',
      timezone,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return this.regionalJobService.getJobById(id);
  }

  @Get('jobs/region/:region')
  async getJobsByRegion(@Param('region') region: string) {
    return this.regionalJobService.getJobsByRegion(region);
  }

  @Get('job-sources')
  async getAllJobSources() {
    return this.jobSourceService.getAllSources();
  }

  @Get('job-sources/:region')
  async getJobSourcesByRegion(@Param('region') region: string) {
    return this.jobSourceService.getSourcesByRegion(region);
  }

  @Post('job-sources/:id/sync')
  async syncJobSource(@Param('id') id: string) {
    return this.jobSourceService.syncSource(id);
  }

  @Get('salary-data')
  async getSalaryData(
    @Query('jobTitle') jobTitle?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('isRemote') isRemote?: string,
  ) {
    return this.salaryDataService.getSalaryData({
      jobTitle,
      region,
      country,
      experienceLevel,
      isRemote: isRemote === 'true' ? true : isRemote === 'false' ? false : undefined,
    });
  }

  @Get('salary-data/summary')
  async getSalarySummary() {
    return this.salaryDataService.getRegionalSalarySummary();
  }

  @Get('salary-data/by-title')
  async getSalaryByJobTitle(
    @Query('jobTitle') jobTitle: string,
    @Query('region') region?: string,
  ) {
    return this.salaryDataService.getSalaryByJobTitle(jobTitle, region);
  }

  @Get('salary-summary/:region')
  async getRegionSalarySummary(@Param('region') region: string) {
    return this.regionalJobService.getSalarySummaryByRegion(region);
  }

  @Post('initialize')
  async initializeDefaultData() {
    await this.regionalJobService.initializeDefaultRegions();
    await this.jobSourceService.initializeDefaultSources();
    await this.salaryDataService.initializeDefaultSalaryData();
    return { success: true, message: 'Default regional data initialized' };
  }
}
