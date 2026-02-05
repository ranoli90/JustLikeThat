import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateKnowledgeTransferDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, KnowledgeTransfer as KT } from '../interfaces/maturity.interface';

@Injectable()
export class KnowledgeTransferService {
  create(dto: CreateKnowledgeTransferDto): KT {
    return dataStore.knowledgeTransferCreate({
      type: dto.type,
      title: dto.title,
      description: dto.description,
      status: 'draft',
      targetAudience: dto.targetAudience || [],
      objectives: dto.objectives || [],
      duration: dto.duration || 60,
      materials: dto.materials || [],
    });
  }

  findAll(query: PaginationQueryDto, filters?: {
    type?: string;
    status?: string;
    search?: string;
  }): PaginatedResponse<KT> {
    const { page = 1, limit = 20 } = query;
    let items = dataStore.knowledgeTransferFindMany();

    if (filters?.type) {
      items = items.filter(k => k.type === filters.type);
    }
    if (filters?.status) {
      items = items.filter(k => k.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(k =>
        k.title.toLowerCase().includes(search) ||
        k.description.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): KT {
    const kt = dataStore.knowledgeTransferFindUnique(id);
    if (!kt) {
      throw new NotFoundException(`Knowledge transfer with ID ${id} not found`);
    }
    return kt;
  }

  update(id: string, dto: Partial<CreateKnowledgeTransferDto>): KT {
    const existing = this.findById(id);
    return dataStore.knowledgeTransferUpdate(id, dto);
  }

  delete(id: string): void {
    this.findById(id);
    // In real implementation, would delete from database
  }

  schedule(id: string, schedule: Record<string, unknown>): KT {
    const kt = this.findById(id);
    return dataStore.knowledgeTransferUpdate(id, {
      status: 'scheduled',
      scheduledDate: schedule.date || new Date(),
    });
  }

  complete(id: string): KT {
    const kt = this.findById(id);
    return dataStore.knowledgeTransferUpdate(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  cancel(id: string): KT {
    const kt = this.findById(id);
    return dataStore.knowledgeTransferUpdate(id, { status: 'cancelled' });
  }

  getUpcoming(limit?: number): KT[] {
    const items = dataStore.knowledgeTransferFindMany();
    const upcoming = items
      .filter(k => k.status === 'scheduled' && k.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
      .slice(0, limit || 5);
    return upcoming;
  }

  getStats() {
    const items = dataStore.knowledgeTransferFindMany();

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalAttendees = 0;

    items.forEach(k => {
      byType[k.type] = (byType[k.type] || 0) + 1;
      byStatus[k.status] = (byStatus[k.status] || 0) + 1;
      totalAttendees += k.attendees?.length || 0;
    });

    return {
      total: items.length,
      byType,
      byStatus,
      completed: items.filter(k => k.status === 'completed').length,
      scheduled: items.filter(k => k.status === 'scheduled').length,
      inProgress: items.filter(k => k.status === 'in_progress').length,
      totalAttendees,
    };
  }
}
