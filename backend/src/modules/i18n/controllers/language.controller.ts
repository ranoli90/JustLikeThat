import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { LocaleService } from '../services/locale.service';
import { LanguageDetectionService } from '../services/language-detection.service';

@Controller('api/v1/languages')
export class LanguageController {
  constructor(
    private readonly localeService: LocaleService,
    private readonly languageDetectionService: LanguageDetectionService,
  ) {}

  @Get()
  async getLanguages() {
    return this.languageDetectionService.getSupportedLanguages();
  }

  @Get('locales')
  async getLocales() {
    return this.localeService.getActiveLocales();
  }

  @Get('locales/all')
  async getAllLocales() {
    return this.localeService.getAllLocales();
  }

  @Get('locales/:code')
  async getLocale(@Param('code') code: string) {
    return this.localeService.getLocaleByCode(code);
  }

  @Get('locales/id/:id')
  async getLocaleById(@Param('id') id: string) {
    return this.localeService.getLocaleById(id);
  }

  @Get('default')
  async getDefaultLocale() {
    return this.localeService.getDefaultLocale();
  }

  @Post('locales')
  async createLocale(
    @Body() data: {
      code: string;
      name: string;
      nativeName: string;
      direction?: 'ltr' | 'rtl';
      languageCode?: string;
      currency?: string;
      timezone?: string;
    },
  ) {
    return this.localeService.upsertLocale(data);
  }

  @Put('locales/:id')
  async updateLocale(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      nativeName?: string;
      direction?: string;
      isActive?: boolean;
      fallbackLocale?: string;
      currency?: string;
      timezone?: string;
      dateFormat?: string;
      timeFormat?: string;
    },
  ) {
    return this.localeService.updateLocale(id, data);
  }

  @Put('locales/:id/default')
  async setDefaultLocale(@Param('id') id: string) {
    const locale = await this.localeService.getLocaleById(id);
    if (locale) {
      await this.localeService.setDefaultLocale(locale.code);
      return { success: true };
    }
    return { error: 'Locale not found' };
  }

  @Delete('locales/:id')
  async deleteLocale(@Param('id') id: string) {
    await this.localeService.deleteLocale(id);
    return { success: true };
  }

  @Get('rtl')
  async getRTLLocales() {
    return this.localeService.getRTLLocales();
  }

  @Post('detect')
  async detectLanguage(
    @Body() data: {
      acceptLanguage?: string;
      urlLocale?: string;
      userPreference?: string;
      ipAddress?: string;
    },
  ) {
    return this.languageDetectionService.detect(
      data.acceptLanguage,
      data.urlLocale,
      data.userPreference,
      data.ipAddress,
    );
  }
}
