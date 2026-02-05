import { Test, TestingModule } from '@nestjs/testing';
import { LanguageDetectionService } from './language-detection.service';

describe('LanguageDetectionService', () => {
  let service: LanguageDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LanguageDetectionService],
    }).compile();

    service = module.get<LanguageDetectionService>(LanguageDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detect', () => {
    it('should detect language from URL parameter', async () => {
      const result = await service.detect(undefined, 'es');
      expect(result.locale).toBe('es');
      expect(result.source).toBe('url');
      expect(result.confidence).toBe(1.0);
    });

    it('should detect language from user preference', async () => {
      const result = await service.detect(undefined, undefined, 'fr');
      expect(result.locale).toBe('fr');
      expect(result.source).toBe('user_preference');
      expect(result.confidence).toBe(0.95);
    });

    it('should detect language from Accept-Language header', async () => {
      const result = await service.detect('de, en;q=0.9, fr;q=0.8');
      expect(result.locale).toBe('de');
      expect(result.source).toBe('browser');
    });

    it('should prioritize URL over browser preference', async () => {
      const result = await service.detect('fr;q=0.9', 'de');
      expect(result.locale).toBe('de');
      expect(result.source).toBe('url');
    });

    it('should fallback to English when no match found', async () => {
      const result = await service.detect('xx, yy, zz');
      expect(result.locale).toBe('en');
    });

    it('should handle region-specific locales', async () => {
      const result = await service.detect('pt-BR');
      expect(result.locale).toBe('pt');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return 30+ supported languages', async () => {
      const languages = await service.getSupportedLanguages();
      expect(languages.length).toBeGreaterThanOrEqual(30);
    });

    it('should include common languages', async () => {
      const languages = await service.getSupportedLanguages();
      const codes = languages.map((l) => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('es');
      expect(codes).toContain('zh');
      expect(codes).toContain('ar');
      expect(codes).toContain('hi');
    });
  });
});
