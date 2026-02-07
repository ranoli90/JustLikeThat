import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: false,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@justlikethat.app'),
        to: email,
        subject: 'Verify your email address',
        html: `
          <h2>Welcome to JustLikeThat!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verifyUrl}">Verify Email</a>
          <p>This link expires in 24 hours.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@justlikethat.app'),
        to: email,
        subject: 'Reset your password',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
    }
  }

  async sendApplicationStatusEmail(
    email: string,
    jobTitle: string,
    status: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@justlikethat.app'),
        to: email,
        subject: `Application Update: ${jobTitle}`,
        html: `
          <h2>Application Status Update</h2>
          <p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong></p>
        `,
      });
      this.logger.log(`Application status email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send application status email to ${email}`,
        error,
      );
    }
  }
}
