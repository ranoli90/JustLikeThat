import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Translation, TranslationStatus, TranslationSearchParams } from '../interfaces/i18n.interface';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    localeId: string;
    namespace: string;
    key: string;
    value: string;
    isPlural?: boolean;
    pluralIndex?: number;
    pluralValues?: Record<string, string>;
    sourceLocale?: string;
    sourceValue?: string;
    machineTranslated?: boolean;
    status?: TranslationStatus;
  }): Promise<Translation | null> {
    const translation = await this.prisma.translation.create({
      data: {
        localeId: data.localeId,
        namespace: data.namespace,
        key: data.key,
        value: data.value,
        isPlural: data.isPlural || false,
        pluralIndex: data.pluralIndex,
        pluralValues: data.pluralValues,
        sourceLocale: data.sourceLocale,
        sourceValue: data.sourceValue,
        machineTranslated: data.machineTranslated || false,
        status: data.status || TranslationStatus.DRAFT,
      },
    });
    return this.mapToTranslation(translation);
  }

  async update(id: string, data: Partial<{
    value: string;
    valueHtml: string;
    isPlural: boolean;
    pluralIndex: number;
    pluralValues: Record<string, string>;
    reviewedBy: string;
    reviewedAt: Date;
    approvedBy: string;
    approvedAt: Date;
    status: TranslationStatus;
    comment: string;
  }>): Promise<Translation | null> {
    const translation = await this.prisma.translation.update({
      where: { id },
      data: {
        value: data.value,
        valueHtml: data.valueHtml,
        isPlural: data.isPlural,
        pluralIndex: data.pluralIndex,
        pluralValues: data.pluralValues,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        status: data.status,
        comment: data.comment,
      },
    });
    return this.mapToTranslation(translation);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.translation.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Translation | null> {
    const translation = await this.prisma.translation.findUnique({
      where: { id },
    });
    return translation ? this.mapToTranslation(translation) : null;
  }

  async findByKey(localeId: string, namespace: string, key: string): Promise<Translation | null> {
    const translation = await this.prisma.translation.findUnique({
      where: {
        localeId_namespace_key: {
          localeId,
          namespace,
          key,
        },
      },
    });
    return translation ? this.mapToTranslation(translation) : null;
  }

  async getPublishedTranslations(locale: string, namespace?: string): Promise<Translation[]> {
    // First get locale ID
    const localeRecord = await this.prisma.locale.findUnique({
      where: { code: locale },
    });

    if (!localeRecord) {
      return [];
    }

    const translations = await this.prisma.translation.findMany({
      where: {
        localeId: localeRecord.id,
        status: TranslationStatus.PUBLISHED,
        ...(namespace ? { namespace } : {}),
      },
    });
    return translations.map(this.mapToTranslation);
  }

  async search(params: TranslationSearchParams): Promise<{ translations: Translation[]; total: number }> {
    const where: any = {};

    if (params.locale) {
      const locale = await this.prisma.locale.findUnique({
        where: { code: params.locale },
      });
      if (locale) {
        where.localeId = locale.id;
      }
    }

    if (params.namespace) {
      where.namespace = params.namespace;
    }

    if (params.key) {
      where.key = { contains: params.key };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.machineTranslated !== undefined) {
      where.machineTranslated = params.machineTranslated;
    }

    const [translations, total] = await Promise.all([
      this.prisma.translation.findMany({
        where,
        take: params.limit || 100,
        skip: params.offset || 0,
        orderBy: { translatedAt: 'desc' },
      }),
      this.prisma.translation.count({ where }),
    ]);

    return {
      translations: translations.map(this.mapToTranslation),
      total,
    };
  }

  async incrementUsage(key: string, locale: string, namespace: string): Promise<void> {
    const localeRecord = await this.prisma.locale.findUnique({
      where: { code: locale },
    });

    if (!localeRecord) {
      return;
    }

    await this.prisma.translation.updateMany({
      where: {
        localeId: localeRecord.id,
        namespace,
        key,
      },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  async getTranslationStats(localeId: string): Promise<{
    total: number;
    published: number;
    reviewed: number;
    draft: number;
    coverage: number;
  }> {
    const [total, published, reviewed, draft] = await Promise.all([
      this.prisma.translation.count({ where: { localeId } }),
      this.prisma.translation.count({ where: { localeId, status: TranslationStatus.PUBLISHED } }),
      this.prisma.translation.count({ where: { localeId, status: { in: [TranslationStatus.REVIEWED, TranslationStatus.APPROVED] } } }),
      this.prisma.translation.count({ where: { localeId, status: { in: [TranslationStatus.DRAFT, TranslationStatus.PENDING_REVIEW] } } }),
    ]);

    return {
      total,
      published,
      reviewed,
      draft,
      coverage: total > 0 ? (published / total) * 100 : 0,
    };
  }

  async bulkUpsert(localeId: string, namespace: string, translations: { key: string; value: string }[]): Promise<void> {
    for (const { key, value } of translations) {
      await this.prisma.translation.upsert({
        where: {
          localeId_namespace_key: {
            localeId,
            namespace,
            key,
          },
        },
        update: { value },
        create: {
          localeId,
          namespace,
          key,
          value,
          status: TranslationStatus.DRAFT,
        },
      });
    }
  }

  async approve(id: string, approvedBy: string): Promise<Translation | null> {
    return this.update(id, {
      approvedBy,
      approvedAt: new Date(),
      status: TranslationStatus.APPROVED,
    });
  }

  async publish(id: string): Promise<Translation | null> {
    return this.update(id, {
      status: TranslationStatus.PUBLISHED,
    });
  }

  async archive(id: string): Promise<Translation | null> {
    return this.update(id, {
      status: TranslationStatus.ARCHIVED,
    });
  }

  private mapToTranslation(prismaTranslation: any): Translation {
    return {
      id: prismaTranslation.id,
      localeId: prismaTranslation.localeId,
      namespace: prismaTranslation.namespace,
      key: prismaTranslation.key,
      value: prismaTranslation.value,
      valueHtml: prismaTranslation.valueHtml,
      isPlural: prismaTranslation.isPlural,
      pluralIndex: prismaTranslation.pluralIndex,
      pluralValues: prismaTranslation.pluralValues,
      translatedAt: prismaTranslation.translatedAt,
      reviewedBy: prismaTranslation.reviewedBy,
      reviewedAt: prismaTranslation.reviewedAt,
      approvedBy: prismaTranslation.approvedBy,
      approvedAt: prismaTranslation.approvedAt,
      sourceLocale: prismaTranslation.sourceLocale,
      sourceValue: prismaTranslation.sourceValue,
      machineTranslated: prismaTranslation.machineTranslated,
      translationMemoryMatch: prismaTranslation.translationMemoryMatch,
      usageCount: prismaTranslation.usageCount,
      lastUsedAt: prismaTranslation.lastUsedAt,
      tenantId: prismaTranslation.tenantId,
      status: prismaTranslation.status as TranslationStatus,
      comment: prismaTranslation.comment,
    };
  }
}
