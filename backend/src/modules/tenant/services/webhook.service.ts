import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async getWebhooks(tenantId: string) {
    return this.prisma.tenantWebhook.findMany({
      where: { tenantId },
      include: { webhookLogs: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  async getWebhook(webhookId: string) {
    const webhook = await this.prisma.tenantWebhook.findUnique({
      where: { id: webhookId },
      include: { webhookLogs: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return webhook;
  }

  async createWebhook(tenantId: string, data: {
    name: string;
    url: string;
    events: string[];
    headers?: any;
    maxRetries?: number;
    timeout?: number;
  }) {
    const secret = uuidv4();
    
    return this.prisma.tenantWebhook.create({
      data: {
        tenantId,
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        headers: data.headers,
        maxRetries: data.maxRetries || 3,
        timeout: data.timeout || 30,
      },
    });
  }

  async updateWebhook(webhookId: string, data: any) {
    await this.getWebhook(webhookId);
    return this.prisma.tenantWebhook.update({
      where: { id: webhookId },
      data,
    });
  }

  async deleteWebhook(webhookId: string) {
    await this.getWebhook(webhookId);
    return this.prisma.tenantWebhook.delete({ where: { id: webhookId } });
  }

  async toggleWebhook(webhookId: string) {
    const webhook = await this.getWebhook(webhookId);
    return this.prisma.tenantWebhook.update({
      where: { id: webhookId },
      data: { isActive: !webhook.isActive },
    });
  }

  async getWebhookLogs(webhookId: string, limit = 50) {
    return this.prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async triggerWebhook(tenantId: string, event: string, payload: any) {
    const webhooks = await this.prisma.tenantWebhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    const results = await Promise.all(
      webhooks.map(w => this.sendWebhook(w, event, payload))
    );

    return { triggered: webhooks.length, results };
  }

  private async sendWebhook(webhook: any, event: string, payload: any) {
    const startTime = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let error: string | null = null;

    try {
      const response = await axios.post(webhook.url, {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
          'X-Webhook-Event': event,
        },
        timeout: webhook.timeout * 1000,
      });

      responseStatus = response.status;
      responseBody = JSON.stringify(response.data);
    } catch (err: any) {
      error = err.message;
      responseStatus = err.response?.status || 500;
    }

    const duration = Date.now() - startTime;

    // Log the webhook
    const log = await this.prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: JSON.stringify(payload),
        responseStatus,
        responseBody,
        error,
        duration,
      },
    });

    // Update webhook stats
    await this.prisma.tenantWebhook.update({
      where: { id: webhook.id },
      data: {
        totalRequests: { increment: 1 },
        failedRequests: error ? { increment: 1 } : undefined,
        lastTriggeredAt: new Date(),
      },
    });

    return { webhookId: webhook.id, success: !error, logId: log.id };
  }

  async testWebhook(webhookId: string) {
    const webhook = await this.getWebhook(webhookId);
    
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook',
    };

    return this.sendWebhook(webhook, 'test', testPayload);
  }

  async getWebhookStats(tenantId: string) {
    const webhooks = await this.prisma.tenantWebhook.findMany({
      where: { tenantId },
    });

    return webhooks.map(w => ({
      id: w.id,
      name: w.name,
      isActive: w.isActive,
      totalRequests: w.totalRequests,
      failedRequests: w.failedRequests,
      successRate: w.totalRequests > 0 
        ? ((w.totalRequests - w.failedRequests) / w.totalRequests) * 100 
        : 100,
      lastTriggeredAt: w.lastTriggeredAt,
    }));
  }

  async resendFailedWebhook(logId: string) {
    const log = await this.prisma.webhookLog.findUnique({
      where: { id: logId },
      include: { webhook: true },
    });

    if (!log) throw new NotFoundException('Webhook log not found');

    const payload = JSON.parse(log.payload as string);
    return this.sendWebhook(log.webhook, log.event, payload);
  }
}
