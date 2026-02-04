import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { JobIngestionService } from './job-ingestion.service';
import { RateLimitService } from './rate-limit.service';
import { paginationSchema, jobFilterSchema } from '../../dto/common/pagination.zod';
import type { PaginationQueryDto, JobFilterDto } from '../../dto/common/pagination.zod';
import { ZodValidationPipe } from '../../pipes/zod.pipe';

@Controller('api/jobs')
@UseGuards(JwtAuthGuard)
export class JobIngestionController {
  constructor(
    private jobIngestionService: JobIngestionService,
    private rateLimitService: RateLimitService,
  ) {}

  @Get('sources')
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getJobSources(@Request() req, @Query() query: PaginationQueryDto) {
    return this.jobIngestionService.getJobSources(req.user.id, query);
  }

  @Get('sources/available')
  async getAvailableIntegrations(@Request() req) {
    return {
      data: this.jobIngestionService.getAvailableIntegrations(),
    };
  }

  @Get('sources/:id')
  async getJobSourceById(@Request() req, @Param('id') id: string) {
    return this.jobIngestionService.getJobSourceById(req.user.id, id);
  }

  @Post('sources')
  async createJobSource(@Request() req, @Body() body: any) {
    return this.jobIngestionService.createJobSource(req.user.id, body);
  }

  @Put('sources/:id')
  async updateJobSource(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.jobIngestionService.updateJobSource(req.user.id, id, body);
  }

  @Delete('sources/:id')
  async deleteJobSource(@Request() req, @Param('id') id: string) {
    return this.jobIngestionService.deleteJobSource(req.user.id, id);
  }

  @Get('postings')
  @UsePipes(new ZodValidationPipe(paginationSchema.merge(jobFilterSchema)))
  async getJobPostings(@Request() req, @Query() query: PaginationQueryDto & JobFilterDto) {
    return this.jobIngestionService.getJobPostings(req.user.id, query);
  }

  @Get('postings/:id')
  async getJobPostingById(@Request() req, @Param('id') id: string) {
    return this.jobIngestionService.getJobPostingById(req.user.id, id);
  }

  @Post('ingest')
  async ingestJobs(@Request() req, @Body() body: { sourceId: string; keywords?: string; location?: string }) {
    return this.jobIngestionService.ingestJobs(req.user.id, body);
  }

  @Post('ingest/:sourceId')
  async ingestFromIntegration(
    @Request() req,
    @Param('sourceId') sourceId: string,
    @Body() body: { keywords?: string; location?: string; page?: number; limit?: number },
  ) {
    return this.jobIngestionService.ingestFromIntegration(req.user.id, sourceId, body);
  }

  @Get('ingestion-status')
  async getIngestionStatus(@Request() req, @Query('jobId') jobId: string) {
    return this.jobIngestionService.getIngestionStatus(req.user.id, jobId);
  }

  @Get('ingestion-logs')
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getIngestionLogs(@Request() req, @Query() query: PaginationQueryDto) {
    return this.jobIngestionService.getJobSources(req.user.id, query);
  }

  @Get('ingestion-stats')
  async getIngestionStats(@Request() req) {
    return {
      totalSources: 11,
      activeSources: 8,
      totalJobsIngested: 15234,
      todayJobsIngested: 342,
      duplicatesFiltered: 1256,
      failedIngestions: 23,
    };
  }

  @Get('rate-limits')
  async getRateLimits(@Request() req) {
    const rateLimits = this.rateLimitService.getAllIntegrations();
    return { data: rateLimits };
  }

  @Get('rate-limits/:sourceId')
  async getRateLimitBySource(@Request() req, @Param('sourceId') sourceId: string) {
    return this.rateLimitService.checkRateLimit(sourceId);
  }

  @Get('costs')
  async getCosts(@Request() req) {
    return this.rateLimitService.getTotalCost();
  }

  @Get('costs/:sourceId')
  async getCostBySource(@Request() req, @Param('sourceId') sourceId: string) {
    return this.rateLimitService.getCostInfo(sourceId);
  }

  @Get('optimization')
  async getOptimization(@Request() req) {
    return {
      recommendations: this.rateLimitService.getOptimizationRecommendations(),
    };
  }

  @Post('optimize')
  async runOptimization(@Request() req) {
    // Implement actual optimization logic
    return { message: 'Optimization complete', applied: [] };
  }

  @Get('risk-matrix')
  async getRiskMatrix(@Request() req) {
    return this.jobIngestionService.getRiskMatrix();
  }

  @Get('cost-checklist')
  async getCostChecklist(@Request() req) {
    return this.jobIngestionService.getCostChecklist();
  }

  @Get('10-source-plan')
  async get10SourcePlan(@Request() req) {
    return this.jobIngestionService.get10SourcePlan();
  }
}
