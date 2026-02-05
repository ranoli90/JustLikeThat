import { Injectable, Logger } from '@nestjs/common';
import { LanguageDetectionResult } from '../interfaces/i18n.interface';

interface AcceptLanguageHeader {
  locale: string;
  quality: number;
}

@Injectable()
export class LanguageDetectionService {
  private readonly logger = new Logger(LanguageDetectionService.name);
  
  // Priority order for language detection
  private readonly priorityOrder: Array<'url' | 'user_preference' | 'browser' | 'ip'> = [
    'url',
    'user_preference',
    'browser',
    'ip',
  ];
  
  // Mapping of common language codes to our supported locales
  private readonly languageCodeMapping: Record<string, string> = {
    'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'en-au': 'en', 'en-ca': 'en', 'en-nz': 'en',
    'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh', 'zh-sg': 'zh',
    'es': 'es', 'es-es': 'es', 'es-mx': 'es', 'es-ar': 'es', 'es-co': 'es', 'es-cl': 'es',
    'hi': 'hi', 'hi-in': 'hi',
    'ar': 'ar', 'ar-sa': 'ar', 'ar-eg': 'ar', 'ar-ae': 'ar',
    'bn': 'bn', 'bn-bd': 'bn', 'bn-in': 'bn',
    'pt': 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',
    'ru': 'ru', 'ru-ru': 'ru',
    'ja': 'ja', 'ja-jp': 'ja',
    'de': 'de', 'de-de': 'de', 'de-at': 'de', 'de-ch': 'de',
    'fr': 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr', 'fr-ch': 'fr',
    'te': 'te', 'te-in': 'te',
    'mr': 'mr', 'mr-in': 'mr',
    'tr': 'tr', 'tr-tr': 'tr',
    'it': 'it', 'it-it': 'it',
    'ko': 'ko', 'ko-kr': 'ko',
    'ta': 'ta', 'ta-in': 'ta', 'ta-lk': 'ta',
    'vi': 'vi', 'vi-vn': 'vi',
    'ur': 'ur', 'ur-pk': 'ur', 'ur-in': 'ur',
    'gu': 'gu', 'gu-in': 'gu',
    'pl': 'pl', 'pl-pl': 'pl',
    'uk': 'uk', 'uk-ua': 'uk',
    'fa': 'fa', 'fa-ir': 'fa',
    'th': 'th', 'th-th': 'th',
    'ms': 'ms', 'ms-my': 'ms', 'ms-sg': 'ms',
    'nl': 'nl', 'nl-nl': 'nl', 'nl-be': 'nl',
    'el': 'el', 'el-gr': 'el',
    'he': 'he', 'he-il': 'he',
    'fi': 'fi', 'fi-fi': 'fi',
    'da': 'da', 'da-dk': 'da',
    'no': 'no', 'no-no': 'no', 'nb': 'no', 'nn': 'no',
    'sv': 'sv', 'sv-se': 'sv', 'sv-fi': 'sv',
    'cs': 'cs', 'cs-cz': 'cs',
    'ro': 'ro', 'ro-ro': 'ro',
    'hu': 'hu', 'hu-hu': 'hu',
    'id': 'id', 'id-id': 'id',
  };

  async detect(
    acceptLanguage?: string,
    urlLocale?: string,
    userPreference?: string,
    ipAddress?: string,
  ): Promise<LanguageDetectionResult> {
    const detections: LanguageDetectionResult[] = [];

    // 1. Check URL locale first (highest priority)
    if (urlLocale) {
      const mappedLocale = this.mapToSupportedLocale(urlLocale);
      if (mappedLocale) {
        detections.push({
          locale: mappedLocale,
          confidence: 1.0,
          source: 'url',
        });
      }
    }

    // 2. Check user preference
    if (userPreference) {
      const mappedLocale = this.mapToSupportedLocale(userPreference);
      if (mappedLocale) {
        detections.push({
          locale: mappedLocale,
          confidence: 0.95,
          source: 'user_preference',
        });
      }
    }

    // 3. Check Accept-Language header
    if (acceptLanguage) {
      const parsedLanguages = this.parseAcceptLanguage(acceptLanguage);
      for (const lang of parsedLanguages) {
        const mappedLocale = this.mapToSupportedLocale(lang.locale);
        if (mappedLocale) {
          detections.push({
            locale: mappedLocale,
            confidence: lang.quality,
            source: 'browser',
          });
          break; // Use first matched language
        }
      }
    }

    // 4. IP-based detection (placeholder - would use GeoIP service in production)
    if (ipAddress && detections.length === 0) {
      const localeFromIp = await this.detectFromIp(ipAddress);
      if (localeFromIp) {
        detections.push({
          locale: localeFromIp,
          confidence: 0.5,
          source: 'ip',
        });
      }
    }

    // Return the highest confidence detection
    if (detections.length > 0) {
      return detections.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // Default to English
    return {
      locale: 'en',
      confidence: 0.1,
      source: 'browser',
    };
  }

  private parseAcceptLanguage(header: string): AcceptLanguageHeader[] {
    if (!header) return [];

    return header
      .split(',')
      .map(part => {
        const [locale, qualityStr] = part.trim().split(';q=');
        const quality = qualityStr ? parseFloat(qualityStr) : 1.0;
        return {
          locale: locale.trim().toLowerCase(),
          quality: isNaN(quality) ? 1.0 : Math.max(0, Math.min(1, quality)),
        };
      })
      .sort((a, b) => b.quality - a.quality);
  }

  private mapToSupportedLocale(locale: string): string | null {
    if (!locale) return null;

    const normalizedLocale = locale.toLowerCase().replace(/_/g, '-');
    
    // Direct match
    if (this.languageCodeMapping[normalizedLocale]) {
      return this.languageCodeMapping[normalizedLocale];
    }

    // Extract language code only (e.g., 'en-US' -> 'en')
    const langCode = normalizedLocale.split('-')[0];
    if (this.languageCodeMapping[langCode]) {
      return this.languageCodeMapping[langCode];
    }

    // Check if locale is already a supported code
    if (this.languageCodeMapping[normalizedLocale]) {
      return normalizedLocale;
    }

    return null;
  }

  private async detectFromIp(ipAddress: string): Promise<string | null> {
    // This would typically use a GeoIP service
    // For now, return null (no IP-based detection)
    this.logger.debug(`IP-based detection for ${ipAddress} not implemented`);
    return null;
  }

  async getSupportedLanguages(): Promise<{ code: string; name: string; nativeName: string }[]> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
      { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย' },
      { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
      { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
      { code: 'ro', name: 'Romanian', nativeName: 'Română' },
      { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    ];
  }
}
