/**
 * Mobile Controller - Main mobile API controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MobileService } from './mobile.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('api/v1/mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  // ============ JOBS ============

  @Get('jobs/search')
  @UseGuards(JwtAuthGuard)
  async searchJobs(
    @Request() req,
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('jobTypes') jobTypes?: string,
    @Query('remoteTypes') remoteTypes?: string,
    @Query('salaryMin') salaryMin?: string,
    @Query('salaryMax') salaryMax?: string,
  ) {
    return this.mobileService.searchJobs(req.user.id, {
      query,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      jobTypes: jobTypes?.split(',') || [],
      remoteTypes: remoteTypes?.split(',') || [],
      salaryMin: salaryMin ? parseFloat(salaryMin) : null,
      salaryMax: salaryMax ? parseFloat(salaryMax) : null,
    });
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  async getJob(@Param('id') id: string) {
    return this.mobileService.getJob(id);
  }

  @Post('jobs/:id/save')
  @UseGuards(JwtAuthGuard)
  async saveJob(@Request() req, @Param('id') id: string) {
    return this.mobileService.saveJob(req.user.id, id);
  }

  @Delete('jobs/:id/save')
  @UseGuards(JwtAuthGuard)
  async unsaveJob(@Request() req, @Param('id') id: string) {
    return this.mobileService.unsaveJob(req.user.id, id);
  }

  @Get('jobs/saved')
  @UseGuards(JwtAuthGuard)
  async getSavedJobs(@Request() req) {
    return this.mobileService.getSavedJobs(req.user.id);
  }

  @Get('jobs/recommendations')
  @UseGuards(JwtAuthGuard)
  async getJobRecommendations(@Request() req) {
    return this.mobileService.getJobRecommendations(req.user.id);
  }

  // ============ APPLICATIONS ============

  @Get('applications')
  @UseGuards(JwtAuthGuard)
  async getApplications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.mobileService.getApplications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    });
  }

  @Get('applications/:id')
  @UseGuards(JwtAuthGuard)
  async getApplication(@Param('id') id: string) {
    return this.mobileService.getApplication(id);
  }

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  async createApplication(@Request() req, @Body() body: any) {
    return this.mobileService.createApplication(req.user.id, body);
  }

  @Put('applications/:id')
  @UseGuards(JwtAuthGuard)
  async updateApplication(@Param('id') id: string, @Body() body: any) {
    return this.mobileService.updateApplication(id, body);
  }

  @Post('applications/:id/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdrawApplication(@Param('id') id: string) {
    return this.mobileService.withdrawApplication(id);
  }

  // ============ RESUMES ============

  @Get('resumes')
  @UseGuards(JwtAuthGuard)
  async getResumes(@Request() req) {
    return this.mobileService.getResumes(req.user.id);
  }

  @Get('resumes/:id')
  @UseGuards(JwtAuthGuard)
  async getResume(@Param('id') id: string) {
    return this.mobileService.getResume(id);
  }

  @Delete('resumes/:id')
  @UseGuards(JwtAuthGuard)
  async deleteResume(@Param('id') id: string) {
    return this.mobileService.deleteResume(id);
  }

  @Put('resumes/:id/default')
  @UseGuards(JwtAuthGuard)
  async setDefaultResume(@Request() req, @Param('id') id: string) {
    return this.mobileService.setDefaultResume(req.user.id, id);
  }

  // ============ INTERVIEWS ============

  @Get('interviews')
  @UseGuards(JwtAuthGuard)
  async getInterviews(@Request() req) {
    return this.mobileService.getInterviews(req.user.id);
  }

  @Get('interviews/:id')
  @UseGuards(JwtAuthGuard)
  async getInterview(@Param('id') id: string) {
    return this.mobileService.getInterview(id);
  }

  @Put('interviews/:id')
  @UseGuards(JwtAuthGuard)
  async updateInterview(@Param('id') id: string, @Body() body: any) {
    return this.mobileService.updateInterview(id, body);
  }

  // ============ INTERVIEW QUESTIONS ============

  @Get('interview-questions')
  @UseGuards(JwtAuthGuard)
  async getInterviewQuestions(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mobileService.getInterviewQuestions({
      category,
      difficulty,
      limit: parseInt(limit) || 50,
    });
  }

  @Get('interview-questions/practice')
  @UseGuards(JwtAuthGuard)
  async getPracticeQuestions(@Query('applicationId') applicationId?: string) {
    return this.mobileService.getPracticeQuestions(applicationId);
  }

  // ============ NOTIFICATIONS ============

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mobileService.getNotifications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  }

  @Put('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markNotificationRead(@Param('id') id: string) {
    return this.mobileService.markNotificationRead(id);
  }

  @Post('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  async markAllNotificationsRead(@Request() req) {
    return this.mobileService.markAllNotificationsRead(req.user.id);
  }
}
