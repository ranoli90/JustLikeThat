// ============ BACKGROUND CHECK SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckrService } from './background-check/checkr.service';

@Injectable()
export class BackgroundCheckService {
  private readonly logger = new Logger(BackgroundCheckService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkrService: CheckrService,
  ) {}

  /**
   * Invite candidate for background check
   */
  async inviteCandidate(userId: string, checkType: string) {
    this.logger.log(`Inviting ${userId} for background check: ${checkType}`);

    try {
      const result = await this.checkrService.createInvitation({
        candidateId: userId,
        checkType,
      });

      // Store record
      await this.prisma.backgroundCheckRecord.create({
        data: {
          userId,
          configId: 'checkr',
          externalId: result.data?.id,
          checkType,
          status: 'pending',
          invitedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Background check invitation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get background check status
   */
  async getStatus(checkId: string) {
    const record = await this.prisma.backgroundCheckRecord.findUnique({
      where: { id: checkId },
    });

    if (!record) {
      throw new NotFoundException('Background check not found');
    }

    return {
      id: record.id,
      status: record.status,
      checkType: record.checkType,
      invitedAt: record.invitedAt,
      completedAt: record.completedAt,
      resultUrl: record.resultUrl,
    };
  }

  /**
   * Handle webhook from background check provider
   */
  async handleWebhook(provider: string, payload: any) {
    switch (provider.toUpperCase()) {
      case 'CHECKR':
        return this.checkrService.handleWebhook(payload);
      default:
        return { processed: false, reason: 'Unknown provider' };
    }
  }
}
