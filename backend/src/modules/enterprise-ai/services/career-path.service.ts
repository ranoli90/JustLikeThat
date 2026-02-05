import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareerPath } from '../entities/career-path.entity';

export interface CareerPathInput {
  userId: string;
  currentRole: string;
  targetRole: string;
  currentSkills: string[];
  experienceYears: number;
  timeline?: 'aggressive' | 'moderate' | 'relaxed';
}

@Injectable()
export class CareerPathService {
  private readonly logger = new Logger(CareerPathService.name);

  constructor(
    @InjectRepository(CareerPath)
    private readonly careerPathRepository: Repository<CareerPath>,
  ) {}

  async generateCareerPath(input: CareerPathInput): Promise<any> {
    this.logger.log(`Generating career path for user ${input.userId}`);

    const skillGaps = ['leadership', 'technical leadership', 'mentoring'];
    const milestones = [
      { title: 'Build Core Competencies', timeline: 'months 1-3', skills: input.currentSkills.slice(0, 2) },
      { title: 'Expand Impact', timeline: 'months 4-6', skills: ['project management'] },
      { title: 'Develop Leadership', timeline: 'months 7-12', skills: ['team leadership', 'mentoring'] },
    ];

    const skillGapAnalysis = {
      gaps: skillGaps.map(gap => ({ skill: gap, priority: 7 })),
      strengths: input.currentSkills.map(s => ({ skill: s, level: 'proficient' })),
    };

    const speedMultiplier = input.timeline === 'aggressive' ? 0.7 : input.timeline === 'relaxed' ? 1.3 : 1;
    const timeline = {
      estimatedDuration: `${Math.round(milestones.length * 3 * speedMultiplier)} months`,
      totalMilestones: milestones.length,
    };

    const careerPath = this.careerPathRepository.create({
      userId: input.userId,
      currentRole: input.currentRole,
      targetRole: input.targetRole,
      skillGapAnalysis,
      milestones,
      certifications: [],
      timeline,
      progress: 0,
    });

    const saved = await this.careerPathRepository.save(careerPath);
    return { id: saved.id, milestones: saved.milestones, timeline: saved.timeline };
  }

  async getCareerPath(id: string): Promise<CareerPath | null> {
    return this.careerPathRepository.findOne({ where: { id } });
  }

  async getCareerPathsByUser(userId: string): Promise<CareerPath[]> {
    return this.careerPathRepository.find({ where: { userId } });
  }
}
