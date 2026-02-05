import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { I18nService } from '../services/i18n.service';

@Controller('api/v1/i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('locales')
  async getLocales() {
    return this.i18nService.getAvailableLocales();
  }

  @Get('locales/:code')
  async getLocale(@Param('code') code: string) {
    return this.i18nService.getLocaleInfo(code);
  }

  @Get('translations/:locale')
  async getTranslations(
    @Param('locale') locale: string,
    @Query('namespaces') namespaces?: string,
  ) {
    const namespaceList = namespaces ? namespaces.split(',') : undefined;
    return this.i18nService.getTranslations(locale, namespaceList);
  }

  @Get('translate')
  async translate(
    @Query('key') key: string,
    @Query('locale') locale: string,
    @Query('namespace') namespace?: string,
    @Query('params') params?: string,
  ) {
    const parsedParams = params ? JSON.parse(params) : undefined;
    return this.i18nService.translate(key, locale, parsedParams, namespace);
  }

  @Post('translations')
  async createTranslation(
    @Body() data: { locale: string; namespace: string; key: string; value: string },
  ) {
    return this.i18nService.createTranslation(data);
  }

  @Put('translations/:id')
  async updateTranslation(
    @Param('id') id: string,
    @Body() data: { value: string; reviewedBy?: string },
  ) {
    return this.i18nService.updateTranslation(id, data.value, data.reviewedBy);
  }

  @Get('detect')
  async detectLanguage(
    @Query('accept-language') acceptLanguage?: string,
    @Query('url') urlLocale?: string,
    @Query('preference') userPreference?: string,
    @Query('ip') ipAddress?: string,
  ) {
    return this.i18nService.detectLanguage(acceptLanguage, urlLocale, userPreference, ipAddress);
  }

  @Post('switch')
  async switchLanguage(
    @Body() data: { fromLocale: string; toLocale: string },
  ) {
    return this.i18nService.switchLanguage(data.fromLocale, data.toLocale);
  }

  @Get('rtl/:locale')
  async getRTLConfiguration(@Param('locale') locale: string) {
    return this.i18nService.getRTLConfiguration(locale);
  }

  @Post('invalidate-cache')
  async invalidateCache(
    @Body() data: { locale?: string; namespace?: string },
  ) {
    await this.i18nService.invalidateCache(data.locale, data.namespace);
    return { success: true };
  }
}
