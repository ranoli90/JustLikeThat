import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JobIngestionService } from './job-ingestion.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobIngestionController {
  constructor(private readonly jobIngestionService: JobIngestionService) {}

  @Get()
  async getJobPostings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('jobType') jobType?: string,
    @Query('remote') remote?: string,
  ) {
    return this.jobIngestionService.getJobPostings({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      jobType,
      remote,
    });
  }

  @Get(':id')
  async getJobPostingById(@Param('id') id: string) {
    return this.jobIngestionService.getJobPostingById(id);
  }

  @Post('search')
  async searchJobs(@Body() body: any) {
    return this.jobIngestionService.searchJobs(body);
  }

  @Get('sources/list')
  async getJobSources(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobIngestionService.getJobSources({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
