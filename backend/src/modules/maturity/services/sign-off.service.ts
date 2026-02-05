import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateSignOffDto, SignOffActionDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, SignOff } from '../interfaces/maturity.interface';

@Injectable()
export class SignOffService {
  create(dto: CreateSignOffDto): SignOff {
    return dataStore.signOffCreate({
      stakeholderType: dto.stakeholderType,
      stakeholderId: dto.stakeholderId,
      stakeholderName: dto.stakeholderName,
      area: dto.area,
      status: 'pending',
      comments: undefined,
      evidence: dto.evidence || {},
      conditions: dto.conditions || [],
    });
  }

  findAll(query: PaginationQueryDto, filters?: {
    stakeholderType?: string;
    area?: string;
    status?: string;
  }): PaginatedResponse<SignOff> {
    const { page = 1, limit = 20 } = query;
    let signoffs = dataStore.signOffFindMany();

    if (filters?.stakeholderType) {
      signoffs = signoffs.filter(s => s.stakeholderType === filters.stakeholderType);
    }
    if (filters?.area) {
      signoffs = signoffs.filter(s => s.area === filters.area);
    }
    if (filters?.status) {
      signoffs = signoffs.filter(s => s.status === filters.status);
    }

    signoffs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = signoffs.length;
    const start = (page - 1) * limit;
    const data = signoffs.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): SignOff {
    const signoff = dataStore.signOffFindUnique(id);
    if (!signoff) {
      throw new NotFoundException(`Sign-off with ID ${id} not found`);
    }
    return signoff;
  }

  approve(id: string, dto: SignOffActionDto): SignOff {
    return dataStore.signOffUpdate(id, {
      status: dto.status === 'approved' ? 'approved' : dto.status,
      comments: dto.comments,
      evidence: dto.evidence,
      approvedAt: dto.status === 'approved' ? new Date() : undefined,
    });
  }

  reject(id: string, dto: SignOffActionDto): SignOff {
    return dataStore.signOffUpdate(id, {
      status: 'rejected',
      comments: dto.comments,
    });
  }

  requestRevision(id: string, comments: string): SignOff {
    return dataStore.signOffUpdate(id, {
      status: 'needs_revision',
      comments,
    });
  }

  getStats() {
    const signoffs = dataStore.signOffFindMany();

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byArea: Record<string, number> = {};

    signoffs.forEach(s => {
      byType[s.stakeholderType] = (byType[s.stakeholderType] || 0) + 1;
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      byArea[s.area] = (byArea[s.area] || 0) + 1;
    });

    const approved = signoffs.filter(s => s.status === 'approved').length;
    const pending = signoffs.filter(s => s.status === 'pending').length;

    return {
      total: signoffs.length,
      byType,
      byStatus,
      byArea,
      approved,
      pending,
      approvalRate: signoffs.length > 0 ? (approved / signoffs.length) * 100 : 0,
    };
  }

  getOverallStatus() {
    const signoffs = dataStore.signOffFindMany();
    
    const requiredAreas = ['performance', 'security', 'compliance', 'functionality', 'overall'];
    const requiredTypes = ['executive', 'engineering', 'security', 'compliance'];

    const approvedAreas = new Set(signoffs.filter(s => s.status === 'approved').map(s => s.area));
    const approvedTypes = new Set(signoffs.filter(s => s.status === 'approved').map(s => s.stakeholderType));

    const allAreasApproved = requiredAreas.every(area => approvedAreas.has(area));
    const allTypesApproved = requiredTypes.every(type => approvedTypes.has(type));

    return {
      readyForLaunch: allAreasApproved && allTypesApproved,
      approvedAreas: Array.from(approvedAreas),
      pendingAreas: requiredAreas.filter(a => !approvedAreas.has(a)),
      approvedTypes: Array.from(approvedTypes),
      pendingTypes: requiredTypes.filter(t => !approvedTypes.has(t)),
    };
  }
}
