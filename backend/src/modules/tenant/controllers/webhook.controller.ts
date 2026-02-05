import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('api/v1/tenants/:id/webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  async getWebhooks(@Param('id') id: string) {
    return this.webhookService.getWebhooks(id);
  }

  @Get('stats')
  async getWebhookStats(@Param('id') id: string) {
    return this.webhookService.getWebhookStats(id);
  }

  @Get(':webhookId')
  async getWebhook(@Param('webhookId') webhookId: string) {
    return this.webhookService.getWebhook(webhookId);
  }

  @Get(':webhookId/logs')
  async getWebhookLogs(@Param('webhookId') webhookId: string, @Query('limit') limit?: string) {
    return this.webhookService.getWebhookLogs(webhookId, limit ? parseInt(limit) : 50);
  }

  @Post()
  async createWebhook(@Param('id') id: string, @Body() data: any) {
    return this.webhookService.createWebhook(id, data);
  }

  @Put(':webhookId')
  async updateWebhook(@Param('webhookId') webhookId: string, @Body() data: any) {
    return this.webhookService.updateWebhook(webhookId, data);
  }

  @Delete(':webhookId')
  async deleteWebhook(@Param('webhookId') webhookId: string) {
    return this.webhookService.deleteWebhook(webhookId);
  }

  @Post(':webhookId/toggle')
  async toggleWebhook(@Param('webhookId') webhookId: string) {
    return this.webhookService.toggleWebhook(webhookId);
  }

  @Post(':webhookId/test')
  async testWebhook(@Param('webhookId') webhookId: string) {
    return this.webhookService.testWebhook(webhookId);
  }

  @Post(':webhookId/resend')
  async resendFailedWebhook(@Param('webhookId') webhookId: string, @Body() data: { logId: string }) {
    return this.webhookService.resendFailedWebhook(data.logId);
  }
}
