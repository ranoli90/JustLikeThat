import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  minorUnit: number;
  isActive: boolean;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  updatedAt: Date;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  // Supported currencies with metadata
  private readonly currencies: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', minorUnit: 2, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', minorUnit: 2, isActive: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', minorUnit: 2, isActive: true },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', minorUnit: 0, isActive: true },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', minorUnit: 2, isActive: true },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnit: 2, isActive: true },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', minorUnit: 2, isActive: true },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', minorUnit: 2, isActive: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', minorUnit: 2, isActive: true },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', minorUnit: 2, isActive: true },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', minorUnit: 0, isActive: true },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', minorUnit: 2, isActive: true },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', minorUnit: 2, isActive: true },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', minorUnit: 2, isActive: true },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', minorUnit: 2, isActive: true },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', minorUnit: 2, isActive: true },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', minorUnit: 2, isActive: true },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', minorUnit: 2, isActive: true },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', minorUnit: 2, isActive: true },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', minorUnit: 2, isActive: true },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', minorUnit: 2, isActive: true },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', minorUnit: 2, isActive: true },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', minorUnit: 2, isActive: true },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', minorUnit: 2, isActive: true },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', minorUnit: 2, isActive: true },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', minorUnit: 2, isActive: true },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', minorUnit: 2, isActive: true },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', minorUnit: 0, isActive: true },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', minorUnit: 2, isActive: true },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', minorUnit: 0, isActive: true },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$', minorUnit: 0, isActive: true },
    { code: 'COP', name: 'Colombian Peso', symbol: '$', minorUnit: 0, isActive: true },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$', minorUnit: 2, isActive: true },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', minorUnit: 2, isActive: true },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', minorUnit: 0, isActive: true },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', minorUnit: 2, isActive: true },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', minorUnit: 2, isActive: true },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', minorUnit: 2, isActive: true },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', minorUnit: 2, isActive: true },
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', minorUnit: 2, isActive: true },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei', minorUnit: 2, isActive: true },
    { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', minorUnit: 2, isActive: true },
    { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', minorUnit: 0, isActive: true },
    { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', minorUnit: 2, isActive: true },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', minorUnit: 2, isActive: true },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', minorUnit: 2, isActive: true },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    // Check database first
    const cachedRate = await this.prisma.currencyRate.findUnique({
      where: {
        fromCurrency_toCurrency: { fromCurrency, toCurrency },
      },
    });

    if (cachedRate) {
      return {
        fromCurrency: cachedRate.fromCurrency,
        toCurrency: cachedRate.toCurrency,
        rate: cachedRate.rate,
        source: cachedRate.source,
        updatedAt: cachedRate.updatedAt,
      };
    }

    // Fallback to default rates
    const rate = this.getDefaultRate(fromCurrency, toCurrency);
    if (rate) {
      return {
        fromCurrency,
        toCurrency,
        rate,
        source: 'default',
        updatedAt: new Date(),
      };
    }

    return null;
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{ convertedAmount: number; rate: number }> {
    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, rate: 1 };
    }

    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    if (!exchangeRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency}/${toCurrency}`);
    }

    const convertedAmount = amount * exchangeRate.rate;
    return { convertedAmount, rate: exchangeRate.rate };
  }

  async getAllRates(baseCurrency: string = 'USD'): Promise<ExchangeRate[]> {
    const rates: ExchangeRate[] = [];

    for (const currency of this.currencies) {
      if (currency.code !== baseCurrency) {
        const rate = await this.getExchangeRate(baseCurrency, currency.code);
        if (rate) {
          rates.push(rate);
        }
      }
    }

    return rates;
  }

  async updateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    source: string,
  ): Promise<void> {
    await this.prisma.currencyRate.upsert({
      where: {
        fromCurrency_toCurrency: { fromCurrency, toCurrency },
      },
      update: { rate, source, updatedAt: new Date() },
      create: {
        fromCurrency,
        toCurrency,
        rate,
        source,
      },
    });
  }

  async initializeDefaultRates(): Promise<void> {
    // Initialize with default rates (would normally fetch from API)
    const defaultRates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      CNY: 7.24,
      INR: 83.12,
      BRL: 4.97,
      CAD: 1.36,
      AUD: 1.53,
      CHF: 0.88,
      KRW: 1298.50,
      MXN: 17.15,
      SGD: 1.34,
      HKD: 7.82,
    };

    const baseCurrency = 'USD';
    for (const [currency, rate] of Object.entries(defaultRates)) {
      if (currency !== baseCurrency) {
        await this.updateExchangeRate(baseCurrency, currency, rate, 'default');
      }
    }
  }

  getCurrencies(): Currency[] {
    return this.currencies;
  }

  getCurrencyByCode(code: string): Currency | undefined {
    return this.currencies.find(c => c.code === code);
  }

  private getDefaultRate(from: string, to: string): number | null {
    // Simplified default rates
    const ratesToUSD: Record<string, number> = {
      USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, CNY: 7.24,
      INR: 83.12, BRL: 4.97, CAD: 1.36, AUD: 1.53, CHF: 0.88,
      KRW: 1298.50, MXN: 17.15, SGD: 1.34, HKD: 7.82,
    };

    const fromRate = ratesToUSD[from];
    const toRate = ratesToUSD[to];

    if (fromRate && toRate) {
      return toRate / fromRate;
    }

    return null;
  }
}
