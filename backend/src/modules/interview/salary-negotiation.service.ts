import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryNegotiation } from '../../entities/salary-negotiation.entity';

export interface CreateNegotiationDto {
  userId: string;
  company: string;
  position: string;
  targetSalary?: number;
  minimumAcceptable?: number;
  marketRange?: { min: number; max: number; currency: string; source: string };
  benefits?: { type: string; value: number; notes: string }[];
}

export interface NegotiationStrategy {
  approach: string;
  talkingPoints: string[];
  counterOfferGuidance: string[];
  timingAdvice: string;
  redFlags: string[];
}

@Injectable()
export class SalaryNegotiationService {
  constructor(
    @InjectRepository(SalaryNegotiation)
    private readonly negotiationRepository: Repository<SalaryNegotiation>,
  ) {}

  /**
   * Creates a new salary negotiation preparation
   */
  async createNegotiation(dto: CreateNegotiationDto): Promise<SalaryNegotiation> {
    const negotiation = this.negotiationRepository.create({
      userId: dto.userId,
      company: dto.company,
      position: dto.position,
      targetSalary: dto.targetSalary,
      minimumAcceptable: dto.minimumAcceptable || dto.targetSalary ? (dto.targetSalary || 0) * 0.85 : undefined,
      marketRange: dto.marketRange,
      benefits: dto.benefits,
      negotiationStrategy: this.generateStrategy(dto),
      talkingPoints: this.generateTalkingPoints(dto),
    });

    return this.negotiationRepository.save(negotiation);
  }

  /**
   * Gets negotiation by ID
   */
  async getNegotiation(negotiationId: string): Promise<SalaryNegotiation | null> {
    return this.negotiationRepository.findOne({
      where: { id: negotiationId },
    });
  }

  /**
   * Gets all negotiations for a user
   */
  async getUserNegotiations(userId: string): Promise<SalaryNegotiation[]> {
    return this.negotiationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates negotiation details
   */
  async updateNegotiation(
    negotiationId: string,
    updates: Partial<CreateNegotiationDto>,
  ): Promise<SalaryNegotiation> {
    const negotiation = await this.getNegotiation(negotiationId);
    
    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    Object.assign(negotiation, updates);
    negotiation.negotiationStrategy = this.generateStrategy(updates as CreateNegotiationDto);
    
    return this.negotiationRepository.save(negotiation);
  }

  /**
   * Gets market salary range for a position
   */
  async getMarketSalaryRange(
    position: string,
    location?: string,
    experienceLevel?: string,
  ): Promise<{ min: number; max: number; currency: string; source: string }> {
    // In production, this would call salary APIs
    // For now, return simulated data based on position
    const baseRanges: Record<string, { min: number; max: number }> = {
      'software engineer': { min: 80000, max: 150000 },
      'senior software engineer': { min: 120000, max: 200000 },
      'product manager': { min: 90000, max: 180000 },
      'data scientist': { min: 85000, max: 160000 },
      'designer': { min: 70000, max: 140000 },
      'marketing': { min: 60000, max: 130000 },
      'sales': { min: 50000, max: 120000 },
      'hr': { min: 55000, max: 120000 },
    };

    const positionLower = position.toLowerCase();
    let range = { min: 60000, max: 100000 };

    for (const [key, value] of Object.entries(baseRanges)) {
      if (positionLower.includes(key)) {
        range = value;
        break;
      }
    }

    // Adjust for experience
    const experienceMultiplier = {
      'junior': 0.7,
      'mid': 1.0,
      'senior': 1.3,
      'lead': 1.5,
      'principal': 1.8,
    };

    const expKey = experienceLevel?.toLowerCase() || 'mid';
    const multiplier = experienceMultiplier[expKey as keyof typeof experienceMultiplier] || 1.0;

    return {
      min: Math.round(range.min * multiplier),
      max: Math.round(range.max * multiplier),
      currency: 'USD',
      source: 'Market Analysis (based on industry data)',
    };
  }

  /**
   * Gets negotiation strategy
   */
  getNegotiationStrategy(negotiationId: string): NegotiationStrategy {
    // In production, this would retrieve from database
    return {
      approach: 'Collaborative but firm',
      talkingPoints: [
        'Express enthusiasm for the role and company',
        'Highlight your unique value proposition',
        'Present market data to support your request',
        'Focus on total compensation, not just base salary',
        'Be prepared to discuss non-salary benefits',
      ],
      counterOfferGuidance: [
        'If they can\'t meet salary, ask about signing bonus',
        'Request additional PTO days if salary is firm',
        'Explore professional development budget',
        'Consider equity adjustments if base is negotiable',
        'Ask about performance review timeline for raises',
      ],
      timingAdvice: 'Wait until you receive a written offer before negotiating. This gives you the most leverage.',
      redFlags: [
        'Reluctance to discuss salary openly',
        'Pressure to accept quickly without time to consider',
        'Salary significantly below market range',
        'Vague answers about benefits and compensation',
        'Negative reaction to reasonable negotiation',
      ],
    };
  }

  /**
   * Generates talking points for negotiation
   */
  private generateTalkingPoints(dto: CreateNegotiationDto): string[] {
    return [
      `Highlight experience relevant to ${dto.position} role`,
      'Present quantified achievements from previous roles',
      'Emphasize unique skills or perspective you bring',
      'Reference market data for similar positions',
      'Express genuine interest in the company mission',
      'Show understanding of team challenges and how you can help',
      'Discuss long-term career alignment with the company',
    ];
  }

  /**
   * Generates negotiation strategy
   */
  private generateStrategy(dto: CreateNegotiationDto): Record<string, unknown> {
    return {
      approach: 'Collaborative negotiation focusing on mutual value',
      initialRequest: dto.targetSalary || null,
      minimum: dto.minimumAcceptable || null,
      preferredOutcome: 'Competitive package within market range',
      leveragePoints: [
        'Strong candidate market for your skills',
        'Proven track record and achievements',
        'Unique combination of skills and experience',
      ],
      risks: [
        'Pushing too hard could risk the offer',
        'Accepting too quickly may leave value on the table',
      ],
      bestPractices: [
        'Always get offers in writing',
        'Take time to consider before responding',
        'Negotiate the total package, not just salary',
        'Don\'t disclose your current or previous salary',
        'Be professional and collaborative throughout',
      ],
    };
  }

  /**
   * Deletes a negotiation
   */
  async deleteNegotiation(negotiationId: string): Promise<void> {
    const negotiation = await this.getNegotiation(negotiationId);
    if (negotiation) {
      await this.negotiationRepository.remove(negotiation);
    }
  }
}
