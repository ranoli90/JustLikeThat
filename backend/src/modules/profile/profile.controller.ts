import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from '../../dto/profile/update-profile.dto';
import { CreateResumeDto } from '../../dto/resume/create-resume.dto';

@Controller('api/profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserProfile(@Request() req) {
    return this.profileService.getCurrentUserProfile(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateCurrentUserProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateCurrentUserProfile(req.user.id, updateProfileDto);
  }

  @Get('resumes')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserResumes(@Request() req) {
    return this.profileService.getCurrentUserResumes(req.user.id);
  }

  @Get('resumes/:id')
  @UseGuards(JwtAuthGuard)
  async getResumeById(@Request() req, @Param('id') id: string) {
    return this.profileService.getResumeById(req.user.id, id);
  }

  @Post('resumes')
  @UseGuards(JwtAuthGuard)
  async createResume(@Request() req, @Body() createResumeDto: CreateResumeDto) {
    return this.profileService.createResume(req.user.id, createResumeDto);
  }

  @Delete('resumes/:id')
  @UseGuards(JwtAuthGuard)
  async deleteResume(@Request() req, @Param('id') id: string) {
    return this.profileService.deleteResume(req.user.id, id);
  }

  @Post('resumes/:id/parse')
  @UseGuards(JwtAuthGuard)
  async parseResume(@Request() req, @Param('id') id: string) {
    return this.profileService.parseResume(req.user.id, id);
  }
}
