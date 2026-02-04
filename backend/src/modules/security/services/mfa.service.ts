import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

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

@Injectable()
export class MfaService {
  private mfaSecrets: Map<string, { secret: string; method: string; backupCodes: string[] }> = new Map();
  private mfaStatus: Map<string, MfaStatus> = new Map();

  async setupMfa(data: { userId: string; method: 'totp' | 'sms' | 'email' | 'webauthn'; phoneNumber?: string; email?: string }): Promise<MfaSetupResponse> {
    const secret = crypto.randomBytes(20).toString('hex');
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));

    // Store the secret
    this.mfaSecrets.set(data.userId, {
      secret,
      method: data.method,
      backupCodes,
    });

    // Generate QR code URL for TOTP
    const qrCodeUrl = `otpauth://totp/SimpleAsThat:${data.userId}?secret=${secret}&issuer=SimpleAsThat`;

    // Initialize MFA status
    this.mfaStatus.set(data.userId, {
      userId: data.userId,
      enabled: true,
      method: data.method,
      backupCodesRemaining: backupCodes.length,
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  async verifyMfa(data: { userId: string; code: string; method: string }): Promise<{ success: boolean; message: string }> {
    const mfaData = this.mfaSecrets.get(data.userId);
    if (!mfaData) {
      return { success: false, message: 'MFA not set up for this user' };
    }

    // For demo purposes, accept any 6-digit code or backup code
    if (data.code.length === 6 && /^\d+$/.test(data.code)) {
      // In production, verify against TOTP algorithm
      const status = this.mfaStatus.get(data.userId);
      if (status) {
        status.lastVerified = new Date().toISOString();
      }
      return { success: true, message: 'MFA verification successful' };
    }

    // Check backup codes
    if (mfaData.backupCodes.includes(data.code)) {
      // Remove used backup code
      const index = mfaData.backupCodes.indexOf(data.code);
      mfaData.backupCodes.splice(index, 1);

      const status = this.mfaStatus.get(data.userId);
      if (status) {
        status.backupCodesRemaining = mfaData.backupCodes.length;
        status.lastVerified = new Date().toISOString();
      }

      return { success: true, message: 'Backup code used successfully' };
    }

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

    const newBackupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    mfaData.backupCodes = newBackupCodes;

    const status = this.mfaStatus.get(userId);
    if (status) {
      status.backupCodesRemaining = newBackupCodes.length;
    }

    return newBackupCodes;
  }
}
