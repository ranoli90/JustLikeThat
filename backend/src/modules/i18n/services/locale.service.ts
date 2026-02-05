import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Locale } from '../interfaces/i18n.interface';

@Injectable()
export class LocaleService {
  private readonly logger = new Logger(LocaleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertLocale(data: Partial<Locale>): Promise<Locale> {
    const existing = await this.prisma.locale.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      const updated = await this.prisma.locale.update({
        where: { id: existing.id },
        data: {
          name: data.name ?? existing.name,
          nativeName: data.nativeName ?? existing.nativeName,
          direction: data.direction ?? existing.direction,
          isActive: data.isActive ?? existing.isActive,
          isDefault: data.isDefault ?? existing.isDefault,
          fallbackLocale: data.fallbackLocale ?? existing.fallbackLocale,
          languageCode: data.languageCode ?? existing.languageCode,
          territoryCode: data.territoryCode,
          scriptCode: data.scriptCode,
          currency: data.currency,
          timezone: data.timezone,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
          numberFormat: data.numberFormat,
          pluralRules: data.pluralRules,
        },
      });
      return this.mapToLocale(updated);
    }

    const created = await this.prisma.locale.create({
      data: {
        code: data.code!,
        name: data.name!,
        nativeName: data.nativeName!,
        direction: data.direction || 'ltr',
        languageCode: data.languageCode || data.code!.split('-')[0],
        currency: data.currency,
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        numberFormat: data.numberFormat,
        pluralRules: data.pluralRules,
      },
    });
    return this.mapToLocale(created);
  }

  async getLocaleByCode(code: string): Promise<Locale | null> {
    const locale = await this.prisma.locale.findUnique({
      where: { code },
    });
    return locale ? this.mapToLocale(locale) : null;
  }

  async getLocaleById(id: string): Promise<Locale | null> {
    const locale = await this.prisma.locale.findUnique({
      where: { id },
    });
    return locale ? this.mapToLocale(locale) : null;
  }

  async getActiveLocales(): Promise<Locale[]> {
    const locales = await this.prisma.locale.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return locales.map(this.mapToLocale);
  }

  async getAllLocales(): Promise<Locale[]> {
    const locales = await this.prisma.locale.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return locales.map(this.mapToLocale);
  }

  async getDefaultLocale(): Promise<Locale | null> {
    const locale = await this.prisma.locale.findFirst({
      where: { isDefault: true, isActive: true },
    });
    return locale ? this.mapToLocale(locale) : null;
  }

  async getFallbackLocale(localeCode: string): Promise<string | null> {
    const locale = await this.getLocaleByCode(localeCode);
    if (locale?.fallbackLocale) {
      return locale.fallbackLocale;
    }
    
    // Fallback to English
    const englishLocale = await this.getLocaleByCode('en');
    return englishLocale ? 'en' : null;
  }

  async setDefaultLocale(code: string): Promise<void> {
    await this.prisma.locale.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    await this.prisma.locale.update({
      where: { code },
      data: { isDefault: true },
    });
  }

  async updateLocale(id: string, data: Partial<Locale>): Promise<Locale | null> {
    const locale = await this.prisma.locale.update({
      where: { id },
      data: {
        name: data.name,
        nativeName: data.nativeName,
        direction: data.direction,
        isActive: data.isActive,
        fallbackLocale: data.fallbackLocale,
        currency: data.currency,
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        numberFormat: data.numberFormat,
        pluralRules: data.pluralRules,
      },
    });
    return this.mapToLocale(locale);
  }

  async updateTranslationStats(id: string, count: number, coverage: number): Promise<void> {
    await this.prisma.locale.update({
      where: { id },
      data: {
        translationCount: count,
        coveragePercent: coverage,
      },
    });
  }

  async deleteLocale(id: string): Promise<void> {
    await this.prisma.locale.delete({
      where: { id },
    });
  }

  async getRTLLocales(): Promise<Locale[]> {
    const locales = await this.prisma.locale.findMany({
      where: { direction: 'rtl', isActive: true },
    });
    return locales.map(this.mapToLocale);
  }

  async getLocalesByRegion(region: string): Promise<Locale[]> {
    // This would need a region field in the schema
    // For now, return all active locales
    return this.getActiveLocales();
  }

  private mapToLocale(prismaLocale: {
    id: string;
    code: string;
    name: string;
    nativeName: string;
    direction: string;
    isActive: boolean;
    isDefault: boolean;
    fallbackLocale: string | null;
    languageCode: string;
    territoryCode: string | null;
    scriptCode: string | null;
    currency: string | null;
    timezone: string | null;
    dateFormat: string | null;
    timeFormat: string | null;
    numberFormat: any;
    pluralRules: string | null;
    translationCount: number;
    coveragePercent: number;
    createdAt: Date;
    updatedAt: Date;
  }): Locale {
    return {
      id: prismaLocale.id,
      code: prismaLocale.code,
      name: prismaLocale.name,
      nativeName: prismaLocale.nativeName,
      direction: prismaLocale.direction as 'ltr' | 'rtl',
      isActive: prismaLocale.isActive,
      isDefault: prismaLocale.isDefault,
      fallbackLocale: prismaLocale.fallbackLocale || undefined,
      languageCode: prismaLocale.languageCode,
      territoryCode: prismaLocale.territoryCode || undefined,
      scriptCode: prismaLocale.scriptCode || undefined,
      currency: prismaLocale.currency || undefined,
      timezone: prismaLocale.timezone || undefined,
      dateFormat: prismaLocale.dateFormat || undefined,
      timeFormat: prismaLocale.timeFormat || undefined,
      numberFormat: prismaLocale.numberFormat as Locale['numberFormat'],
      pluralRules: prismaLocale.pluralRules || undefined,
      translationCount: prismaLocale.translationCount,
      coveragePercent: prismaLocale.coveragePercent,
    };
  }
}
