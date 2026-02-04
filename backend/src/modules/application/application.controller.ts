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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApplicationService } from './application.service';
import type { CreateApplicationDto, UpdateApplicationDto } from '../../dto/application/create-application.zod';
import { ApplicationState, AutonomyMode } from '../../entities/application.entity';

@Controller('api/applications')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getApplications(@Request() req, @Query() query: any) {
    return this.applicationService.getApplications(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getApplicationById(@Request() req, @Param('id') id: string) {
    return this.applicationService.getApplicationById(req.user.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createApplication(@Request() req, @Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationService.createApplication(req.user.id, createApplicationDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateApplication(@Request() req, @Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationService.updateApplication(req.user.id, id, updateApplicationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteApplication(@Request() req, @Param('id') id: string) {
    return this.applicationService.deleteApplication(req.user.id, id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submitApplication(@Request() req, @Param('id') id: string) {
    return this.applicationService.submitApplication(req.user.id, id);
  }

  @Post(':id/transition')
  @UseGuards(JwtAuthGuard)
  async transitionState(@Request() req, @Param('id') id: string, @Body() body: { state: ApplicationState }) {
    return this.applicationService.transitionState(req.user.id, id, body.state);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard)
  async pauseApplication(@Request() req, @Param('id') id: string) {
    return this.applicationService.pauseApplication(req.user.id, id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelApplication(@Request() req, @Param('id') id: string) {
    return this.applicationService.cancelApplication(req.user.id, id);
  }

  @Put(':id/autonomy')
  @UseGuards(JwtAuthGuard)
  async setAutonomyMode(@Request() req, @Param('id') id: string, @Body() body: { autonomyMode: AutonomyMode }) {
    return this.applicationService.setAutonomyMode(req.user.id, id, body.autonomyMode);
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  async getApplicationStats(@Request() req) {
    return this.applicationService.getApplicationStats(req.user.id);
  }
}
