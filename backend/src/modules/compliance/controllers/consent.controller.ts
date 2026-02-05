import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConsentService } from '../services/consent.service';

@Controller('api/v1/compliance/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  async recordConsent(
    @Body() data: {
      userId: string;
      tenantId: string;
      consentType: string;
      regulation?: string;
      consentGiven: boolean;
      consentVersion?: string;
      consentMethod?: string;
      consentIp?: string;
      legalBasis?: string;
      purpose?: string;
      userAgent?: string;
      source?: string;
    },
  ) {
    return this.consentService.recordConsent(data);
  }

  @Post('withdraw')
  async withdrawConsent(
    @Body() data: { userId: string; consentType: string },
  ) {
    await this.consentService.withdrawConsent(data.userId, data.consentType);
    return { success: true };
  }

  @Post('renew')
  async renewConsent(
    @Body() data: {
      userId: string;
      consentType: string;
      consentGiven: boolean;
      consentVersion?: string;
      consentMethod?: string;
    },
  ) {
    return this.consentService.renewConsent(data.userId, data.consentType, {
      consentGiven: data.consentGiven,
      consentVersion: data.consentVersion,
      consentMethod: data.consentMethod,
    });
  }

  @Get('history/:userId')
  async getConsentHistory(@Param('userId') userId: string) {
    return this.consentService.getConsentHistory(userId);
  }

  @Get('check/:userId/:consentType')
  async hasActiveConsent(
    @Param('userId') userId: string,
    @Param('consentType') consentType: string,
  ) {
    const hasConsent = await this.consentService.hasActiveConsent(userId, consentType);
    return { hasConsent };
  }

  @Get(':userId/:consentType')
  async getConsent(
    @Param('userId') userId: string,
    @Param('consentType') consentType: string,
  ) {
    return this.consentService.getConsentByType(userId, consentType);
  }

  @Get('stats/:tenantId')
  async getConsentStats(@Param('tenantId') tenantId: string) {
    return this.consentService.getConsentStats(tenantId);
  }
}
