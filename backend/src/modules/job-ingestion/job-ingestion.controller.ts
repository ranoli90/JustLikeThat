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
import { paginationSchema, jobFilterSchema } from '../../dto/common/pagination.zod';
import type { PaginationQueryDto, JobFilterDto } from '../../dto/common/pagination.zod';
import { ZodValidationPipe } from '../../pipes/zod.pipe';

@Controller('api/jobs')
export class JobIngestionController {
  constructor(private jobIngestionService: JobIngestionService) {}

  @Get('sources')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getJobSources(@Request() req, @Query() query: PaginationQueryDto) {
    return this.jobIngestionService.getJobSources(req.user.id, query);
  }

  @Get('sources/:id')
  @UseGuards(JwtAuthGuard)
  async getJobSourceById(@Request() req, @Param('id') id: string) {
    return this.jobIngestionService.getJobSourceById(req.user.id, id);
  }

  @Post('sources')
  @UseGuards(JwtAuthGuard)
  async createJobSource(@Request() req, @Body() body: any) {
    return this.jobIngestionService.createJobSource(req.user.id, body);
  }

  @Put('sources/:id')
  @UseGuards(JwtAuthGuard)
  async updateJobSource(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.jobIngestionService.updateJobSource(req.user.id, id, body);
  }

  @Delete('sources/:id')
  @UseGuards(JwtAuthGuard)
  async deleteJobSource(@Request() req, @Param('id') id: string) {
    return this.jobIngestionService.deleteJobSource(req.user.id, id);
  }

  @Get('postings')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(paginationSchema.merge(jobFilterSchema)))
  async getJobPostings(@Request() req, @Query() query: PaginationQueryDto & JobFilterDto) {
    return this.jobIngestionService.getJobPostings(req.user.id, query);
  }

  @Get('postings/:id')
  @UseGuards(JwtAuthGuard)
  async getJobPostingById(@Request() req, @Param('id') id: string) {
    return this.jobIngestionService.getJobPostingById(req.user.id, id);
  }

  @Post('ingest')
  @UseGuards(JwtAuthGuard)
  async ingestJobs(@Request() req, @Body() body: { sourceId: string; keywords?: string; location?: string }) {
    return this.jobIngestionService.ingestJobs(req.user.id, body);
  }

  @Get('ingestion-status')
  @UseGuards(JwtAuthGuard)
  async getIngestionStatus(@Request() req, @Query('jobId') jobId: string) {
    return this.jobIngestionService.getIngestionStatus(req.user.id, jobId);
  }

  @Get('risk-matrix')
  @UseGuards(JwtAuthGuard)
  async getRiskMatrix(@Request() req) {
    return this.jobIngestionService.getRiskMatrix();
  }

  @Get('cost-checklist')
  @UseGuards(JwtAuthGuard)
  async getCostChecklist(@Request() req) {
    return this.jobIngestionService.getCostChecklist();
  }

  @Get('10-source-plan')
  @UseGuards(JwtAuthGuard)
  async get10SourcePlan(@Request() req) {
    return this.jobIngestionService.get10SourcePlan();
  }
}
