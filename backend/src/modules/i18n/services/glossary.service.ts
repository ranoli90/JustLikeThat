import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlossaryTerm } from '../interfaces/i18n.interface';

@Injectable()
export class GlossaryService {
  private readonly logger = new Logger(GlossaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTerm(data: {
    term: string;
    definition: string;
    description?: string;
    locale: string;
    translations?: Record<string, string>;
    partOfSpeech?: string;
    domain?: string;
    usageExamples?: string[];
    parentId?: string;
    relatedTerms?: string[];
  }): Promise<GlossaryTerm> {
    const term = await this.prisma.glossary.create({
      data: {
        term: data.term,
        definition: data.definition,
        description: data.description,
        locale: data.locale,
        translations: data.translations,
        partOfSpeech: data.partOfSpeech,
        domain: data.domain,
        usageExamples: data.usageExamples,
        parentId: data.parentId,
        relatedTerms: data.relatedTerms || [],
      },
    });
    return this.mapToGlossaryTerm(term);
  }

  async updateTerm(id: string, data: Partial<{
    term: string;
    definition: string;
    description: string;
    translations: Record<string, string>;
    partOfSpeech: string;
    domain: string;
    usageExamples: string[];
    relatedTerms: string[];
    isApproved: boolean;
    approvedBy: string;
  }>): Promise<GlossaryTerm | null> {
    const term = await this.prisma.glossary.update({
      where: { id },
      data: {
        term: data.term,
        definition: data.definition,
        description: data.description,
        translations: data.translations,
        partOfSpeech: data.partOfSpeech,
        domain: data.domain,
        usageExamples: data.usageExamples,
        relatedTerms: data.relatedTerms,
        isApproved: data.isApproved,
        approvedBy: data.approvedBy,
      },
    });
    return this.mapToGlossaryTerm(term);
  }

  async deleteTerm(id: string): Promise<void> {
    await this.prisma.glossary.delete({
      where: { id },
    });
  }

  async getTermById(id: string): Promise<GlossaryTerm | null> {
    const term = await this.prisma.glossary.findUnique({
      where: { id },
    });
    return term ? this.mapToGlossaryTerm(term) : null;
  }

  async findByTerm(term: string, locale: string): Promise<GlossaryTerm | null> {
    const termRecord = await this.prisma.glossary.findUnique({
      where: {
        term_locale: {
          term,
          locale,
        },
      },
    });
    return termRecord ? this.mapToGlossaryTerm(termRecord) : null;
  }

  async searchTerms(params: {
    locale?: string;
    domain?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ terms: GlossaryTerm[]; total: number }> {
    const where: any = {};

    if (params.locale) {
      where.locale = params.locale;
    }

    if (params.domain) {
      where.domain = params.domain;
    }

    if (params.query) {
      where.OR = [
        { term: { contains: params.query } },
        { definition: { contains: params.query } },
      ];
    }

    const [terms, total] = await Promise.all([
      this.prisma.glossary.findMany({
        where,
        take: params.limit || 100,
        skip: params.offset || 0,
        orderBy: { term: 'asc' },
      }),
      this.prisma.glossary.count({ where }),
    ]);

    return {
      terms: terms.map(this.mapToGlossaryTerm),
      total,
    };
  }

  async getTermsByDomain(domain: string, locale: string): Promise<GlossaryTerm[]> {
    const terms = await this.prisma.glossary.findMany({
      where: { domain, locale },
      orderBy: { term: 'asc' },
    });
    return terms.map(this.mapToGlossaryTerm);
  }

  async approveTerm(id: string, approvedBy: string): Promise<GlossaryTerm | null> {
    return this.updateTerm(id, { isApproved: true, approvedBy });
  }

  async getTranslationForTerm(termId: string, targetLocale: string): Promise<string | null> {
    const term = await this.getTermById(termId);
    if (!term) return null;
    
    // If target locale matches the term's locale
    if (term.locale === targetLocale) {
      return term.definition;
    }
    
    // Check translations
    if (term.translations) {
      return term.translations[targetLocale] || null;
    }
    
    return null;
  }

  async bulkCreate(terms: Array<{
    term: string;
    definition: string;
    description?: string;
    locale: string;
    translations?: Record<string, string>;
    partOfSpeech?: string;
    domain?: string;
  }>): Promise<void> {
    await this.prisma.glossary.createMany({
      data: terms.map(t => ({
        term: t.term,
        definition: t.definition,
        description: t.description,
        locale: t.locale,
        translations: t.translations,
        partOfSpeech: t.partOfSpeech,
        domain: t.domain,
      })),
    });
  }

  async getStats(): Promise<{ totalTerms: number; byLocale: Record<string, number>; byDomain: Record<string, number> }> {
    const totalTerms = await this.prisma.glossary.count();

    const byLocale = await this.prisma.glossary.groupBy({
      by: ['locale'],
      _count: true,
    });

    const byDomain = await this.prisma.glossary.groupBy({
      by: ['domain'],
      _count: true,
    });

    const localeCounts: Record<string, number> = {};
    for (const entry of byLocale) {
      localeCounts[entry.locale] = entry._count;
    }

    const domainCounts: Record<string, number> = {};
    for (const entry of byDomain) {
      domainCounts[entry.domain || 'general'] = entry._count;
    }

    return {
      totalTerms,
      byLocale: localeCounts,
      byDomain: domainCounts,
    };
  }

  private mapToGlossaryTerm(prismaTerm: any): GlossaryTerm {
    return {
      id: prismaTerm.id,
      term: prismaTerm.term,
      definition: prismaTerm.definition,
      description: prismaTerm.description,
      locale: prismaTerm.locale,
      translations: prismaTerm.translations,
      partOfSpeech: prismaTerm.partOfSpeech,
      domain: prismaTerm.domain,
      usageExamples: prismaTerm.usageExamples,
      isApproved: prismaTerm.isApproved,
      approvedBy: prismaTerm.approvedBy,
      parentId: prismaTerm.parentId,
      relatedTerms: prismaTerm.relatedTerms || [],
    };
  }
}
