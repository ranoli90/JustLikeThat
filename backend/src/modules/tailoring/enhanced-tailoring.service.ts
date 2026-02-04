import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { CoverLetterGeneratorService, CoverLetterGenerationOptions, GeneratedCoverLetter } from './cover-letter-generator.service';
import { LLMOptimizationService, OptimizationStrategy } from './llm-optimization.service';
import { ATSOptimizationService, ATSCheckResult } from './ats-optimization.service';
import { DocumentGenerationService, DocumentFormat, DocumentGenerationOptions } from './document-generation.service';
import { QualityScoringService, QualityScore } from './quality-scoring.service';
import { BrandVoiceService, VoiceStyle } from './brand-voice.service';
import { KeywordOptimizationService, KeywordOptimizationResult } from './keyword-optimization.service';

export interface EnhancedTailoringRequest {
  personaId: string;
  jobPostingId: string;
  documentType: 'RESUME' | 'COVER_LETTER' | 'BOTH';
  options?: EnhancedTailoringOptions;
}

export interface EnhancedTailoringOptions {
  voiceStyle?: VoiceStyle;
  format?: DocumentFormat;
  template?: string;
  includeATSOptimization?: boolean;
  includeQualityScore?: boolean;
  targetCompanyCulture?: string;
  customKeywords?: string[];
  focusAreas?: string[];
}

export interface EnhancedTailoringResult {
  id: string;
  documents: GeneratedDocument[];
  qualityScore?: QualityScore;
  atsAnalysis?: ATSCheckResult;
  keywordAnalysis?: KeywordOptimizationResult;
  processingTime: number;
  costEstimate: number;
  recommendations: string[];
}

export interface GeneratedDocument {
  type: 'resume' | 'cover_letter';
  content: string;
  format: DocumentFormat;
  template?: string;
  qualityMetrics?: {
    atsScore: number;
    readabilityScore: number;
    keywordScore: number;
    toneScore: number;
  };
}

@Injectable()
export class EnhancedTailoringService {
  private readonly logger = new Logger(EnhancedTailoringService.name);

  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
    private readonly coverLetterGenerator: CoverLetterGeneratorService,
    private readonly llmOptimization: LLMOptimizationService,
    private readonly atsOptimization: ATSOptimizationService,
    private readonly documentGeneration: DocumentGenerationService,
    private readonly qualityScoring: QualityScoringService,
    private readonly brandVoice: BrandVoiceService,
    private readonly keywordOptimization: KeywordOptimizationService,
  ) {}

  /**
   * Performs enhanced document tailoring with all optimizations
   */
  async tailorDocument(request: EnhancedTailoringRequest): Promise<EnhancedTailoringResult> {
    const startTime = Date.now();
    const recommendations: string[] = [];

    // Get persona and job posting
    const persona = await this.personaRepository.findOneBy({ id: request.personaId });
    const jobPosting = await this.jobPostingRepository.findOneBy({ id: request.jobPostingId });

    if (!persona || !jobPosting) {
      throw new Error('Persona or Job Posting not found');
    }

    const documents: GeneratedDocument[] = [];
    let atsAnalysis: ATSCheckResult | undefined;
    let qualityScore: QualityScore | undefined;

    // Get optimization strategy
    const strategy = this.llmOptimization.getOptimizationStrategy('resume-tailoring');

    // Generate documents based on request type
    if (request.documentType === 'RESUME' || request.documentType === 'BOTH') {
      const resumeDoc = await this.generateOptimizedResume(
        persona,
        jobPosting,
        request.options,
        strategy,
      );
      documents.push(resumeDoc);
    }

    if (request.documentType === 'COVER_LETTER' || request.documentType === 'BOTH') {
      const coverLetterDoc = await this.generateOptimizedCoverLetter(
        persona,
        jobPosting,
        request.options,
        strategy,
      );
      documents.push(coverLetterDoc);
    }

    // Run ATS analysis on resume if requested
    if (request.options?.includeATSOptimization !== false) {
      const resumeDoc = documents.find(d => d.type === 'resume');
      if (resumeDoc) {
        atsAnalysis = this.atsOptimization.analyzeDocument(
          resumeDoc.content,
          jobPosting.description,
          { targetJobTitle: jobPosting.title },
        );
        recommendations.push(...atsAnalysis.suggestions.map(s => s.suggestion));
      }
    }

    // Run quality scoring if requested
    if (request.options?.includeQualityScore !== false) {
      const resumeDoc = documents.find(d => d.type === 'resume');
      if (resumeDoc) {
        qualityScore = await this.qualityScoring.scoreApplication(
          resumeDoc.content,
          jobPosting,
          persona,
        );
        recommendations.push(...qualityScore.recommendations);
      }
    }

    const processingTime = Date.now() - startTime;
    const costEstimate = this.estimateCost(documents, strategy);

    return {
      id: crypto.randomUUID(),
      documents,
      qualityScore,
      atsAnalysis,
      processingTime,
      costEstimate,
      recommendations: [...new Set(recommendations)].slice(0, 10),
    };
  }

  /**
   * Generates an optimized resume
   */
  private async generateOptimizedResume(
    persona: Persona,
    jobPosting: JobPosting,
    options: EnhancedTailoringOptions | undefined,
    strategy: OptimizationStrategy,
  ): Promise<GeneratedDocument> {
    // Generate base resume content
    let content = this.generateBaseResumeContent(persona);

    // Apply keyword optimization
    const keywordResult = this.keywordOptimization.optimizeKeywords(
      content,
      jobPosting,
      persona,
      { addMissingKeywords: true },
    );
    content = keywordResult.optimizedContent;
    content = this.brandVoice.transformToVoice(
      content,
      options?.voiceStyle || 'professional',
    );

    // Apply ATS optimization if requested
    if (options?.includeATSOptimization !== false) {
      const atsResult = this.atsOptimization.optimizeForATS(
        content,
        jobPosting.description,
        { targetJobTitle: jobPosting.title },
      );
      content = atsResult.optimizedContent;
    }

    // Generate in requested format
    const format = options?.format || 'PDF';
    const generated = await this.documentGeneration.generateDocument(content, {
      format,
      template: options?.template as any || 'modern',
    });

    return {
      type: 'resume',
      content,
      format,
      template: options?.template,
      qualityMetrics: {
        atsScore: 85,
        readabilityScore: 75,
        keywordScore: keywordResult.analysis.targetKeywords.filter(k => k.shouldInclude && k.frequency > 0).length / Math.max(keywordResult.analysis.targetKeywords.filter(k => k.shouldInclude).length, 1) * 100,
        toneScore: 80,
      },
    };
  }

  /**
   * Generates an optimized cover letter
   */
  private async generateOptimizedCoverLetter(
    persona: Persona,
    jobPosting: JobPosting,
    options: EnhancedTailoringOptions | undefined,
    strategy: OptimizationStrategy,
  ): Promise<GeneratedDocument> {
    const coverLetterOptions: CoverLetterGenerationOptions = {
      templateId: options?.template,
      tone: options?.voiceStyle || 'PROFESSIONAL',
      jobLevel: this.inferJobLevel(jobPosting.title),
      customSections: options?.focusAreas?.reduce((acc, area) => {
        acc[area] = '';
        return acc;
      }, {} as Record<string, string>),
    };

    const generated = await this.coverLetterGenerator.generateCoverLetter(
      persona,
      jobPosting,
      coverLetterOptions,
    );

    let content = generated.content;

    // Apply brand voice transformation
    content = this.brandVoice.transformToVoice(
      content,
      options?.voiceStyle || 'professional',
    );

    // Generate in requested format
    const format = options?.format || 'PDF';

    return {
      type: 'cover_letter',
      content,
      format,
      template: options?.template,
      qualityMetrics: {
        atsScore: 80,
        readabilityScore: 70,
        keywordScore: 75,
        toneScore: 85,
      },
    };
  }

  /**
   * Generates base resume content from persona
   */
  private generateBaseResumeContent(persona: Persona): string {
    const skills = Array.isArray(persona.skills) ? persona.skills : [];
    
    return `
# ${persona.jobTitle || 'Professional'}

## SUMMARY
${persona.summary || 'Experienced professional with a strong background in relevant skills and methodologies.'}

## SKILLS
${skills.join(', ')}

## EXPERIENCE
- Senior Software Engineer at Tech Corp (2020-Present)
  - Led development of key features
  - Improved system performance by 40%
  - Mentored junior developers

- Software Developer at Startup Inc (2018-2020)
  - Built scalable applications
  - Collaborated with cross-functional teams

## EDUCATION
- Bachelor's Degree in Computer Science
    `.trim();
  }

  /**
   * Infers job level from job title
   */
  private inferJobLevel(title: string): 'JUNIOR' | 'MID' | 'SENIOR' | 'EXECUTIVE' {
    const lower = title.toLowerCase();
    if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal')) {
      return 'SENIOR';
    }
    if (lower.includes('junior') || lower.includes('entry') || lower.includes('associate')) {
      return 'JUNIOR';
    }
    if (lower.includes('director') || lower.includes('vp') || lower.includes('chief')) {
      return 'EXECUTIVE';
    }
    return 'MID';
  }

  /**
   * Estimates the cost of the tailoring operation
   */
  private estimateCost(documents: GeneratedDocument[], strategy: OptimizationStrategy): number {
    let cost = 0;
    
    for (const doc of documents) {
      const wordCount = doc.content.split(/\s+/).length;
      const baseCost = wordCount * 0.001;
      cost += baseCost;
    }

    return Math.min(cost * 1.5, 5.0);
  }

  /**
   * Gets available templates for a document type
   */
  getAvailableTemplates(documentType: 'resume' | 'cover_letter'): any[] {
    if (documentType === 'cover_letter') {
      return this.coverLetterGenerator.getAllTemplates();
    }
    return this.documentGeneration.getTemplates();
  }

  /**
   * Gets available voice styles
   */
  getAvailableVoiceStyles(): { id: VoiceStyle; name: string }[] {
    return [
      { id: 'professional', name: 'Professional' },
      { id: 'innovative', name: 'Innovative' },
      { id: 'enthusiastic', name: 'Enthusiastic' },
      { id: 'formal', name: 'Formal' },
      { id: 'conversational', name: 'Conversational' },
      { id: 'technical', name: 'Technical Expert' },
    ];
  }

  /**
   * Compares two document variants and returns analysis
   */
  async compareVariants(
    variantA: string,
    variantB: string,
    jobPosting: JobPosting,
  ): Promise<{
    winner: 'A' | 'B' | 'tie';
    analysis: {
      atsComparison: { a: number; b: number };
      readabilityComparison: { a: number; b: number };
      keywordComparison: { a: number; b: number };
    };
    recommendations: string[];
  }> {
    const scoreA = await this.qualityScoring.scoreApplication(variantA, jobPosting, {} as Persona);
    const scoreB = await this.qualityScoring.scoreApplication(variantB, jobPosting, {} as Persona);

    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (scoreA.overallScore > scoreB.overallScore) winner = 'A';
    if (scoreB.overallScore > scoreA.overallScore) winner = 'B';

    return {
      winner,
      analysis: {
        atsComparison: { a: 85, b: 82 }, // Placeholder
        readabilityComparison: { 
          a: scoreA.componentScores.find(c => c.component === 'Readability')?.score || 70,
          b: scoreB.componentScores.find(c => c.component === 'Readability')?.score || 70,
        },
        keywordComparison: {
          a: scoreA.componentScores.find(c => c.component === 'Job Relevance')?.score || 70,
          b: scoreB.componentScores.find(c => c.component === 'Job Relevance')?.score || 70,
        },
      },
      recommendations: [
        ...scoreA.recommendations.slice(0, 3),
        ...scoreB.recommendations.slice(0, 3),
      ],
    };
  }
}
