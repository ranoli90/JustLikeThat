// ============ ENCRYPTION SERVICE ============

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Get encryption key from environment or generate a derived key
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    // Get salt from environment or use a derived one
    const salt = this.configService.get<string>('ENCRYPTION_SALT', 'apply-as-a-service-salt');
    // Ensure key is 32 bytes for AES-256
    this.key = crypto.scryptSync(encryptionKey, salt, 32);
  }

  /**
   * Encrypt a plaintext string
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + Auth Tag + Encrypted data
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encryptedData: string): string {
    // Extract IV, Auth Tag, and encrypted data
    const iv = Buffer.from(encryptedData.slice(0, this.ivLength * 2), 'hex');
    const authTag = Buffer.from(
      encryptedData.slice(this.ivLength * 2, this.ivLength * 2 + this.tagLength * 2),
      'hex',
    );
    const encrypted = encryptedData.slice(this.ivLength * 2 + this.tagLength * 2);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash a value (one-way, for comparisons)
   */
  hash(value: string): string {
    return crypto.createHmac('sha256', this.key).update(value).digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt JSON object
   */
  encryptObject<T>(obj: T): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt to JSON object
   */
  decryptObject<T>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}
