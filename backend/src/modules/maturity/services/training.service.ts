import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateTrainingMaterialDto, UpdateTrainingProgressDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, TrainingMaterial, TrainingProgress } from '../interfaces/maturity.interface';

@Injectable()
export class TrainingService {
  createMaterial(dto: CreateTrainingMaterialDto): TrainingMaterial {
    const materials = dataStore.trainingMaterialFindMany();
    const maxOrder = materials.reduce((max, m) => Math.max(max, m.order || 0), 0);

    return dataStore.trainingMaterialCreate({
      type: dto.type,
      title: dto.title,
      description: dto.description,
      content: dto.content,
      duration: dto.duration,
      difficulty: dto.difficulty,
      category: dto.category,
      tags: dto.tags || [],
      status: 'draft',
      order: maxOrder + 1,
      thumbnail: dto.thumbnail,
    });
  }

  findAllMaterials(query: PaginationQueryDto, filters?: {
    type?: string;
    category?: string;
    difficulty?: string;
    status?: string;
    search?: string;
  }): PaginatedResponse<TrainingMaterial> {
    const { page = 1, limit = 20 } = query;
    let materials = dataStore.trainingMaterialFindMany();

    if (filters?.type) {
      materials = materials.filter(m => m.type === filters.type);
    }
    if (filters?.category) {
      materials = materials.filter(m => m.category === filters.category);
    }
    if (filters?.difficulty) {
      materials = materials.filter(m => m.difficulty === filters.difficulty);
    }
    if (filters?.status) {
      materials = materials.filter(m => m.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      materials = materials.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search)
      );
    }

    materials.sort((a, b) => (a.order || 0) - (b.order || 0));

    const total = materials.length;
    const start = (page - 1) * limit;
    const data = materials.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findMaterialById(id: string): TrainingMaterial {
    const material = dataStore.trainingMaterialFindUnique(id);
    if (!material) {
      throw new NotFoundException(`Training material with ID ${id} not found`);
    }
    return material;
  }

  updateMaterial(id: string, dto: Partial<CreateTrainingMaterialDto>): TrainingMaterial {
    this.findMaterialById(id);
    return dataStore.trainingMaterialUpdate(id, dto);
  }

  deleteMaterial(id: string): void {
    this.findMaterialById(id);
  }

  getUserProgress(userId: string, query: PaginationQueryDto): PaginatedResponse<TrainingProgress> {
    const { page = 1, limit = 50 } = query;
    let progress = dataStore.trainingProgressFindMany().filter(p => p.userId === userId);

    progress.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());

    const total = progress.length;
    const start = (page - 1) * limit;
    const data = progress.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  updateProgress(userId: string, materialId: string, dto: UpdateTrainingProgressDto): TrainingProgress {
    this.findMaterialById(materialId);

    const existing = dataStore.trainingProgressFindMany().find(
      p => p.userId === userId && p.materialId === materialId
    );

    if (existing) {
      return dataStore.trainingProgressUpdate(existing.id, {
        progress: Math.max(existing.progress || 0, dto.progress),
        timeSpent: (existing.timeSpent || 0) + dto.timeSpent,
        status: dto.status === 'completed' ? 'completed' : (existing.status === 'completed' ? 'completed' : dto.status),
        completedAt: dto.status === 'completed' ? new Date() : existing.completedAt,
      });
    }

    return dataStore.trainingProgressCreate({
      userId,
      materialId,
      progress: dto.progress,
      timeSpent: dto.timeSpent,
      status: dto.status,
    });
  }

  publishMaterial(id: string): TrainingMaterial {
    return dataStore.trainingMaterialUpdate(id, { status: 'published' });
  }

  getStats() {
    const materials = dataStore.trainingMaterialFindMany().filter(m => m.status === 'published');
    const progress = dataStore.trainingProgressFindMany().filter(p => p.status === 'completed');

    const totalHours = materials.reduce((acc, m) => acc + (m.duration || 0), 0) / 60;

    const byType: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};

    materials.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      byDifficulty[m.difficulty] = (byDifficulty[m.difficulty] || 0) + 1;
    });

    return {
      totalMaterials: materials.length,
      totalHours: Math.round(totalHours * 10) / 10,
      byType,
      byDifficulty,
      completions: progress.length,
    };
  }
}
