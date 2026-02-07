import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.userService.findById(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.userService.updateProfile(req.user.id, body);
  }

  @Get('preferences')
  async getPreferences(@Request() req: any) {
    return this.userService.getPreferences(req.user.id);
  }

  @Put('preferences')
  async updatePreferences(@Request() req: any, @Body() body: any) {
    return this.userService.updatePreferences(req.user.id, body);
  }

  @Delete('account')
  async deleteAccount(@Request() req: any) {
    return this.userService.deleteAccount(req.user.id);
  }
}
