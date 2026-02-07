import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.applicationService.create(req.user.id, body);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('state') state?: string,
  ) {
    return this.applicationService.findAll(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      state,
    });
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.applicationService.getStats(req.user.id);
  }

  @Get(':id')
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.applicationService.findById(req.user.id, id);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.applicationService.update(req.user.id, id, body);
  }

  @Post(':id/submit')
  async submit(@Request() req: any, @Param('id') id: string) {
    return this.applicationService.submitApplication(req.user.id, id);
  }

  @Post(':id/withdraw')
  async withdraw(@Request() req: any, @Param('id') id: string) {
    return this.applicationService.withdrawApplication(req.user.id, id);
  }

  @Post(':id/transition')
  async transition(
    @Request() req: any,
    @Param('id') id: string,
    @Body('state') state: any,
  ) {
    return this.applicationService.transitionState(req.user.id, id, state);
  }
}
