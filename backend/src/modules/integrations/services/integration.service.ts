// ============ INTEGRATION SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * List all integrations with optional filtering
   */
  async listIntegrations(type?: string, status?: string) {
    const where: any = {};
    
    if (type) {
      where.integrationType = type;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.integrationConfig.findMany({
      where,
      include: {
        syncLogs: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single integration by ID
   */
  async getIntegration(id: string) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { id },
      include: {
        syncLogs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        webhookLogs: {
          take: 10,
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!config) {
      throw new NotFoundException('Integration not found');
    }

    // Don't return credentials
    const { credentials, ...safeConfig } = config;
    return safeConfig;
  }

  /**
   * Create a new integration
   */
  async createIntegration(dto: {
    provider: string;
    integrationType: string;
    credentials: Record<string, any>;
    settings?: Record<string, any>;
  }) {
    const { credentials, ...rest } = dto;

    // Encrypt credentials before storing
    const encryptedCredentials = this.encryptionService.encryptObject(credentials);

    return this.prisma.integrationConfig.create({
      data: {
        ...rest,
        providerName: dto.provider,
        credentials: { encrypted: true },
        encryptedData: encryptedCredentials,
        settings: dto.settings || {},
        status: 'PENDING',
      },
    });
  }

  /**
   * Update an integration
   */
  async updateIntegration(
    id: string,
    dto: Partial<{
      provider: string;
      integrationType: string;
      credentials: Record<string, any>;
      settings: Record<string, any>;
      syncEnabled: boolean;
      syncFrequency: string;
    }>,
  ) {
    const updateData: any = { ...dto };

    if (dto.credentials) {
      updateData.encryptedData = this.encryptionService.encryptObject(dto.credentials);
      updateData.credentials = { encrypted: true };
      delete updateData.credentials;
    }

    return this.prisma.integrationConfig.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(id: string) {
    // Soft delete by setting status to DELETED
    return this.prisma.integrationConfig.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  /**
   * Trigger sync for an integration
   */
  async syncIntegration(id: string, syncType?: string) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Integration not found');
    }

    // Update status to SYNCING
    await this.prisma.integrationConfig.update({
      where: { id },
      data: { status: 'SYNCING' },
    });

    // Create sync log entry
    const syncLog = await this.prisma.integrationSyncLog.create({
      data: {
        configId: id,
        syncType: (syncType || 'MANUAL') as any,
        status: 'IDLE',
        startedAt: new Date(),
      },
    });

    // In a real implementation, this would trigger the actual sync
    // For now, we'll just return the sync log
    return {
      syncLogId: syncLog.id,
      status: 'SYNCING',
      message: `Sync initiated for ${config.providerName}`,
    };
  }

  /**
   * Get sync logs for an integration
   */
  async getSyncLogs(id: string, page = 1, limit = 20) {
    const [logs, total] = await Promise.all([
      this.prisma.integrationSyncLog.findMany({
        where: { configId: id },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.integrationSyncLog.count({ where: { configId: id } }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Handle incoming webhooks from providers
   */
  async handleWebhook(
    provider: string,
    payload: any,
    signature?: string,
  ) {
    this.logger.log(`Received webhook from ${provider}: ${JSON.stringify(payload).slice(0, 200)}`);

    // Find the integration config
    const config = await this.prisma.integrationConfig.findFirst({
      where: {
        providerName: provider.toUpperCase(),
        status: 'ACTIVE',
      },
    });

    if (!config) {
      this.logger.warn(`No active integration found for provider: ${provider}`);
      return { received: true, processed: false, reason: 'No active integration' };
    }

    // Create webhook log
    const webhookLog = await this.prisma.partnerWebhookLog.create({
      data: {
        configId: config.id,
        provider,
        eventType: payload.event_type || payload.eventType || 'unknown',
        eventId: payload.event_id || payload.id,
        endpoint: 'webhook',
        payload,
        status: 'received',
        receivedAt: new Date(),
      },
    });

    try {
      // Process the webhook based on provider
      await this.processWebhook(provider, payload, config);

      // Update webhook log
      await this.prisma.partnerWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'processed',
          processingTime: 100, // Would calculate actual time
          processedAt: new Date(),
        },
      });

      return { received: true, processed: true, webhookId: webhookLog.id };
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`);

      await this.prisma.partnerWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      return { received: true, processed: false, error: error.message };
    }
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    provider?: string,
    page = 1,
    limit = 50,
  ) {
    const where: any = {};
    if (provider) {
      where.provider = provider.toUpperCase();
    }

    const [logs, total] = await Promise.all([
      this.prisma.partnerWebhookLog.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.partnerWebhookLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process webhook based on provider type
   */
  private async processWebhook(
    provider: string,
    payload: any,
    config: any,
  ): Promise<void> {
    // This would be implemented based on each provider's webhook format
    // For now, just log the processing
    this.logger.log(`Processing webhook for ${provider}`);
    
    switch (provider.toUpperCase()) {
      case 'LINKEDIN':
        await this.processLinkedInWebhook(payload);
        break;
      case 'GREENHOUSE':
        await this.processGreenhouseWebhook(payload);
        break;
      case 'LEVER':
        await this.processLeverWebhook(payload);
        break;
      default:
        this.logger.debug(`No specific processor for ${provider}`);
    }
  }

  private async processLinkedInWebhook(payload: any) {
    // Process LinkedIn-specific webhooks
  }

  private async processGreenhouseWebhook(payload: any) {
    // Process Greenhouse-specific webhooks
  }

  private async processLeverWebhook(payload: any) {
    // Process Lever-specific webhooks
  }
}
