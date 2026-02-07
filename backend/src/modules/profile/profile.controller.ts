import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Put()
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.profileService.updateProfile(req.user.id, body);
  }

  @Get('personas')
  async getPersonas(@Request() req: any) {
    return this.profileService.getPersonas(req.user.id);
  }

  @Post('personas')
  async createPersona(@Request() req: any, @Body() body: any) {
    return this.profileService.createPersona(req.user.id, body);
  }

  @Put('personas/:id')
  async updatePersona(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.profileService.updatePersona(req.user.id, id, body);
  }

  @Delete('personas/:id')
  async deletePersona(@Request() req: any, @Param('id') id: string) {
    return this.profileService.deletePersona(req.user.id, id);
  }
}
