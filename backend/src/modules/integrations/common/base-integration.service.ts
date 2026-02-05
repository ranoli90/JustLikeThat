// ============ BASE INTEGRATION SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  IntegrationResult,
  IntegrationConfig,
  SyncResult,
  WebhookPayload,
  RateLimitInfo,
  Credentials,
} from './integration.types';
import { EncryptionService } from './encryption.service';

@Injectable()
export abstract class BaseIntegrationService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly provider: string;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly encryptionService: EncryptionService,
    protected readonly configService: ConfigService,
  ) {}

  /**
   * Abstract methods that must be implemented by each integration
   */
  abstract connect(credentials: Credentials): Promise<IntegrationResult>;
  abstract disconnect(tenantId: string): Promise<IntegrationResult>;
  abstract testConnection(tenantId: string): Promise<IntegrationResult>;
  abstract sync(tenantId: string, syncType: string): Promise<SyncResult>;
  abstract handleWebhook(payload: WebhookPayload): Promise<IntegrationResult>;

  /**
   * Validate credentials before storing
   */
  async validateCredentials(credentials: Credentials): Promise<IntegrationResult> {
    try {
      const validated = await this.doValidateCredentials(credentials);
      return {
        success: validated,
        data: { valid: validated },
      };
    } catch (error) {
      this.logger.error(`Credential validation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Store encrypted credentials for a tenant
   */
  async storeCredentials(
    tenantId: string,
    credentials: Credentials,
    settings?: Record<string, any>,
  ): Promise<IntegrationResult> {
    try {
      const encryptedCredentials = this.encryptionService.encrypt(
        JSON.stringify(credentials),
      );

      const config = await this.prisma.integrationConfig.create({
        data: {
          tenantId,
          providerName: this.provider,
          integrationType: this.getIntegrationType(),
          credentials: { encrypted: true },
          settings: settings || {},
          status: 'PENDING',
        },
      });

      // Store encrypted credentials in a separate secure location
      await this.prisma.$queryRaw`
        UPDATE integration_configs
        SET credentials = ${encryptedCredentials}::jsonb
        WHERE id = ${config.id}
      `;

      return {
        success: true,
        data: { configId: config.id },
      };
    } catch (error) {
      this.logger.error(`Failed to store credentials: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve and decrypt credentials
   */
  async getCredentials(tenantId: string): Promise<IntegrationResult<Credentials>> {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          tenantId_providerName: {
            tenantId,
            providerName: this.provider,
          },
        },
      });

      if (!config) {
        return { success: false, error: 'Integration not configured' };
      }

      const decrypted = this.encryptionService.decrypt(
        config.credentials.encrypted as string,
      );

      return {
        success: true,
        data: JSON.parse(decrypted),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve credentials: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update integration status
   */
  async updateStatus(
    tenantId: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.integrationConfig.updateMany({
      where: {
        tenantId,
        providerName: this.provider,
      },
      data: {
        status: status as any,
        errorMessage,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Log sync operation
   */
  async logSync(
    configId: string,
    syncType: string,
    result: SyncResult,
  ): Promise<void> {
    await this.prisma.integrationSyncLog.create({
      data: {
        configId,
        syncType: syncType as any,
        status: result.recordsFailed > 0 ? (result.recordsProcessed === result.recordsFailed ? 'FAILED' : 'PARTIAL') : 'SUCCESS',
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsFailed: result.recordsFailed,
        errors: result.errors,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
      },
    });

    // Update config with last sync time
    await this.prisma.integrationConfig.update({
      where: { id: configId },
      data: {
        lastSync: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Check rate limits for the provider
   */
  async checkRateLimit(): Promise<RateLimitInfo> {
    // Default implementation - can be overridden
    return {
      limit: 1000,
      remaining: 1000,
      resetAt: new Date(),
      windowMs: 60000,
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Get integration type - override in subclasses
   */
  protected getIntegrationType(): string {
    return 'GENERIC';
  }

  /**
   * Validate credentials - override in subclasses
   */
  protected async doValidateCredentials(credentials: Credentials): Promise<boolean> {
    return true;
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async makeRequest<T>(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
      retries?: number;
    },
  ): Promise<IntegrationResult<T>> {
    const maxRetries = options.retries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Implementation would use axios/fetch with proper error handling
        // This is a placeholder for the pattern
        const result = await this.executeRequest<T>(url, options);
        return result;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Request attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`,
        );
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }

    return {
      success: false,
      error: `Request failed after ${maxRetries} attempts: ${lastError?.message}`,
    };
  }

  /**
   * Execute the actual HTTP request
   */
  protected abstract executeRequest<T>(
    url: string,
    options: any,
  ): Promise<IntegrationResult<T>>;

  /**
   * Helper to delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
