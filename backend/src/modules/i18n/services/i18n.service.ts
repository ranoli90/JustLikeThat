import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locale, Translation, TranslationStatus, LanguageDetectionResult, RTLConfiguration, LanguageSwitchResult } from '../interfaces/i18n.interface';
import { LocaleService } from './locale.service';
import { TranslationService } from './translation.service';
import { LanguageDetectionService } from './language-detection.service';
import { CacheService } from './cache.service';

@Injectable()
export class I18nService implements OnModuleInit {
  private readonly logger = new Logger(I18nService.name);
  private translationCache: Map<string, Map<string, Record<string, string>>> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(
    private readonly localeService: LocaleService,
    private readonly translationService: TranslationService,
    private readonly languageDetectionService: LanguageDetectionService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    await this.initializeLocales();
    await this.warmUpCache();
  }

  private async initializeLocales(): Promise<void> {
    const defaultLocales: Partial<Locale>[] = [
      // Top 30 languages
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', languageCode: 'en', currency: 'USD', timezone: 'UTC' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', languageCode: 'zh', currency: 'CNY', timezone: 'Asia/Shanghai' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', languageCode: 'es', currency: 'EUR', timezone: 'Europe/Madrid' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', languageCode: 'hi', currency: 'INR', timezone: 'Asia/Kolkata' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', languageCode: 'ar', currency: 'SAR', timezone: 'Asia/Riyadh' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', languageCode: 'bn', currency: 'BDT', timezone: 'Asia/Dhaka' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', languageCode: 'pt', currency: 'BRL', timezone: 'America/Sao_Paulo' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', languageCode: 'ru', currency: 'RUB', timezone: 'Europe/Moscow' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', languageCode: 'ja', currency: 'JPY', timezone: 'Asia/Tokyo' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', languageCode: 'de', currency: 'EUR', timezone: 'Europe/Berlin' },
      { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', languageCode: 'fr', currency: 'EUR', timezone: 'Europe/Paris' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', languageCode: 'te', currency: 'INR', timezone: 'Asia/Kolkata' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', languageCode: 'mr', currency: 'INR', timezone: 'Asia/Kolkata' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', languageCode: 'tr', currency: 'TRY', timezone: 'Europe/Istanbul' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', languageCode: 'it', currency: 'EUR', timezone: 'Europe/Rome' },
      { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', languageCode: 'ko', currency: 'KRW', timezone: 'Asia/Seoul' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', languageCode: 'ta', currency: 'INR', timezone: 'Asia/Kolkata' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', languageCode: 'vi', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', languageCode: 'ur', currency: 'PKR', timezone: 'Asia/Karachi' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', languageCode: 'gu', currency: 'INR', timezone: 'Asia/Kolkata' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr', languageCode: 'pl', currency: 'PLN', timezone: 'Europe/Warsaw' },
      { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr', languageCode: 'uk', currency: 'UAH', timezone: 'Europe/Kiev' },
      { code: 'fa', name: 'Persian', nativeName: 'فارسی', direction: 'rtl', languageCode: 'fa', currency: 'IRR', timezone: 'Asia/Tehran' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr', languageCode: 'th', currency: 'THB', timezone: 'Asia/Bangkok' },
      { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr', languageCode: 'ms', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', languageCode: 'nl', currency: 'EUR', timezone: 'Europe/Amsterdam' },
      { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr', languageCode: 'el', currency: 'EUR', timezone: 'Europe/Athens' },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', languageCode: 'he', currency: 'ILS', timezone: 'Asia/Jerusalem' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi', direction: 'ltr', languageCode: 'fi', currency: 'EUR', timezone: 'Europe/Helsinki' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk', direction: 'ltr', languageCode: 'da', currency: 'DKK', timezone: 'Europe/Copenhagen' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk', direction: 'ltr', languageCode: 'no', currency: 'NOK', timezone: 'Europe/Oslo' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska', direction: 'ltr', languageCode: 'sv', currency: 'SEK', timezone: 'Europe/Stockholm' },
      { code: 'cs', name: 'Czech', nativeName: 'Čeština', direction: 'ltr', languageCode: 'cs', currency: 'CZK', timezone: 'Europe/Prague' },
      { code: 'ro', name: 'Romanian', nativeName: 'Română', direction: 'ltr', languageCode: 'ro', currency: 'RON', timezone: 'Europe/Bucharest' },
      { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', direction: 'ltr', languageCode: 'hu', currency: 'HUF', timezone: 'Europe/Budapest' },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', languageCode: 'id', currency: 'IDR', timezone: 'Asia/Jakarta' },
    ];

    for (const locale of defaultLocales) {
      await this.localeService.upsertLocale(locale);
    }

    this.logger.log(`Initialized ${defaultLocales.length} locales`);
  }

  private async warmUpCache(): Promise<void> {
    const locales = await this.localeService.getActiveLocales();
    for (const locale of locales) {
      await this.loadTranslationsIntoCache(locale.code);
    }
    this.logger.log('Translation cache warmed up');
  }

  async getTranslation(locale: string, key: string, namespace: string = 'common'): Promise<string | null> {
    const cacheKey = `${locale}:${namespace}`;
    
    // Check cache first
    let namespaceCache = this.translationCache.get(cacheKey);
    if (!namespaceCache) {
      namespaceCache = await this.loadTranslationsIntoCache(locale, namespace);
    }

    if (namespaceCache && namespaceCache[key]) {
      // Update usage stats
      await this.translationService.incrementUsage(key, locale, namespace);
      return namespaceCache[key];
    }

    // Try fallback locale
    const fallbackLocale = await this.localeService.getFallbackLocale(locale);
    if (fallbackLocale && fallbackLocale !== locale) {
      return this.getTranslation(fallbackLocale, key, namespace);
    }

    // Return key as fallback
    return key;
  }

  async getTranslations(locale: string, namespaces?: string[]): Promise<Record<string, Record<string, string>>> {
    const result: Record<string, Record<string, string>> = {};
    
    const targetNamespaces = namespaces || ['common', 'auth', 'validation', 'errors', 'buttons'];
    
    for (const namespace of targetNamespaces) {
      const cacheKey = `${locale}:${namespace}`;
      let namespaceCache = this.translationCache.get(cacheKey);
      
      if (!namespaceCache) {
        namespaceCache = await this.loadTranslationsIntoCache(locale, namespace);
      }
      
      if (namespaceCache) {
        result[namespace] = namespaceCache;
      }
    }

    return result;
  }

  private async loadTranslationsIntoCache(locale: string, namespace?: string): Promise<Map<string, string>> {
    const translations = await this.translationService.getPublishedTranslations(locale, namespace);
    const cacheKey = `${locale}:${namespace || 'all'}`;
    const translationMap = new Map<string, string>();

    for (const translation of translations) {
      translationMap.set(translation.key, translation.value);
    }

    if (!this.translationCache.has(cacheKey)) {
      this.translationCache.set(cacheKey, translationMap);
    }

    return translationMap;
  }

  async detectLanguage(
    acceptLanguage?: string,
    urlLocale?: string,
    userPreference?: string,
    ipAddress?: string,
  ): Promise<LanguageDetectionResult> {
    return this.languageDetectionService.detect(
      acceptLanguage,
      urlLocale,
      userPreference,
      ipAddress,
    );
  }

  async switchLanguage(
    fromLocale: string,
    toLocale: string,
  ): Promise<LanguageSwitchResult> {
    const startTime = Date.now();
    const startLocale = fromLocale;

    // Preload translations for new locale
    await this.getTranslations(toLocale);

    const switchTime = Date.now() - startTime;
    const cached = this.translationCache.has(`${toLocale}:common`);

    // Count loaded translations
    let translationsLoaded = 0;
    this.translationCache.forEach((namespaceCache, key) => {
      if (key.startsWith(`${toLocale}:`)) {
        translationsLoaded += namespaceCache.size;
      }
    });

    return {
      fromLocale: startLocale,
      toLocale,
      switchTime,
      cached,
      translationsLoaded,
    };
  }

  getRTLConfiguration(locale: string): RTLConfiguration {
    const isRTL = this.isRTLLocale(locale);

    return {
      isRTL,
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
      startEdge: isRTL ? 'right' : 'left',
      endEdge: isRTL ? 'left' : 'right',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginStart: isRTL ? 'marginRight' : 'marginLeft',
      marginEnd: isRTL ? 'marginLeft' : 'marginRight',
      paddingStart: isRTL ? 'paddingRight' : 'paddingLeft',
      paddingEnd: isRTL ? 'paddingLeft' : 'paddingRight',
      borderRadius: isRTL ? 'borderTopRightRadius' : 'borderTopLeftRadius',
    };
  }

  isRTLLocale(locale: string): boolean {
    const rtlLocales = ['ar', 'he', 'ur', 'fa'];
    return rtlLocales.some(l => locale.startsWith(l));
  }

  async translate(
    key: string,
    locale: string,
    params?: Record<string, string | number>,
    namespace?: string,
  ): Promise<string> {
    const translation = await this.getTranslation(locale, key, namespace);
    
    if (!translation || translation === key) {
      return key;
    }

    // Replace parameters
    if (params) {
      let result = translation;
      for (const [param, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }
      return result;
    }

    return translation;
  }

  async t(
    key: string,
    locale: string,
    params?: Record<string, string | number>,
    namespace?: string,
  ): Promise<string> {
    return this.translate(key, locale, params, namespace);
  }

  async getAvailableLocales(): Promise<Locale[]> {
    return this.localeService.getActiveLocales();
  }

  async getLocaleInfo(locale: string): Promise<Locale | null> {
    return this.localeService.getLocaleByCode(locale);
  }

  async updateTranslation(
    id: string,
    value: string,
    reviewedBy?: string,
  ): Promise<Translation | null> {
    return this.translationService.update(id, { value, reviewedBy, reviewedAt: new Date() });
  }

  async createTranslation(data: {
    locale: string;
    namespace: string;
    key: string;
    value: string;
  }): Promise<Translation | null> {
    const locale = await this.localeService.getLocaleByCode(data.locale);
    if (!locale) {
      throw new Error(`Locale ${data.locale} not found`);
    }

    return this.translationService.create({
      ...data,
      localeId: locale.id,
      status: TranslationStatus.DRAFT,
    });
  }

  async invalidateCache(locale?: string, namespace?: string): Promise<void> {
    if (locale && namespace) {
      this.translationCache.delete(`${locale}:${namespace}`);
    } else if (locale) {
      const keysToDelete: string[] = [];
      this.translationCache.forEach((_, key) => {
        if (key.startsWith(`${locale}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.translationCache.delete(key));
    } else {
      this.translationCache.clear();
    }
  }
}
