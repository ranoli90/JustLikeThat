import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyInsight } from '../../entities/company-insight.entity';
import { InterviewSession } from '../../entities/interview-session.entity';

export interface CompanyResearchResult {
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  culture: string;
  values: string[];
  benefits: Record<string, unknown>;
  interviewProcess: string;
  tips: Record<string, unknown>;
  salaryRange: { min: number; max: number; currency: string };
  recentNews: Record<string, unknown>[];
  glassdoorRating: number;
}

@Injectable()
export class CompanyResearchService {
  constructor(
    @InjectRepository(CompanyInsight)
    private readonly companyInsightRepository: Repository<CompanyInsight>,
  ) {}

  /**
   * Researches a company and creates insights for an interview session
   */
  async researchCompany(companyName: string, sessionId: string): Promise<CompanyInsight> {
    // Simulated company research - in production, this would call external APIs
    const researchResult = await this.performResearch(companyName);

    const companyInsight = this.companyInsightRepository.create({
      id: sessionId, // One-to-one relationship uses same ID
      name: researchResult.name,
      industry: researchResult.industry,
      size: researchResult.size,
      location: researchResult.location,
      website: researchResult.website,
      culture: researchResult.culture,
      values: researchResult.values,
      benefits: researchResult.benefits,
      interviewProcess: researchResult.interviewProcess,
      tips: researchResult.tips,
      salaryRange: researchResult.salaryRange,
      recentNews: researchResult.recentNews,
      glassdoorRating: researchResult.glassdoorRating,
    });

    return this.companyInsightRepository.save(companyInsight);
  }

  /**
   * Gets company insights for a session
   */
  async getCompanyInsight(sessionId: string): Promise<CompanyInsight | null> {
    return this.companyInsightRepository.findOne({
      where: { id: sessionId },
    });
  }

  /**
   * Updates company insights
   */
  async updateCompanyInsight(
    sessionId: string,
    updates: Partial<CompanyResearchResult>,
  ): Promise<CompanyInsight> {
    const insight = await this.getCompanyInsight(sessionId);
    
    if (!insight) {
      throw new Error('Company insight not found');
    }

    Object.assign(insight, updates);
    return this.companyInsightRepository.save(insight);
  }

  /**
   * Gets interview tips for the company
   */
  async getInterviewTips(sessionId: string): Promise<Record<string, unknown>> {
    const insight = await this.getCompanyInsight(sessionId);
    
    if (!insight || !insight.tips) {
      return this.getDefaultTips();
    }

    return insight.tips;
  }

  /**
   * Performs company research (simulated)
   */
  private async performResearch(companyName: string): Promise<CompanyResearchResult> {
    // In production, this would call APIs like Glassdoor, LinkedIn, etc.
    // For now, return simulated data based on company name patterns
    const isTechCompany = companyName.toLowerCase().includes('tech') || 
                          companyName.toLowerCase().includes('software') ||
                          companyName.toLowerCase().includes('digital');

    return {
      name: companyName,
      industry: isTechCompany ? 'Technology' : 'Various',
      size: '100-500 employees',
      location: 'Remote/Hybrid',
      website: `https://www.${companyName.toLowerCase().replace(/\s/g, '')}.com`,
      culture: isTechCompany 
        ? 'Innovation-driven, collaborative, fast-paced environment with focus on work-life balance'
        : 'Professional, growth-oriented, team-focused culture',
      values: [
        'Innovation',
        'Customer Focus',
        'Integrity',
        'Collaboration',
        'Continuous Learning',
      ],
      benefits: {
        health: 'Comprehensive health, dental, and vision insurance',
        retirement: '401(k) with 4% match',
        timeOff: 'Unlimited PTO policy',
        remote: 'Flexible remote work options',
        professional: 'Learning and development budget',
      },
      interviewProcess: isTechCompany
        ? 'Phone screening → Technical interview → System design → Team fit → Final round'
        : 'Phone screening → HR interview → Manager interview → Panel interview → Final decision',
      tips: {
        preparation: [
          'Research recent company news and developments',
          'Understand the job role requirements deeply',
          'Prepare examples that demonstrate relevant skills',
          'Practice the STAR method for behavioral questions',
        ],
        technical: isTechCompany ? [
          'Review data structures and algorithms',
          'Prepare for coding challenges',
          'Practice system design questions',
          'Be ready to discuss past technical projects',
        ] : [
          'Review industry-specific knowledge',
          'Prepare case study examples',
          'Demonstrate analytical thinking',
        ],
        behavioral: [
          'Use the STAR method (Situation, Task, Action, Result)',
          'Prepare 3-5 stories that showcase your strengths',
          'Be ready to discuss challenges and how you overcame them',
          'Show enthusiasm for the role and company mission',
        ],
      },
      salaryRange: {
        min: 80000,
        max: 150000,
        currency: 'USD',
      },
      recentNews: [
        { title: 'Company expands to new markets', date: '2024-01-15' },
        { title: 'Launches innovative product line', date: '2024-02-01' },
      ],
      glassdoorRating: isTechCompany ? 4.2 : 3.8,
    };
  }

  /**
   * Gets default tips when company-specific tips aren't available
   */
  private getDefaultTips(): Record<string, unknown> {
    return {
      general: [
        'Research the company thoroughly before the interview',
        'Review the job description and align your experience',
        'Prepare thoughtful questions to ask the interviewer',
        'Practice your answers to common interview questions',
        'Get a good night sleep before the interview',
      ],
      virtual: [
        'Test your technology setup before the call',
        'Find a quiet, professional-looking space',
        'Have a backup plan for technical issues',
        'Look at the camera when speaking',
      ],
      onsite: [
        'Plan your route and arrive 10-15 minutes early',
        'Dress appropriately for the company culture',
        'Bring copies of your resume',
        'Be prepared to meet multiple people',
      ],
    };
  }
}
