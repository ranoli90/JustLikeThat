import { Controller, Post, Body, UsePipes, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../pipes/zod.pipe';
import { signupSchema } from '../../dto/auth/signup.zod';
import type { SignupDto } from '../../dto/auth/signup.zod';
import { loginSchema } from '../../dto/auth/login.zod';
import type { LoginDto } from '../../dto/auth/login.zod';
import { resetPasswordSchema, updatePasswordSchema } from '../../dto/auth/reset-password.zod';
import type { ResetPasswordDto, UpdatePasswordDto } from '../../dto/auth/reset-password.zod';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('update-password')
  @UsePipes(new ZodValidationPipe(updatePasswordSchema))
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
