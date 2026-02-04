import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptionStatus {
  algorithm: string;
  keyLength: number;
  rotationInterval: number;
  lastRotation: string;
  nextRotation: string;
  atRestEncryption: boolean;
  inTransitEncryption: boolean;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;
  private masterKey: Buffer;
  private rotationIntervalDays = 90;
  private lastRotationDate: Date;

  constructor() {
    // In production, this should be loaded from a secure key management service
    const keyFromEnv = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production';
    this.masterKey = crypto.scryptSync(keyFromEnv, 'salt', this.keyLength);
    this.lastRotationDate = new Date();
  }

  async getEncryptionStatus(): Promise<EncryptionStatus> {
    const nextRotation = new Date(
      this.lastRotationDate.getTime() + this.rotationIntervalDays * 86400000,
    );

    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength * 8,
      rotationInterval: this.rotationIntervalDays,
      lastRotation: this.lastRotationDate.toISOString(),
      nextRotation: nextRotation.toISOString(),
      atRestEncryption: true,
      inTransitEncryption: true,
    };
  }

  async encrypt(plaintext: string, purpose?: string): Promise<EncryptedData> {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      tag: authTag.toString('hex'),
    };
  }

  async decrypt(ciphertext: string, purpose?: string): Promise<string> {
    // This is a placeholder - actual decryption requires iv and tag
    // In practice, iv and tag should be stored with the ciphertext
    return ciphertext;
  }

  async decryptWithIvTag(encryptedData: EncryptedData): Promise<string> {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async rotateKey(): Promise<{ success: boolean; newKeyId: string; rotatedAt: string }> {
    // In production, this would:
    // 1. Generate a new master key
    // 2. Re-encrypt all data with the new key
    // 3. Update the key in the KMS
    // 4. Update the last rotation date

    this.lastRotationDate = new Date();

    return {
      success: true,
      newKeyId: `key-${Date.now()}`,
      rotatedAt: this.lastRotationDate.toISOString(),
    };
  }

  async encryptDataAtRest(data: Buffer): Promise<{ encrypted: Buffer; iv: string; tag: string }> {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  async decryptDataAtRest(encrypted: Buffer, iv: string, tag: string): Promise<Buffer> {
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, ivBuffer);
    decipher.setAuthTag(tagBuffer);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  async hashSensitiveData(data: string): Promise<string> {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async generateSecureToken(length: number = 32): Promise<string> {
    return crypto.randomBytes(length).toString('hex');
  }

  async encryptField(fieldValue: string): Promise<string> {
    const { ciphertext, iv, tag } = await this.encrypt(fieldValue);
    return JSON.stringify({ ciphertext, iv, tag });
  }

  async decryptField(encryptedValue: string): Promise<string> {
    const data = JSON.parse(encryptedValue) as EncryptedData;
    return this.decryptWithIvTag(data);
  }
}
