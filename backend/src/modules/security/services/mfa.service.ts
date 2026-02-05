import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { ConfigService } from '@nestjs/config';

export interface MfaStatus {
  userId: string;
  enabled: boolean;
  method: string;
  backupCodesRemaining: number;
  lastVerified?: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MfaBackupCodes {
  userId: string;
  codes: string[];
  createdAt: Date;
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly ENCRYPTION_KEY: string;
  
  // In-memory storage for demo (use Prisma in production)
  private mfaSecrets: Map<string, { encryptedSecret: string; method: string; backupCodes: string[] }> = new Map();
  private mfaStatus: Map<string, MfaStatus> = new Map();

  constructor(private readonly configService: ConfigService) {
    // Use a fixed key derived from environment or generate a new one
    const envKey = this.configService.get<string>('MFA_ENCRYPTION_KEY');
    if (envKey) {
      this.ENCRYPTION_KEY = envKey;
    } else {
      // Generate a key - in production this must be persisted
      this.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
      this.logger.warn('MFA_ENCRYPTION_KEY not set, using generated key. Set this in production!');
    }
  }

  /**
   * Encrypt a secret using AES-256-GCM
   */
  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.ENCRYPTION_KEY, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${cipher.getAuthTag().toString('hex')}`;
  }

  /**
   * Decrypt a secret using AES-256-GCM
   */
  private decryptSecret(encrypted: string): string {
    const [iv, encryptedData, authTag] = encrypted.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      Buffer.from(this.ENCRYPTION_KEY, 'hex'), 
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
  }

  async setupMfa(data: { userId: string; method: 'totp' | 'sms' | 'email' | 'webauthn'; phoneNumber?: string; email?: string }): Promise<MfaSetupResponse> {
    // Generate a base32 secret for TOTP
    const secret = speakeasy.generateSecret({
      name: `ApplyAsAService:${data.userId}`,
      length: 20,
    });

    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

    // Encrypt the secret before storing
    const encryptedSecret = this.encryptSecret(secret.base32);

    // Store the encrypted secret
    this.mfaSecrets.set(data.userId, {
      encryptedSecret,
      method: data.method,
      backupCodes,
    });

    // Initialize MFA status
    this.mfaStatus.set(data.userId, {
      userId: data.userId,
      enabled: true,
      method: data.method,
      backupCodesRemaining: backupCodes.length,
    });

    this.logger.log(`MFA setup completed for user ${data.userId}`);

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
      backupCodes,
    };
  }

  async verifyMfa(data: { userId: string; code: string; method: string }): Promise<{ success: boolean; message: string }> {
    const mfaData = this.mfaSecrets.get(data.userId);
    
    if (!mfaData) {
      this.logger.warn(`MFA verification failed: No MFA data found for user ${data.userId}`);
      return { success: false, message: 'MFA not set up for this user' };
    }

    // Verify TOTP code
    if (data.method === 'totp' && data.code.length === 6 && /^\d+$/.test(data.code)) {
      try {
        const secret = this.decryptSecret(mfaData.encryptedSecret);
        
        const verified = speakeasy.totp.verify({
          secret,
          encoding: 'base32',
          token: data.code,
          window: 1 // Allow 1-minute window for clock drift
        });

        if (verified) {
          const status = this.mfaStatus.get(data.userId);
          if (status) {
            status.lastVerified = new Date().toISOString();
          }
          
          this.logger.log(`MFA verification successful for user ${data.userId}`);
          return { success: true, message: 'MFA verification successful' };
        }
      } catch (error) {
        this.logger.error(`MFA verification error for user ${data.userId}: ${error.message}`);
      }
    }

    // Check backup codes
    if (mfaData.backupCodes.includes(data.code.toUpperCase())) {
      const index = mfaData.backupCodes.indexOf(data.code.toUpperCase());
      mfaData.backupCodes.splice(index, 1);

      const status = this.mfaStatus.get(data.userId);
      if (status) {
        status.backupCodesRemaining = mfaData.backupCodes.length;
        status.lastVerified = new Date().toISOString();
      }

      this.logger.log(`Backup code used for user ${data.userId}`);
      return { success: true, message: 'Backup code used successfully' };
    }

    this.logger.warn(`MFA verification failed: Invalid code for user ${data.userId}`);
    return { success: false, message: 'Invalid verification code' };
  }

  async disableMfa(userId: string): Promise<{ success: boolean; message: string }> {
    const status = this.mfaStatus.get(userId);
    if (!status) {
      return { success: false, message: 'MFA not enabled for this user' };
    }

    this.mfaSecrets.delete(userId);
    status.enabled = false;
    status.method = '';

    this.logger.log(`MFA disabled for user ${userId}`);
    return { success: true, message: 'MFA disabled successfully' };
  }

  async getMfaStatus(userId: string): Promise<MfaStatus | null> {
    return this.mfaStatus.get(userId) || null;
  }

  async getMfaStats(): Promise<{ enabled: number; disabled: number; byMethod: Record<string, number> }> {
    let enabled = 0;
    let disabled = 0;
    const byMethod: Record<string, number> = {};

    this.mfaStatus.forEach((status) => {
      if (status.enabled) {
        enabled++;
        byMethod[status.method] = (byMethod[status.method] || 0) + 1;
      } else {
        disabled++;
      }
    });

    return { enabled, disabled, byMethod };
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    const mfaData = this.mfaSecrets.get(userId);
    if (!mfaData) {
      throw new Error('MFA not set up for this user');
    }

    const newBackupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
    mfaData.backupCodes = newBackupCodes;

    const status = this.mfaStatus.get(userId);
    if (status) {
      status.backupCodesRemaining = newBackupCodes.length;
    }

    this.logger.log(`New backup codes generated for user ${userId}`);
    return newBackupCodes;
  }

  /**
   * Verify a TOTP token without requiring database lookup (for testing)
   */
  verifyTotp(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1
    });
  }

  /**
   * Generate a TOTP secret for testing
   */
  generateTestSecret(): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: 'TestUser',
      length: 20,
    });
    
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }
}
