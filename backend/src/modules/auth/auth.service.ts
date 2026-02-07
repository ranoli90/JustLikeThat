import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notification/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async signup(signupDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: signupDto.email },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }

      if (signupDto.password.length < MIN_PASSWORD_LENGTH) {
        throw new BadRequestException(
          'Password must be at least 8 characters',
        );
      }

      const hashedPassword = await bcrypt.hash(
        signupDto.password,
        BCRYPT_ROUNDS,
      );
      const verificationToken = uuidv4();

      const user = await tx.user.create({
        data: {
          email: signupDto.email,
          passwordHash: hashedPassword,
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: new Date(
            Date.now() + TWENTY_FOUR_HOURS_MS,
          ),
          profile: { create: {} },
          preferences: { create: { jobTitle: '' } },
        },
      });

      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );

      const tokens = this.generateTokens(user.id, user.email);
      this.logger.log(`New user signed up: ${user.id}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          onboardingCompleted: user.onboardingCompleted,
        },
      };
    });
  }

  async login(loginDto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email);
    this.logger.log(`User logged in: ${user.id}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(user.id, user.email);
      this.logger.log(`Token refreshed for user ${user.id}`);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async resetPassword(resetPasswordDto: {
    email: string;
  }): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      return {
        message: 'If an account exists, a password reset link has been sent',
      };
    }

    const resetToken = uuidv4();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + ONE_HOUR_MS),
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    this.logger.log(`Password reset requested for user ${user.id}`);

    return {
      message: 'If an account exists, a password reset link has been sent',
    };
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        'Password must be at least 8 characters',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        passwordUpdatedAt: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    this.logger.log(`Password reset with token for user ${user.id}`);
    return { message: 'Password reset successfully' };
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    if (updatePasswordDto.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        'New password must be at least 8 characters',
      );
    }

    const isSamePassword = await bcrypt.compare(
      updatePasswordDto.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(
          updatePasswordDto.newPassword,
          BCRYPT_ROUNDS,
        ),
        passwordUpdatedAt: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    this.logger.log(`Password updated for user ${userId}`);
    return { message: 'Password updated successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    this.logger.log(`Email verified for user ${user.id}`);
    return { message: 'Email verified successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
    };
  }

  private generateTokens(
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
