import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { SignupDto } from '../../dto/auth/signup.dto';
import { LoginDto } from '../../dto/auth/login.dto';
import { ResetPasswordDto, UpdatePasswordDto } from '../../dto/auth/reset-password.zod';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CandidateProfile } from '../../entities/candidate-profile.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { v4 as uuidv4 } from 'uuid';
import { AuthConstants, TimeConstants } from '../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CandidateProfile)
    private profileRepository: Repository<CandidateProfile>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Generate new tokens
      const payload = { sub: user.id, email: user.email };
      const newAccessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '24h',
      });

      const newRefreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });

      this.logger.log(`Token refreshed for user ${user.id}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.warn(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Request password reset email
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email } = resetPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });

    // Always return the same message to prevent user enumeration
    if (!user) {
      return { message: 'If an account exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Store hashed reset token
    user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
    user.resetPasswordExpires = resetExpires;
    await this.userRepository.save(user);

    // Log the password reset request
    this.logger.log(`Password reset requested for user ${user.id}`);

    // In production, send email here:
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If an account exists, a password reset link has been sent' };
  }

  /**
   * Update password using current password
   */
  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = updatePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Password update failed: Invalid current password for user ${userId}`);
      throw new UnauthorizedException('Invalid current password');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    // Check if new password is the same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordUpdatedAt = new Date();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    this.logger.log(`Password updated for user ${userId}`);

    return { message: 'Password updated successfully' };
  }

  /**
   * Resets user password using a reset token
   * @param token - The password reset token
   * @param newPassword - The new password to set
   * @returns Success message
   * @throws BadRequestException if token is invalid or expired
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: await bcrypt.hash(token, AuthConstants.BCRYPT_SALT_ROUNDS) },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password
    if (newPassword.length < AuthConstants.MIN_PASSWORD_LENGTH) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, AuthConstants.BCRYPT_SALT_ROUNDS);
    user.passwordUpdatedAt = new Date();
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    this.logger.log(`Password reset with token for user ${user.id}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Verify email with verification token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);

    this.logger.log(`Email verified for user ${user.id}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend email verification token
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { message: 'Verification email sent' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = uuidv4();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + TimeConstants.TWENTY_FOUR_HOURS_MS);
    await this.userRepository.save(user);

    this.logger.log(`Verification email resent for user ${user.id}`);

    // In production, send email here:
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { message: 'Verification email sent' };
  }

    /**
     * Retrieves user profile by ID
     * @param userId - The user ID
     * @returns User profile data
     * @throws UnauthorizedException if user not found
     */
    async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
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
    };
  }

  /**
   * Registers a new user in the system
   * @param signupDto - Signup data including email, password, and user details
   * @returns Access token, refresh token, and user profile
   * @throws UnauthorizedException if email is already in use or password doesn't meet requirements
   */
  async signup(signupDto: SignupDto): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string; firstName: string; lastName: string } }> {
    const existingUser = await this.userRepository.findOne({ where: { email: signupDto.email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Validate password strength
    if (signupDto.password.length < AuthConstants.MIN_PASSWORD_LENGTH) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Generate email verification token
    const verificationToken = uuidv4();

    const hashedPassword = await bcrypt.hash(signupDto.password, AuthConstants.BCRYPT_SALT_ROUNDS);

    const user = this.userRepository.create({
      ...signupDto,
      passwordHash: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + TimeConstants.TWENTY_FOUR_HOURS_MS),
    });
    await this.userRepository.save(user);

    const profile = this.profileRepository.create({
      user,
    });
    await this.profileRepository.save(profile);

    const preferences = this.preferencesRepository.create({
      user,
      jobTitle: '',
    });
    await this.preferencesRepository.save(preferences);

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    this.logger.log(`New user signed up: ${user.id}`);

    // In production, send verification email:
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      accessToken,
      refreshToken,
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

  /**
   * Authenticates user with email and password
   * @param loginDto - Login credentials
   * @returns Access token, refresh token, and user data
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string; firstName: string; lastName: string; avatarUrl?: string; onboardingCompleted: boolean } }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    this.logger.log(`User logged in: ${user.id}`);

    return {
      accessToken,
      refreshToken,
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

  /**
   * Changes user password (admin function)
   * @param userId - The user ID
   * @param newPassword - The new password
   * @returns Success message
   * @throws UnauthorizedException if user not found
   * @throws BadRequestException if password doesn't meet requirements
   */
  async changePassword(userId: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (newPassword.length < AuthConstants.MIN_PASSWORD_LENGTH) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    user.passwordHash = await bcrypt.hash(newPassword, AuthConstants.BCRYPT_SALT_ROUNDS);
    user.passwordUpdatedAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`Password changed for user ${userId}`);

    return { message: 'Password changed successfully' };
  }
}
