import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateReleasePlanDto, ReleaseApprovalDto, RollbackReleaseDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, ReleasePlan } from '../interfaces/maturity.interface';

@Injectable()
export class ReleaseManagementService {
  create(dto: CreateReleasePlanDto): ReleasePlan {
    return dataStore.releasePlanCreate({
      version: dto.version,
      name: dto.name,
      description: dto.description,
      status: 'planning',
      scheduledDate: dto.scheduledDate,
      releaseNotes: dto.releaseNotes,
      changelog: dto.changelog,
      riskLevel: dto.riskLevel,
      rollbackPlan: dto.rollbackPlan,
    });
  }

  findAll(query: PaginationQueryDto, filters?: {
    status?: string;
    riskLevel?: string;
    search?: string;
  }): PaginatedResponse<ReleasePlan> {
    const { page = 1, limit = 20 } = query;
    let releases = dataStore.releasePlanFindMany();

    if (filters?.status) {
      releases = releases.filter(r => r.status === filters.status);
    }
    if (filters?.riskLevel) {
      releases = releases.filter(r => r.riskLevel === filters.riskLevel);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      releases = releases.filter(r =>
        r.name.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search)
      );
    }

    releases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = releases.length;
    const start = (page - 1) * limit;
    const data = releases.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): ReleasePlan & { approvals: any[]; deployments: any[] } {
    const release = dataStore.releasePlanFindUnique(id);
    if (!release) {
      throw new NotFoundException(`Release plan with ID ${id} not found`);
    }
    const approvals = dataStore.releaseApprovalFindMany().filter(a => a.releaseId === id);
    return { ...release, approvals, deployments: [] };
  }

  update(id: string, dto: Partial<CreateReleasePlanDto>): ReleasePlan {
    this.findById(id);
    return dataStore.releasePlanUpdate(id, dto);
  }

  delete(id: string): void {
    this.findById(id);
    // Note: In real implementation, would delete from database
  }

  addApproval(releaseId: string, dto: ReleaseApprovalDto): any {
    return dataStore.releaseApprovalCreate({
      releaseId,
      approverRole: dto.approverRole,
      approverId: dto.approverId,
      status: 'pending',
      comments: dto.comments,
    });
  }

  approve(releaseId: string, approvalId: string, status: 'approved' | 'rejected', comments?: string): any {
    const approval = dataStore.releaseApprovalUpdate(approvalId, {
      status,
      comments,
      approvedAt: status === 'approved' ? new Date() : undefined,
    });

    // Check if all approvals are complete
    const approvals = dataStore.releaseApprovalFindMany().filter(a => a.releaseId === releaseId);
    const allApproved = approvals.every(a => a.status === 'approved');

    if (allApproved) {
      dataStore.releasePlanUpdate(releaseId, { status: 'scheduled' });
    }

    return approval;
  }

  deploy(releaseId: string, environment: string, deployedBy: string): any {
    const deployment = {
      id: crypto.randomUUID(),
      releaseId,
      environment,
      status: 'in_progress',
      deployedBy,
      startedAt: new Date(),
    };

    // Simulate deployment
    setTimeout(() => {
      dataStore.releasePlanUpdate(releaseId, { status: 'released', releasedAt: new Date() });
    }, 100);

    return deployment;
  }

  rollback(releaseId: string, dto: RollbackReleaseDto): any {
    const release = this.findById(releaseId);

    const rollback = {
      id: crypto.randomUUID(),
      releaseId,
      reason: dto.reason,
      rolledBackBy: dto.rolledBackBy,
      status: 'success',
    };

    dataStore.releasePlanUpdate(releaseId, { status: 'rolled_back' });

    return rollback;
  }

  release(id: string): ReleasePlan {
    return dataStore.releasePlanUpdate(id, { status: 'released', releasedAt: new Date() });
  }

  getStats() {
    const releases = dataStore.releasePlanFindMany();

    const byStatus: Record<string, number> = {};
    releases.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    return {
      total: releases.length,
      byStatus,
      released: releases.filter(r => r.status === 'released').length,
    };
  }
}
