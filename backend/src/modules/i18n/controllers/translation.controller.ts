import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TranslationService } from '../services/translation.service';
import { TranslationStatus } from '../interfaces/i18n.interface';

@Controller('api/v1/i18n/translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async searchTranslations(
    @Query('locale') locale?: string,
    @Query('namespace') namespace?: string,
    @Query('key') key?: string,
    @Query('status') status?: TranslationStatus,
    @Query('machineTranslated') machineTranslated?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.translationService.search({
      locale,
      namespace,
      key,
      status,
      machineTranslated: machineTranslated ? machineTranslated === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  async getTranslation(@Param('id') id: string) {
    return this.translationService.findById(id);
  }

  @Post()
  async createTranslation(
    @Body() data: {
      localeId: string;
      namespace: string;
      key: string;
      value: string;
      isPlural?: boolean;
      pluralIndex?: number;
      pluralValues?: Record<string, string>;
      sourceLocale?: string;
      sourceValue?: string;
    },
  ) {
    return this.translationService.create(data);
  }

  @Put(':id')
  async updateTranslation(
    @Param('id') id: string,
    @Body() data: {
      value?: string;
      valueHtml?: string;
      isPlural?: boolean;
      pluralIndex?: number;
      pluralValues?: Record<string, string>;
      reviewedBy?: string;
      approvedBy?: string;
      status?: TranslationStatus;
      comment?: string;
    },
  ) {
    return this.translationService.update(id, data);
  }

  @Delete(':id')
  async deleteTranslation(@Param('id') id: string) {
    await this.translationService.delete(id);
    return { success: true };
  }

  @Post(':id/approve')
  async approveTranslation(
    @Param('id') id: string,
    @Body() data: { approvedBy: string },
  ) {
    return this.translationService.approve(id, data.approvedBy);
  }

  @Post(':id/publish')
  async publishTranslation(@Param('id') id: string) {
    return this.translationService.publish(id);
  }

  @Post(':id/archive')
  async archiveTranslation(@Param('id') id: string) {
    return this.translationService.archive(id);
  }

  @Get('stats/:localeId')
  async getTranslationStats(@Param('localeId') localeId: string) {
    return this.translationService.getTranslationStats(localeId);
  }

  @Post('bulk')
  async bulkUpsert(
    @Body() data: { localeId: string; namespace: string; translations: { key: string; value: string }[] },
  ) {
    await this.translationService.bulkUpsert(data.localeId, data.namespace, data.translations);
    return { success: true };
  }
}
