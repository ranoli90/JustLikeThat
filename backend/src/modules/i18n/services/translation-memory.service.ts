import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';

@Injectable()
export class TranslationMemoryService {
  private readonly logger = new Logger(TranslationMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findMatch(
    sourceText: string,
    sourceLocale: string,
    targetLocale: string,
  ): Promise<{ match: any; matchType: string; qualityScore: number } | null> {
    const cacheKey = `tm:${sourceLocale}:${targetLocale}:${this.hashText(sourceText)}`;
    
    // Check cache first
    const cached = await this.cacheService.get<{ match: any; matchType: string; qualityScore: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Find exact match
    const exactMatch = await this.prisma.translationMemory.findFirst({
      where: {
        sourceLocale,
        targetLocale,
        sourceText,
        matchType: 'EXACT' as const,
      },
    });

    if (exactMatch) {
      const result = {
        match: exactMatch,
        matchType: 'EXACT' as const,
        qualityScore: exactMatch.qualityScore,
      };
      await this.cacheService.set(cacheKey, result, 3600);
      return result;
    }

    // Find fuzzy match (placeholder - would use full-text search in production)
    const fuzzyMatch = await this.prisma.translationMemory.findFirst({
      where: {
        sourceLocale,
        targetLocale,
        matchType: 'FUZZY',
      },
      orderBy: { qualityScore: 'desc' },
    });

    if (fuzzyMatch) {
      return { match: fuzzyMatch, matchType: 'FUZZY', qualityScore: fuzzyMatch.qualityScore };
    }

    return null;
  }

  async addEntry(
    sourceLocale: string,
    sourceText: string,
    targetLocale: string,
    targetText: string,
    namespace?: string,
    context?: string,
  ): Promise<void> {
    await this.prisma.translationMemory.create({
      data: {
        sourceLocale,
        sourceText,
        targetLocale,
        targetText,
        namespace,
        context,
        matchType: 'EXACT',
        qualityScore: 1.0,
      },
    });

    // Invalidate relevant cache entries
    await this.cacheService.deletePattern(`tm:${sourceLocale}:${targetLocale}:*`);
  }

  async bulkAdd(entries: Array<{
    sourceLocale: string;
    sourceText: string;
    targetLocale: string;
    targetText: string;
    namespace?: string;
    context?: string;
  }>): Promise<void> {
    await this.prisma.translationMemory.createMany({
      data: entries.map(entry => ({
        sourceLocale: entry.sourceLocale,
        sourceText: entry.sourceText,
        targetLocale: entry.targetLocale,
        targetText: entry.targetText,
        namespace: entry.namespace,
        context: entry.context,
        matchType: 'EXACT' as const,
        qualityScore: 1.0,
      })),
    });
  }

  async updateUsage(id: string): Promise<void> {
    await this.prisma.translationMemory.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async getStats(): Promise<{ totalEntries: number; byLanguagePair: Record<string, number> }> {
    const totalEntries = await this.prisma.translationMemory.count();
    
    const entriesByPair = await this.prisma.translationMemory.groupBy({
      by: ['sourceLocale', 'targetLocale'],
      _count: true,
    });

    const byLanguagePair: Record<string, number> = {};
    for (const entry of entriesByPair) {
      const key = `${entry.sourceLocale}-${entry.targetLocale}`;
      byLanguagePair[key] = entry._count;
    }

    return { totalEntries, byLanguagePair };
  }

  private hashText(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
