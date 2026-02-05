import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { PricingService } from '../services/pricing.service';
import { TaxService } from '../services/tax.service';

@Controller('api/v1/currency')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly taxService: TaxService,
  ) {}

  @Get('pricing/:planId')
  async getLocalizedPrice(
    @Param('planId') planId: string,
    @Query('currency') targetCurrency: string,
    @Query('region') regionCode?: string,
  ) {
    return this.pricingService.getLocalizedPrice(planId, targetCurrency, regionCode);
  }

  @Get('ppp/:countryCode')
  async getPPPData(@Param('countryCode') countryCode: string) {
    return this.pricingService.getPPPData(countryCode);
  }

  @Get('tax/:region')
  async getTaxRate(
    @Param('region') regionCode: string,
    @Query('country') countryCode?: string,
    @Query('state') stateCode?: string,
  ) {
    return this.taxService.getTaxRate(regionCode, countryCode, stateCode);
  }

  @Post('tax/calculate')
  async calculateTax(
    @Body() data: { amount: number; regionCode: string; taxType: 'VAT' | 'SALES' | 'INCOME' | 'CORPORATE' },
  ) {
    return this.taxService.calculateTax(data.amount, data.regionCode, data.taxType);
  }

  @Post('initialize-pricing')
  async initializeDefaultPricing() {
    await this.pricingService.initializeDefaultPricing();
    await this.taxService.initializeDefaultTaxRates();
    return { success: true, message: 'Default pricing and tax rates initialized' };
  }
}
