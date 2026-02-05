import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // Billing Plans
  async getPlans(tenantId: string) {
    return this.prisma.billingPlan.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.billingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(tenantId: string, data: any) {
    return this.prisma.billingPlan.create({
      data: { tenantId, ...data },
    });
  }

  async updatePlan(planId: string, data: any) {
    await this.getPlan(planId);
    return this.prisma.billingPlan.update({
      where: { id: planId },
      data,
    });
  }

  async deletePlan(planId: string) {
    await this.getPlan(planId);
    return this.prisma.billingPlan.delete({ where: { id: planId } });
  }

  // Usage Tracking
  async getUsage(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) where.periodStart.gte = startDate;
      if (endDate) where.periodStart.lte = endDate;
    }
    return this.prisma.tenantUsage.findMany({ where });
  }

  async getUsageByMetric(tenantId: string, metricType: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId, metricType };
    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) where.periodStart.gte = startDate;
      if (endDate) where.periodStart.lte = endDate;
    }
    return this.prisma.tenantUsage.findMany({ where });
  }

  async recordUsage(tenantId: string, metricType: string, metricName: string, quantity: number, metadata?: any) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.prisma.tenantUsage.create({
      data: {
        tenantId,
        metricType,
        metricName,
        quantity,
        periodStart,
        periodEnd,
        metadata,
      },
    });
  }

  async aggregateUsage(tenantId: string, metricType?: string) {
    const where: any = { tenantId };
    if (metricType) where.metricType = metricType;

    const results = await this.prisma.tenantUsage.groupBy({
      by: ['metricType'],
      where,
      _sum: { quantity: true },
    });

    return results.reduce((acc, r) => {
      acc[r.metricType] = r._sum.quantity || 0;
      return acc;
    }, {});
  }

  // Invoices
  async getInvoices(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async generateInvoice(tenantId: string, planId: string, periodStart: Date, periodEnd: Date) {
    const plan = await this.getPlan(planId);
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return this.prisma.invoice.create({
      data: {
        tenantId,
        planId,
        invoiceNumber,
        periodStart,
        periodEnd,
        subtotal: plan.basePrice,
        discount: 0,
        tax: 0,
        total: plan.basePrice,
        lineItems: [
          {
            description: `${plan.name} Plan`,
            quantity: 1,
            unitPrice: plan.basePrice,
            total: plan.basePrice,
          },
        ],
        status: 'PENDING',
      },
    });
  }

  async markInvoicePaid(invoiceId: string, paymentMethod: string, paymentId: string) {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod,
        paymentId,
      },
    });
  }

  // Usage Alerts
  async getUsageAlerts(tenantId: string, activeOnly = true) {
    const where: any = { tenantId };
    if (activeOnly) where.isActive = true;
    return this.prisma.usageAlert.findMany({
      where,
      include: { plan: true },
    });
  }

  async createUsageAlert(tenantId: string, planId: string, data: any) {
    return this.prisma.usageAlert.create({
      data: { tenantId, planId, ...data },
    });
  }

  async updateUsageAlert(alertId: string, data: any) {
    return this.prisma.usageAlert.update({
      where: { id: alertId },
      data,
    });
  }

  async deleteUsageAlert(alertId: string) {
    return this.prisma.usageAlert.delete({ where: { id: alertId } });
  }

  // Billing Summary
  async getBillingSummary(tenantId: string) {
    const [plans, invoices, usageAlerts, currentUsage] = await Promise.all([
      this.getPlans(tenantId),
      this.getInvoices(tenantId),
      this.getUsageAlerts(tenantId),
      this.aggregateUsage(tenantId),
    ]);

    const totalSpent = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0);

    const pendingInvoices = invoices.filter(i => i.status === 'PENDING');

    return {
      plans,
      totalSpent,
      pendingInvoices,
      usageAlerts,
      currentUsage,
      unpaidInvoices: pendingInvoices.length,
    };
  }

  // Usage Alerts Check
  async checkUsageThresholds(tenantId: string) {
    const alerts = await this.getUsageAlerts(tenantId, true);
    const usage = await this.aggregateUsage(tenantId);
    const triggeredAlerts: any[] = [];

    for (const alert of alerts) {
      const metricUsage = usage[alert.metricType] || 0;
      if (metricUsage >= alert.threshold) {
        triggeredAlerts.push({
          alert,
          currentUsage: metricUsage,
          percentageUsed: (metricUsage / alert.threshold) * 100,
        });

        await this.prisma.usageAlert.update({
          where: { id: alert.id },
          data: { lastTriggeredAt: new Date() },
        });
      }
    }

    return triggeredAlerts;
  }
}
