import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from './i18n.service';
import { LocaleService } from './locale.service';
import { TranslationService } from './translation.service';
import { LanguageDetectionService } from './language-detection.service';
import { CacheService } from './cache.service';

describe('I18nService', () => {
  let service: I18nService;
  let localeService: LocaleService;
  let translationService: TranslationService;
  let languageDetectionService: LanguageDetectionService;
  let cacheService: CacheService;

  const mockLocaleService = {
    getActiveLocales: jest.fn(),
    getLocaleByCode: jest.fn(),
    getFallbackLocale: jest.fn(),
    upsertLocale: jest.fn(),
  };

  const mockTranslationService = {
    getPublishedTranslations: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    incrementUsage: jest.fn(),
  };

  const mockLanguageDetectionService = {
    detect: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockLocaleService.getActiveLocales.mockResolvedValue([
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', isActive: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', isActive: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', isActive: true },
    ]);

    mockLocaleService.getLocaleByCode.mockResolvedValue({
      id: '1',
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
      isActive: true,
    });

    mockLocaleService.getFallbackLocale.mockResolvedValue('en');

    mockTranslationService.getPublishedTranslations.mockResolvedValue([
      { key: 'welcome', value: 'Welcome', localeId: '1', namespace: 'common' },
      { key: 'login', value: 'Login', localeId: '1', namespace: 'common' },
    ]);

    mockLanguageDetectionService.detect.mockResolvedValue({
      locale: 'en',
      confidence: 0.9,
      source: 'browser',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LanguageDetectionService, useValue: mockLanguageDetectionService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
    localeService = module.get<LocaleService>(LocaleService);
    translationService = module.get<TranslationService>(TranslationService);
    languageDetectionService = module.get<LanguageDetectionService>(LanguageDetectionService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableLocales', () => {
    it('should return active locales', async () => {
      const locales = await service.getAvailableLocales();
      expect(locales).toHaveLength(3);
      expect(mockLocaleService.getActiveLocales).toHaveBeenCalled();
    });
  });

  describe('getLocaleInfo', () => {
    it('should return locale info for valid code', async () => {
      const locale = await service.getLocaleInfo('en');
      expect(locale).toBeDefined();
      expect(locale?.code).toBe('en');
    });

    it('should return null for invalid code', async () => {
      mockLocaleService.getLocaleByCode.mockResolvedValue(null);
      const locale = await service.getLocaleInfo('invalid');
      expect(locale).toBeNull();
    });
  });

  describe('detectLanguage', () => {
    it('should call language detection service', async () => {
      const result = await service.detectLanguage('en-US', 'es', 'fr');
      expect(mockLanguageDetectionService.detect).toHaveBeenCalledWith('en-US', 'es', 'fr', undefined);
      expect(result.locale).toBe('en');
    });
  });

  describe('getRTLConfiguration', () => {
    it('should return RTL configuration for Arabic', () => {
      const config = service.getRTLConfiguration('ar');
      expect(config.isRTL).toBe(true);
      expect(config.direction).toBe('rtl');
      expect(config.textAlign).toBe('right');
    });

    it('should return LTR configuration for English', () => {
      const config = service.getRTLConfiguration('en');
      expect(config.isRTL).toBe(false);
      expect(config.direction).toBe('ltr');
      expect(config.textAlign).toBe('left');
    });

    it('should return LTR configuration for Spanish', () => {
      const config = service.getRTLConfiguration('es');
      expect(config.isRTL).toBe(false);
      expect(config.direction).toBe('ltr');
    });
  });

  describe('isRTLLocale', () => {
    it('should return true for Arabic', () => {
      expect(service.isRTLLocale('ar')).toBe(true);
    });

    it('should return true for Hebrew', () => {
      expect(service.isRTLLocale('he')).toBe(true);
    });

    it('should return true for Urdu', () => {
      expect(service.isRTLLocale('ur')).toBe(true);
    });

    it('should return false for English', () => {
      expect(service.isRTLLocale('en')).toBe(false);
    });

    it('should return false for Spanish', () => {
      expect(service.isRTLLocale('es')).toBe(false);
    });
  });

  describe('translate', () => {
    it('should translate a key with parameters', async () => {
      mockCacheService.get.mockResolvedValue({ welcome: 'Welcome, {{name}}!' });
      const result = await service.translate('welcome', 'en', { name: 'John' });
      expect(result).toBe('Welcome, John!');
    });

    it('should return key if translation not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockTranslationService.getPublishedTranslations.mockResolvedValue([]);
      const result = await service.translate('unknown.key', 'en');
      expect(result).toBe('unknown.key');
    });
  });

  describe('invalidateCache', () => {
    it('should clear all cache when no parameters provided', async () => {
      await service.invalidateCache();
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('*');
    });

    it('should clear specific locale cache', async () => {
      await service.invalidateCache('en');
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('en:*');
    });

    it('should clear specific namespace cache', async () => {
      await service.invalidateCache('en', 'common');
      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });
});
