import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NegotiationSession } from '../entities/negotiation-session.entity';

export interface NegotiationInput {
  userId: string;
  jobOfferId?: string;
  currentOffer: { baseSalary: number; bonus?: number; equity?: number };
  marketData?: { role: string; industry: string; location: string };
}

@Injectable()
export class SalaryNegotiationService {
  private readonly logger = new Logger(SalaryNegotiationService.name);

  constructor(
    @InjectRepository(NegotiationSession)
    private readonly negotiationRepository: Repository<NegotiationSession>,
  ) {}

  async analyzeOffer(input: NegotiationInput): Promise<any> {
    this.logger.log(`Analyzing offer for user ${input.userId}`);

    const marketSalary = {
      min: 100000,
      median: 130000,
      max: 180000,
      currency: 'USD',
      source: 'Market Data',
    };

    const counterOffer = {
      recommendedBaseSalary: Math.round(marketSalary.median * 1.1),
      rationale: 'Based on market analysis',
    };

    const negotiationScript = {
      opening: 'Thank you for the offer. I\'m excited about this opportunity.',
      body: 'Based on my research and market rates, I was hoping to discuss adjusting the base salary.',
      closing: 'I look forward to your response.',
    };

    const session = this.negotiationRepository.create({
      userId: input.userId,
      jobOfferId: input.jobOfferId,
      currentOffer: input.currentOffer,
      marketSalary,
      counterOffer,
      negotiationScript,
      successPrediction: 75,
    });

    const saved = await this.negotiationRepository.save(session);
    return {
      id: saved.id,
      marketSalary: saved.marketSalary,
      counterOffer: saved.counterOffer,
      negotiationScript: saved.negotiationScript,
      successPrediction: saved.successPrediction,
    };
  }

  async getNegotiationScript(sessionId: string): Promise<NegotiationSession | null> {
    return this.negotiationRepository.findOne({ where: { id: sessionId } });
  }
}
