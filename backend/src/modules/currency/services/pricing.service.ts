import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyService } from './currency.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly currencyService: CurrencyService,
  ) {}

  async getLocalizedPrice(
    planId: string,
    targetCurrency: string,
    regionCode?: string,
  ): Promise<{
    originalPrice: number;
    originalCurrency: string;
    localizedPrice: number;
    localizedCurrency: string;
    pppAdjustedPrice: number;
    pppMultiplier: number;
    taxAmount: number;
    taxRate: number;
    totalPrice: number;
    formattedPrice: string;
  }> {
    // Get plan pricing
    const regionPricing = await this.prisma.regionPricing.findFirst({
      where: {
        region: regionCode || 'NA',
      },
    });

    if (!regionPricing) {
      throw new Error(`Pricing not found for region ${regionCode}`);
    }

    const { basePrice, currency, pppMultiplier, taxRate } = regionPricing;

    // Convert to target currency
    const { convertedAmount: localizedPrice } = await this.currencyService.convert(
      basePrice,
      currency,
      targetCurrency,
    );

    // Apply PPP adjustment
    const pppAdjustedPrice = basePrice * (pppMultiplier || 1);

    // Calculate tax
    const taxAmount = localizedPrice * (taxRate || 0);
    const totalPrice = localizedPrice + taxAmount;

    // Get currency symbol
    const currencyInfo = this.currencyService.getCurrencyByCode(targetCurrency);
    const symbol = currencyInfo?.symbol || targetCurrency;

    return {
      originalPrice: basePrice,
      originalCurrency: currency,
      localizedPrice: Math.round(localizedPrice * 100) / 100,
      localizedCurrency: targetCurrency,
      pppAdjustedPrice: Math.round(pppAdjustedPrice * 100) / 100,
      pppMultiplier: pppMultiplier || 1,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate: taxRate || 0,
      totalPrice: Math.round(totalPrice * 100) / 100,
      formattedPrice: `${symbol}${localizedPrice.toFixed(2)}`,
    };
  }

  async getPPPData(countryCode: string): Promise<{
    countryCode: string;
    pppFactor: number;
    currency: string;
    year: number;
  } | null> {
    const ppp = await this.prisma.purchasingPowerParity.findFirst({
      where: { countryCode },
      orderBy: { year: 'desc' },
    });

    return ppp ? {
      countryCode: ppp.countryCode,
      pppFactor: ppp.pppFactor,
      currency: ppp.currency,
      year: ppp.year,
    } : null;
  }

  async initializeDefaultPricing(): Promise<void> {
    const defaultPricing = [
      { region: 'NA', basePrice: 29.99, currency: 'USD', pppMultiplier: 1.0, taxRate: 0.08, features: { jobAlerts: true, resumeBuilder: true, coverLetters: 5 } },
      { region: 'EU', basePrice: 24.99, currency: 'EUR', pppMultiplier: 0.92, taxRate: 0.21, features: { jobAlerts: true, resumeBuilder: true, coverLetters: 5 } },
      { region: 'APAC', basePrice: 19.99, currency: 'USD', pppMultiplier: 0.65, taxRate: 0.10, features: { jobAlerts: true, resumeBuilder: true, coverLetters: 5 } },
      { region: 'LATAM', basePrice: 14.99, currency: 'USD', pppMultiplier: 0.45, taxRate: 0.15, features: { jobAlerts: true, resumeBuilder: true, coverLetters: 5 } },
      { region: 'MEA', basePrice: 17.99, currency: 'USD', pppMultiplier: 0.55, taxRate: 0.05, features: { jobAlerts: true, resumeBuilder: true, coverLetters: 5 } },
    ];

    for (const pricing of defaultPricing) {
      await this.prisma.regionPricing.upsert({
        where: { id: `pricing-${pricing.region}` },
        update: pricing,
        create: {
          id: `pricing-${pricing.region}`,
          ...pricing,
        },
      });
    }

    // Initialize PPP data
    const pppData = [
      { countryCode: 'US', currency: 'USD', pppFactor: 1.0, gdpPerCapita: 76330, year: 2024 },
      { countryCode: 'DE', currency: 'EUR', pppFactor: 0.94, gdpPerCapita: 52825, year: 2024 },
      { countryCode: 'GB', currency: 'GBP', pppFactor: 0.89, gdpPerCapita: 46875, year: 2024 },
      { countryCode: 'JP', currency: 'JPY', pppFactor: 105.0, gdpPerCapita: 34340, year: 2024 },
      { countryCode: 'CN', currency: 'CNY', pppFactor: 4.12, gdpPerCapita: 12720, year: 2024 },
      { countryCode: 'IN', currency: 'INR', pppFactor: 23.14, gdpPerCapita: 2484, year: 2024 },
      { countryCode: 'BR', currency: 'BRL', pppFactor: 2.65, gdpPerCapita: 8917, year: 2024 },
      { countryCode: 'AU', currency: 'AUD', pppFactor: 1.43, gdpPerCapita: 64674, year: 2024 },
    ];

    for (const ppp of pppData) {
      await this.prisma.purchasingPowerParity.upsert({
        where: { countryCode_year: { countryCode: ppp.countryCode, year: ppp.year } },
        update: ppp,
        create: ppp,
      });
    }
  }
}
