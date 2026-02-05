import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateFAQDto, UpdateFAQDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, FAQ } from '../interfaces/maturity.interface';

@Injectable()
export class FAQService {
  create(dto: CreateFAQDto): FAQ {
    return dataStore.faqCreate({
      question: dto.question,
      answer: dto.answer,
      category: dto.category,
      keywords: dto.keywords || [],
      status: 'draft',
    });
  }

  findAll(query: PaginationQueryDto, filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): PaginatedResponse<FAQ> {
    const { page = 1, limit = 20 } = query;
    let faqs = dataStore.faqFindMany();

    if (filters?.category) {
      faqs = faqs.filter(f => f.category === filters.category);
    }
    if (filters?.status) {
      faqs = faqs.filter(f => f.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      faqs = faqs.filter(f =>
        f.question.toLowerCase().includes(search) ||
        f.answer.toLowerCase().includes(search) ||
        f.keywords.some(k => k.toLowerCase().includes(search))
      );
    }

    faqs.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));

    const total = faqs.length;
    const start = (page - 1) * limit;
    const data = faqs.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): FAQ {
    const faq = dataStore.faqFindUnique(id);
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  update(id: string, dto: UpdateFAQDto): FAQ {
    const existing = this.findById(id);
    return dataStore.faqUpdate(id, dto);
  }

  delete(id: string): void {
    this.findById(id);
    dataStore.faqDelete(id);
  }

  search(query: string, limit?: number): FAQ[] {
    const faqs = dataStore.faqFindMany();
    const search = query.toLowerCase();
    const results = faqs.filter(f =>
      f.question.toLowerCase().includes(search) ||
      f.answer.toLowerCase().includes(search) ||
      f.keywords.some(k => k.toLowerCase().includes(search))
    );
    return results.slice(0, limit || 10);
  }

  markHelpful(id: string): FAQ {
    const faq = this.findById(id);
    return dataStore.faqUpdate(id, { helpfulCount: (faq.helpfulCount || 0) + 1 });
  }

  markNotHelpful(id: string): FAQ {
    const faq = this.findById(id);
    return dataStore.faqUpdate(id, { notHelpfulCount: (faq.notHelpfulCount || 0) + 1 });
  }

  publish(id: string): FAQ {
    return dataStore.faqUpdate(id, { status: 'published' });
  }

  archive(id: string): FAQ {
    return dataStore.faqUpdate(id, { status: 'archived' });
  }

  getStats() {
    const faqs = dataStore.faqFindMany();
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalHelpful = 0;

    faqs.forEach(f => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      totalHelpful += f.helpfulCount || 0;
    });

    const mostHelpful = faqs.reduce((prev, current) =>
      (prev.helpfulCount || 0) > (current.helpfulCount || 0) ? prev : current
    , faqs[0] || {});

    return {
      total: faqs.length,
      byCategory,
      byStatus,
      totalHelpful,
      mostHelpful: mostHelpful.question ? { question: mostHelpful.question, count: mostHelpful.helpfulCount } : null,
    };
  }

  getCategories(): string[] {
    const faqs = dataStore.faqFindMany();
    const categories = new Set(faqs.map(f => f.category));
    return Array.from(categories);
  }
}
