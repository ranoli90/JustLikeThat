import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from '../../dto/user/update-user.dto';
import { UpdateUserPreferencesDto } from '../../dto/user/update-preferences.dto';

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return this.userService.getCurrentUser(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateCurrentUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateCurrentUser(req.user.id, updateUserDto);
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserPreferences(@Request() req) {
    return this.userService.getCurrentUserPreferences(req.user.id);
  }

  @Put('me/preferences')
  @UseGuards(JwtAuthGuard)
  async updateCurrentUserPreferences(
    @Request() req,
    @Body() updatePreferencesDto: UpdateUserPreferencesDto,
  ) {
    return this.userService.updateCurrentUserPreferences(req.user.id, updatePreferencesDto);
  }
}
