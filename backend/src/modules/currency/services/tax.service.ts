import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTaxRate(regionCode: string, countryCode?: string, stateCode?: string): Promise<{
    regionCode: string;
    vatRate: number | null;
    salesTaxRate: number | null;
    incomeTaxRate: number | null;
    corporateTaxRate: number | null;
    effectiveFrom: Date;
  } | null> {
    const taxRate = await this.prisma.taxRate.findFirst({
      where: {
        regionCode,
        ...(countryCode && { countryCode }),
        ...(stateCode && { stateCode }),
      },
    });

    if (!taxRate) {
      // Return default rates
      return {
        regionCode,
        vatRate: 0,
        salesTaxRate: 0,
        incomeTaxRate: 0,
        corporateTaxRate: 0,
        effectiveFrom: new Date(),
      };
    }

    return {
      regionCode: taxRate.regionCode,
      vatRate: taxRate.vatRate,
      salesTaxRate: taxRate.salesTaxRate,
      incomeTaxRate: taxRate.incomeTaxRate,
      corporateTaxRate: taxRate.corporateTaxRate,
      effectiveFrom: taxRate.effectiveFrom,
    };
  }

  async calculateTax(
    amount: number,
    regionCode: string,
    taxType: 'VAT' | 'SALES' | 'INCOME' | 'CORPORATE',
  ): Promise<{
    grossAmount: number;
    taxAmount: number;
    netAmount: number;
    taxRate: number;
  }> {
    const taxData = await this.getTaxRate(regionCode);

    let taxRate = 0;
    switch (taxType) {
      case 'VAT':
        taxRate = taxData?.vatRate || 0;
        break;
      case 'SALES':
        taxRate = taxData?.salesTaxRate || 0;
        break;
      case 'INCOME':
        taxRate = taxData?.incomeTaxRate || 0;
        break;
      case 'CORPORATE':
        taxRate = taxData?.corporateTaxRate || 0;
        break;
    }

    const taxAmount = amount * taxRate;
    const grossAmount = amount + taxAmount;

    return {
      grossAmount: Math.round(grossAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      netAmount: Math.round(amount * 100) / 100,
      taxRate,
    };
  }

  async initializeDefaultTaxRates(): Promise<void> {
    const defaultTaxRates = [
      { regionCode: 'NA', countryCode: 'US', vatRate: null, salesTaxRate: 0.08, incomeTaxRate: 0.22, corporateTaxRate: 0.21, effectiveFrom: new Date() },
      { regionCode: 'NA', countryCode: 'CA', vatRate: 0.13, salesTaxRate: 0.13, incomeTaxRate: 0.26, corporateTaxRate: 0.15, effectiveFrom: new Date() },
      { regionCode: 'EU', countryCode: 'DE', vatRate: 0.19, salesTaxRate: 0.19, incomeTaxRate: 0.42, corporateTaxRate: 0.30, effectiveFrom: new Date() },
      { regionCode: 'EU', countryCode: 'GB', vatRate: 0.20, salesTaxRate: 0.20, incomeTaxRate: 0.45, corporateTaxRate: 0.25, effectiveFrom: new Date() },
      { regionCode: 'EU', countryCode: 'FR', vatRate: 0.20, salesTaxRate: 0.20, incomeTaxRate: 0.45, corporateTaxRate: 0.25, effectiveFrom: new Date() },
      { regionCode: 'APAC', countryCode: 'JP', vatRate: 0.10, salesTaxRate: 0.10, incomeTaxRate: 0.45, corporateTaxRate: 0.23, effectiveFrom: new Date() },
      { regionCode: 'APAC', countryCode: 'AU', vatRate: 0.10, salesTaxRate: 0.10, incomeTaxRate: 0.47, corporateTaxRate: 0.30, effectiveFrom: new Date() },
      { regionCode: 'APAC', countryCode: 'IN', vatRate: 0.18, salesTaxRate: 0.18, incomeTaxRate: 0.30, corporateTaxRate: 0.25, effectiveFrom: new Date() },
      { regionCode: 'LATAM', countryCode: 'BR', vatRate: 0.17, salesTaxRate: 0.17, incomeTaxRate: 0.27, corporateTaxRate: 0.34, effectiveFrom: new Date() },
      { regionCode: 'LATAM', countryCode: 'MX', vatRate: 0.16, salesTaxRate: 0.16, incomeTaxRate: 0.35, corporateTaxRate: 0.30, effectiveFrom: new Date() },
      { regionCode: 'MEA', countryCode: 'AE', vatRate: 0.05, salesTaxRate: 0.05, incomeTaxRate: 0.0, corporateTaxRate: 0.0, effectiveFrom: new Date() },
      { regionCode: 'MEA', countryCode: 'ZA', vatRate: 0.15, salesTaxRate: 0.15, incomeTaxRate: 0.45, corporateTaxRate: 0.28, effectiveFrom: new Date() },
    ];

    for (const rate of defaultTaxRates) {
      await this.prisma.taxRate.upsert({
        where: {
          id: `tax-${rate.regionCode}-${rate.countryCode}`,
        },
        update: rate,
        create: {
          id: `tax-${rate.regionCode}-${rate.countryCode}`,
          ...rate,
          effectiveFrom: new Date(),
        },
      });
    }
  }
}
