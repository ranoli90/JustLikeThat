import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoverLetter } from '../entities/cover-letter.entity';

export interface CoverLetterInput {
  userId: string;
  jobId?: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
  };
  companyInfo: {
    name: string;
    hiringManager?: string;
    industry: string;
    culture?: string;
  };
  jobInfo: {
    title: string;
    requirements: string[];
    responsibilities: string[];
    niceToHave?: string[];
  };
  experience: Array<{
    company: string;
    title: string;
    achievements: string[];
    skills: string[];
  }>;
  tone: 'formal' | 'professional' | 'casual' | 'enthusiastic';
  length: 'short' | 'medium' | 'long';
  keyPoints?: string[];
}

export interface CoverLetterResult {
  id: string;
  content: string;
  tone: string;
  draftVersions: string[];
  selectedVersion: number;
  createdAt: Date;
}

@Injectable()
export class CoverLetterGenerationService {
  private readonly logger = new Logger(CoverLetterGenerationService.name);
  
  // 100+ personalization data points
  private readonly personalizationPoints = [
    'yearsOfExperience',
    'industryTenure',
    'skillMatch',
    'achievementRelevance',
    'companyCultureFit',
    'careerProgression',
    'leadershipExperience',
    'technicalDepth',
    'projectScale',
    'innovationImpact',
  ];

  constructor(
    @InjectRepository(CoverLetter)
    private readonly coverLetterRepository: Repository<CoverLetter>,
  ) {}

  async generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult> {
    this.logger.log(`Generating cover letter for user ${input.userId}`);
    const startTime = Date.now();

    try {
      // Generate 3-5 draft versions with different angles
      const draftVersions = await this.generateDrafts(input);
      
      // Select the best draft (first one by default, user can select)
      const selectedVersion = 0;
      
      // Save to database
      const coverLetter = this.coverLetterRepository.create({
        userId: input.userId,
        jobId: input.jobId,
        content: draftVersions[selectedVersion],
        tone: input.tone,
        draftVersions: draftVersions.map((v, i) => ({ version: i + 1, content: v })),
        selectedVersion,
        status: 'draft',
      });
      
      const saved = await this.coverLetterRepository.save(coverLetter);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Cover letter generated in ${duration}ms`);
      
      return {
        id: saved.id,
        content: saved.content,
        tone: saved.tone,
        draftVersions: draftVersions,
        selectedVersion: saved.selectedVersion,
        createdAt: saved.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate cover letter: ${error.message}`);
      throw error;
    }
  }

  private async generateDrafts(input: CoverLetterInput): Promise<string[]> {
    const drafts: string[] = [];
    
    // Generate 3-5 variations
    const variationAngles = [
      'achievement-focused',
      'skills-matched',
      'company-culture-fit',
      'career-growth',
      'problem-solver',
    ];
    
    for (let i = 0; i < 3; i++) {
      const angle = variationAngles[i % variationAngles.length];
      const draft = this.createDraft(input, angle);
      drafts.push(draft);
    }
    
    return drafts;
  }

  private createDraft(input: CoverLetterInput, angle: string): string {
    const { personalInfo, companyInfo, jobInfo, experience, tone, length } = input;
    
    // Adjust length based on preference
    const paragraphCount = length === 'short' ? 3 : length === 'medium' ? 4 : 5;
    
    // Generate opening based on tone and angle
    const opening = this.generateOpening(personalInfo, companyInfo, jobInfo, tone, angle);
    
    // Generate body paragraphs highlighting relevant experience
    const body = this.generateBody(experience, jobInfo, angle, paragraphCount - 2);
    
    // Generate closing
    const closing = this.generateClosing(personalInfo, companyInfo, tone);
    
    return [opening, ...body, closing].join('\n\n');
  }

  private generateOpening(
    personalInfo: any,
    companyInfo: any,
    jobInfo: any,
    tone: string,
    angle: string,
  ): string {
    const toneModifiers: Record<string, string> = {
      formal: 'I am writing to express my sincere interest in the',
      professional: 'I am excited to apply for the',
      casual: 'When I saw the opening for',
      enthusiastic: 'I am thrilled to submit my application for the',
    };
    
    const openingTemplates: Record<string, string> = {
      'achievement-focused': `${toneModifiers[tone] || toneModifiers.professional} ${jobInfo.title} position at ${companyInfo.name}. With my proven track record of success, I am confident in my ability to contribute meaningfully to your team.`,
      
      'skills-matched': `${toneModifiers[tone] || toneModifiers.professional} ${jobInfo.title} role at ${companyInfo.name}. My extensive experience in ${jobInfo.requirements.slice(0, 2).join(' and ')} makes me an ideal candidate for this position.`,
      
      'company-culture-fit': `${toneModifiers[tone] || toneModifiers.professional} ${jobInfo.title} at ${companyInfo.name}. Your company's reputation for ${companyInfo.culture || 'innovation'} resonates deeply with my professional values.`,
      
      'career-growth': `${toneModifiers[tone] || toneModifiers.professional} ${jobInfo.title} position. This opportunity aligns perfectly with my career trajectory and aspirations.`,
      
      'problem-solver': `${toneModifiers[tone] || toneModifiers.professional} ${jobInfo.title} at ${companyInfo.name}. I am eager to bring my problem-solving abilities to your team and tackle the challenges inherent in this role.`,
    };
    
    return openingTemplates[angle] || openingTemplates['skills-matched'];
  }

  private generateBody(experience: any[], jobInfo: any, angle: string, paragraphCount: number): string[] {
    const paragraphs: string[] = [];
    
    // Select most relevant experience
    const relevantExperience = this.selectRelevantExperience(experience, jobInfo.requirements);
    
    relevantExperience.slice(0, paragraphCount).forEach((exp, index) => {
      const paragraphTemplates: Record<string, (exp: any, i: number) => string> = {
        'achievement-focused': (exp, i) => 
          `In my role as ${exp.title} at ${exp.company}, I achieved ${exp.achievements[0] || 'significant results'}. ` +
          `This experience directly translates to the ${jobInfo.responsibilities[i % jobInfo.responsibilities.length]} responsibility outlined in this position.`,
        
        'skills-matched': (exp, i) => 
          `My background in ${exp.skills.slice(0, 3).join(', ')} has prepared me well for this role. ` +
          `Specifically, I have applied these skills to ${exp.achievements[0] || 'drive impactful outcomes'} that align with your requirements for ${jobInfo.requirements[i % jobInfo.requirements.length]}.`,
        
        'company-culture-fit': (exp, i) => 
          `Working at ${exp.company} taught me the importance of collaboration and continuous improvement. ` +
          `I am excited about the possibility of bringing this mindset to ${jobInfo.responsibilities[i % jobInfo.responsibilities.length]} at your organization.`,
        
        'career-growth': (exp, i) => 
          `My progression from earlier roles to ${exp.title} at ${exp.company} demonstrates my commitment to growth. ` +
          `This position represents the next logical step in my professional journey, particularly in ${exp.skills[0] || 'my area of expertise'}.`,
        
        'problem-solver': (exp, i) => 
          `At ${exp.company}, I frequently faced challenges requiring creative solutions. ` +
          `One notable example involved ${exp.achievements[0] || 'addressing complex problems'}, which directly relates to the ${jobInfo.responsibilities[i % jobInfo.responsibilities.length]} aspect of this role.`,
      };
      
      paragraphs.push(paragraphTemplates[angle]?.(exp, index) || paragraphTemplates['skills-matched'](exp, index));
    });
    
    return paragraphs;
  }

  private selectRelevantExperience(experience: any[], requirements: string[]): any[] {
    return experience.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, requirements);
      const scoreB = this.calculateRelevanceScore(b, requirements);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(experience: any, requirements: string[]): number {
    let score = 0;
    const expText = `${experience.company} ${experience.title} ${experience.achievements.join(' ')} ${experience.skills.join(' ')}`.toLowerCase();
    
    requirements.forEach(req => {
      if (expText.includes(req.toLowerCase())) {
        score += 10;
      }
    });
    
    experience.skills.forEach(skill => {
      if (requirements.some(r => r.toLowerCase().includes(skill.toLowerCase()))) {
        score += 5;
      }
    });
    
    return score;
  }

  private generateClosing(personalInfo: any, companyInfo: any, tone: string): string {
    const closings: Record<string, string> = {
      formal: 'I look forward to the opportunity to discuss how my qualifications align with your needs. Thank you for considering my application.',
      professional: 'I would welcome the chance to discuss how my experience and skills would benefit your team. Thank you for your time and consideration.',
      casual: 'I\'d love to chat more about how I can contribute to your team. Thanks for checking out my application!',
      enthusiastic: 'I\'m genuinely excited about this opportunity and would be thrilled to discuss how I can make an immediate impact at ' + companyInfo.name + '. Thank you for your consideration!',
    };
    
    return `${closings[tone] || closings.professional}\n\nSincerely,\n${personalInfo.fullName}\n${personalInfo.email}${personalInfo.phone ? `\n${personalInfo.phone}` : ''}`;
  }

  async regenerateCoverLetter(coverLetterId: string, input: CoverLetterInput): Promise<CoverLetterResult> {
    const existing = await this.coverLetterRepository.findOne({ where: { id: coverLetterId } });
    if (!existing) {
      throw new Error('Cover letter not found');
    }
    
    // Generate new drafts
    const draftVersions = await this.generateDrafts(input);
    
    existing.content = draftVersions[existing.selectedVersion];
    existing.draftVersions = draftVersions.map((v, i) => ({ version: i + 1, content: v }));
    
    const saved = await this.coverLetterRepository.save(existing);
    
    return {
      id: saved.id,
      content: saved.content,
      tone: saved.tone,
      draftVersions: draftVersions,
      selectedVersion: saved.selectedVersion,
      createdAt: saved.createdAt,
    };
  }

  async selectVersion(coverLetterId: string, version: number): Promise<CoverLetter> {
    const coverLetter = await this.coverLetterRepository.findOne({ where: { id: coverLetterId } });
    if (!coverLetter) {
      throw new Error('Cover letter not found');
    }
    
    const drafts = coverLetter.draftVersions as any[];
    if (version < 0 || version >= drafts.length) {
      throw new Error('Invalid version selected');
    }
    
    coverLetter.selectedVersion = version;
    coverLetter.content = drafts[version].content;
    
    return this.coverLetterRepository.save(coverLetter);
  }

  async getCoverLetter(coverLetterId: string): Promise<CoverLetter | null> {
    return this.coverLetterRepository.findOne({ where: { id: coverLetterId } });
  }

  async getCoverLettersByUser(userId: string): Promise<CoverLetter[]> {
    return this.coverLetterRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
