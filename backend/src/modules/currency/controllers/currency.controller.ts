import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { CurrencyService } from '../services/currency.service';

@Controller('api/v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  async getAllRates(@Query('base') baseCurrency?: string) {
    return this.currencyService.getAllRates(baseCurrency || 'USD');
  }

  @Get('rates/:from/:to')
  async getExchangeRate(
    @Param('from') fromCurrency: string,
    @Param('to') toCurrency: string,
  ) {
    return this.currencyService.getExchangeRate(fromCurrency, toCurrency);
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
  ) {
    return this.currencyService.convert(
      parseFloat(amount),
      fromCurrency,
      toCurrency,
    );
  }

  @Get('currencies')
  async getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  @Get('currencies/:code')
  async getCurrency(@Param('code') code: string) {
    return this.currencyService.getCurrencyByCode(code);
  }

  @Post('rates/update')
  async updateExchangeRate(
    @Body() data: { fromCurrency: string; toCurrency: string; rate: number; source: string },
  ) {
    await this.currencyService.updateExchangeRate(
      data.fromCurrency,
      data.toCurrency,
      data.rate,
      data.source,
    );
    return { success: true };
  }

  @Post('initialize-rates')
  async initializeDefaultRates() {
    await this.currencyService.initializeDefaultRates();
    return { success: true, message: 'Default exchange rates initialized' };
  }
}
