import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from '../services/billing.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('api/v1/tenants/:id/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Plans
  @Get('plans')
  async getPlans(@Param('id') id: string) {
    return this.billingService.getPlans(id);
  }

  @Post('plans')
  async createPlan(@Param('id') id: string, @Body() data: any) {
    return this.billingService.createPlan(id, data);
  }

  @Put('plans/:planId')
  async updatePlan(@Param('id') id: string, @Param('planId') planId: string, @Body() data: any) {
    return this.billingService.updatePlan(planId, data);
  }

  @Delete('plans/:planId')
  async deletePlan(@Param('planId') planId: string) {
    return this.billingService.deletePlan(planId);
  }

  // Usage
  @Get('usage')
  async getUsage(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.billingService.getUsage(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('usage/summary')
  async getUsageSummary(@Param('id') id: string) {
    return this.billingService.aggregateUsage(id);
  }

  @Get('usage/:metricType')
  async getUsageByMetric(
    @Param('id') id: string,
    @Param('metricType') metricType: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.billingService.getUsageByMetric(
      id,
      metricType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // Invoices
  @Get('invoices')
  async getInvoices(@Param('id') id: string, @Query('status') status?: string) {
    return this.billingService.getInvoices(id, status);
  }

  @Get('invoices/:invoiceId')
  async getInvoice(@Param('invoiceId') invoiceId: string) {
    return this.billingService.getInvoice(invoiceId);
  }

  @Post('invoices/generate')
  async generateInvoice(
    @Param('id') id: string,
    @Body() data: { planId: string; periodStart: string; periodEnd: string }
  ) {
    return this.billingService.generateInvoice(
      id,
      data.planId,
      new Date(data.periodStart),
      new Date(data.periodEnd)
    );
  }

  @Put('invoices/:invoiceId/pay')
  async markInvoicePaid(
    @Param('invoiceId') invoiceId: string,
    @Body() data: { paymentMethod: string; paymentId: string }
  ) {
    return this.billingService.markInvoicePaid(invoiceId, data.paymentMethod, data.paymentId);
  }

  // Usage Alerts
  @Get('alerts')
  async getUsageAlerts(@Param('id') id: string, @Query('activeOnly') activeOnly?: string) {
    return this.billingService.getUsageAlerts(id, activeOnly !== 'false');
  }

  @Post('alerts')
  async createUsageAlert(@Param('id') id: string, @Body() data: any) {
    return this.billingService.createUsageAlert(id, data.planId, data);
  }

  @Put('alerts/:alertId')
  async updateUsageAlert(@Param('alertId') alertId: string, @Body() data: any) {
    return this.billingService.updateUsageAlert(alertId, data);
  }

  @Delete('alerts/:alertId')
  async deleteUsageAlert(@Param('alertId') alertId: string) {
    return this.billingService.deleteUsageAlert(alertId);
  }

  // Summary
  @Get('summary')
  async getBillingSummary(@Param('id') id: string) {
    return this.billingService.getBillingSummary(id);
  }

  @Get('alerts/check')
  async checkUsageThresholds(@Param('id') id: string) {
    return this.billingService.checkUsageThresholds(id);
  }
}
