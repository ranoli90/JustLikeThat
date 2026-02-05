import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateDocumentationDto, UpdateDocumentationDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, Documentation } from '../interfaces/maturity.interface';

@Injectable()
export class DocumentationService {
  create(dto: CreateDocumentationDto): Documentation {
    return dataStore.documentationCreate({
      category: dto.category,
      title: dto.title,
      content: dto.content,
      version: dto.version,
      author: dto.author,
      status: 'draft',
      tags: dto.tags || [],
    });
  }

  findAll(query: PaginationQueryDto, filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): PaginatedResponse<Documentation> {
    const { page = 1, limit = 20 } = query;
    let docs = dataStore.documentationFindMany();

    if (filters?.category) {
      docs = docs.filter(d => d.category === filters.category);
    }
    if (filters?.status) {
      docs = docs.filter(d => d.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      docs = docs.filter(d => 
        d.title.toLowerCase().includes(search) ||
        d.content.toLowerCase().includes(search) ||
        d.tags.some((t: string) => t.toLowerCase().includes(search))
      );
    }

    // Sort by createdAt desc
    docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = docs.length;
    const start = (page - 1) * limit;
    const data = docs.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): Documentation {
    const doc = dataStore.documentationFindUnique(id);
    if (!doc) {
      throw new NotFoundException(`Documentation with ID ${id} not found`);
    }
    // Increment view count
    dataStore.documentationUpdate(id, { views: (doc.views || 0) + 1 });
    return doc;
  }

  findByCategory(category: string, query: PaginationQueryDto): PaginatedResponse<Documentation> {
    return this.findAll(query, { category });
  }

  update(id: string, dto: UpdateDocumentationDto): Documentation {
    const existing = this.findById(id);
    return dataStore.documentationUpdate(id, {
      ...dto,
      lastUpdated: new Date(),
    });
  }

  delete(id: string): void {
    this.findById(id);
    dataStore.documentationDelete(id);
  }

  markHelpful(id: string): Documentation {
    const doc = this.findById(id);
    return dataStore.documentationUpdate(id, { helpfulCount: (doc.helpfulCount || 0) + 1 });
  }

  publish(id: string): Documentation {
    return dataStore.documentationUpdate(id, { status: 'published' });
  }

  submitForReview(id: string): Documentation {
    return dataStore.documentationUpdate(id, { status: 'review' });
  }

  getStats() {
    const docs = dataStore.documentationFindMany();
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalViews = 0;

    docs.forEach(d => {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      totalViews += d.views || 0;
    });

    return {
      total: docs.length,
      byCategory,
      byStatus,
      totalViews,
    };
  }
}
