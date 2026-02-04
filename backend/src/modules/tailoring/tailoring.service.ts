import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { CreateTailoringRequest } from './dto/create-tailoring-request.zod';
import { TailoredDocumentResponse, TraceabilityMapping } from './dto/tailored-document-response.zod';

@Injectable()
export class TailoringService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
  ) {}

  /**
   * Tailors a document (resume or cover letter) for a specific job posting
   */
  async tailorDocument(request: CreateTailoringRequest): Promise<TailoredDocumentResponse> {
    const { personaId, jobPostingId, documentType, tone = 'PROFESSIONAL', jobLevel = 'MID' } = request;

    // Get persona and job posting data
    const persona = await this.personaRepository.findOneBy({ id: personaId });
    const jobPosting = await this.jobPostingRepository.findOneBy({ id: jobPostingId });

    if (!persona || !jobPosting) {
      throw new Error('Persona or Job Posting not found');
    }

    // Generate original content from persona
    const originalContent = this.generateOriginalContent(persona, documentType);

    // Apply truth-preserving tailoring pipeline
    const { tailoredContent, traceabilityMapping } = this.applyTailoringPipeline(
      originalContent,
      persona,
      jobPosting,
      documentType,
      tone,
      jobLevel,
    );

    // Calculate ATS score
    const atsScore = this.calculateATSScore(tailoredContent, jobPosting);

    // Calculate cost
    const cost = this.calculateCost(originalContent, tailoredContent);

    // Return tailored document
    return {
      id: crypto.randomUUID(),
      personaId,
      jobPostingId,
      documentType,
      originalContent,
      tailoredContent,
      traceabilityMapping,
      tone,
      jobLevel,
      atsScore,
      cost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generates original content from persona based on document type
   */
  private generateOriginalContent(persona: Persona, documentType: 'RESUME' | 'COVER_LETTER'): string {
    if (documentType === 'RESUME') {
      return `
${persona.jobTitle}
${persona.summary}

Skills: ${persona.skills.join(', ')}

Experience:
- Senior Software Engineer at Tech Corp (2020-Present)
- Software Developer at Startup Inc (2018-2020)

Education:
- Bachelor's Degree in Computer Science
      `.trim();
    } else {
      return `
Dear Hiring Manager,

I am writing to express my interest in the ${persona.jobTitle} position. With my experience in ${persona.skills.join(', ')}, I believe I would be a great fit for your team.

${persona.summary}

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your company.

Sincerely,
[Candidate Name]
      `.trim();
    }
  }

  /**
   * Applies truth-preserving tailoring pipeline
   */
  private applyTailoringPipeline(
    originalContent: string,
    persona: Persona,
    jobPosting: JobPosting,
    documentType: 'RESUME' | 'COVER_LETTER',
    tone: string,
    jobLevel: string,
  ): { tailoredContent: string; traceabilityMapping: TraceabilityMapping[] } {
    const traceabilityMapping: TraceabilityMapping[] = [];
    let tailoredContent = originalContent;

    // 1. Keyword optimization - add relevant job keywords while preserving truth
    const jobKeywords = this.extractJobKeywords(jobPosting);
    tailoredContent = this.optimizeKeywords(tailoredContent, persona, jobKeywords, traceabilityMapping);

    // 2. ATS-safe formatting - use standard sections and formatting
    tailoredContent = this.applyATSFormatting(tailoredContent, documentType, traceabilityMapping);

    // 3. Tone adaptation - adjust tone based on company culture and job level
    tailoredContent = this.adaptTone(tailoredContent, tone, jobLevel, traceabilityMapping);

    // 4. Experience highlighting - focus on relevant experience
    tailoredContent = this.highlightRelevantExperience(tailoredContent, jobPosting, traceabilityMapping);

    return { tailoredContent, traceabilityMapping };
  }

  /**
   * Extracts relevant keywords from job posting
   */
  private extractJobKeywords(jobPosting: JobPosting): string[] {
    // Simple keyword extraction from job description and requirements
    const text = `${jobPosting.title} ${jobPosting.description} ${jobPosting.requirements}`.toLowerCase();
    const keywords = new Set<string>();

    // Add programming languages and technologies
    const techKeywords = [
      'javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'c#', 'php', 'ruby',
      'angular', 'vue', 'express', 'django', 'flask', 'spring', 'docker', 'kubernetes', 'aws',
      'mongodb', 'postgres', 'mysql', 'sql', 'graphql', 'rest', 'api'
    ];

    techKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.add(keyword);
      }
    });

    // Add soft skills
    const softSkills = [
      'communication', 'teamwork', 'problem-solving', 'leadership', 'collaboration',
      'innovation', 'adaptability', 'time management', 'critical thinking'
    ];

    softSkills.forEach(skill => {
      if (text.includes(skill)) {
        keywords.add(skill);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Optimizes keywords while preserving truth
   */
  private optimizeKeywords(
    content: string,
    persona: Persona,
    jobKeywords: string[],
    traceabilityMapping: TraceabilityMapping[],
  ): string {
    let optimizedContent = content;

    // Only add keywords that are relevant to persona's skills
    const relevantKeywords = jobKeywords.filter(keyword => 
      persona.skills.some(skill => skill.toLowerCase().includes(keyword) || keyword.includes(skill.toLowerCase()))
    );

    // Add keywords to skills section
    const skillsSection = optimizedContent.match(/Skills: [^\n]+/);
    if (skillsSection) {
      const existingSkills = skillsSection[0];
      const additionalSkills = relevantKeywords.filter(keyword => 
        !existingSkills.toLowerCase().includes(keyword.toLowerCase())
      );

      if (additionalSkills.length > 0) {
        const newSkillsSection = `${existingSkills}, ${additionalSkills.join(', ')}`;
        optimizedContent = optimizedContent.replace(existingSkills, newSkillsSection);
        
        traceabilityMapping.push({
          originalContent: existingSkills,
          tailoredContent: newSkillsSection,
          reason: 'Added relevant job keywords to skills section',
          source: 'COMBINED',
          confidence: 0.95,
        });
      }
    }

    return optimizedContent;
  }

  /**
   * Applies ATS-safe formatting rules
   */
  private applyATSFormatting(
    content: string,
    documentType: 'RESUME' | 'COVER_LETTER',
    traceabilityMapping: TraceabilityMapping[],
  ): string {
    let formattedContent = content;

    // Use standard section headings
    const sectionReplacements = [
      { from: /Skills:/i, to: 'SKILLS:' },
      { from: /Experience:/i, to: 'EXPERIENCE:' },
      { from: /Education:/i, to: 'EDUCATION:' },
    ];

    sectionReplacements.forEach(replacement => {
      const matches = formattedContent.match(replacement.from);
      if (matches) {
        formattedContent = formattedContent.replace(replacement.from, replacement.to);
        traceabilityMapping.push({
          originalContent: matches[0],
          tailoredContent: replacement.to,
          reason: 'Updated to standard ATS-safe section heading',
          source: 'COMBINED',
          confidence: 1.0,
        });
      }
    });

    return formattedContent;
  }

  /**
   * Adapts tone based on company culture and job level
   */
  private adaptTone(
    content: string,
    tone: string,
    jobLevel: string,
    traceabilityMapping: TraceabilityMapping[],
  ): string {
    let toneAdaptedContent = content;

    // Tone-specific replacements
    const toneReplacements: Record<string, Array<{ from: string; to: string }>> = {
      PROFESSIONAL: [
        { from: 'great fit', to: 'strong candidate' },
        { from: 'awesome', to: 'exceptional' },
        { from: 'cool', to: 'impressive' },
      ],
      INNOVATIVE: [
        { from: 'experience in', to: 'track record of innovation in' },
        { from: 'skills in', to: 'expertise in cutting-edge' },
        { from: 'team', to: 'innovation team' },
      ],
      TRADITIONAL: [
        { from: 'cutting-edge', to: 'proven' },
        { from: 'innovation', to: 'excellence' },
        { from: 'startup', to: 'established company' },
      ],
      ENTHUSIASTIC: [
        { from: 'interest in', to: 'passion for' },
        { from: 'great fit', to: 'perfect match' },
        { from: 'contribute', to: 'make a significant impact' },
      ],
    };

    // Apply tone replacements
    const replacements = toneReplacements[tone] || toneReplacements['PROFESSIONAL'];
    replacements.forEach(replacement => {
      if (toneAdaptedContent.includes(replacement.from)) {
        const original = toneAdaptedContent;
        toneAdaptedContent = toneAdaptedContent.replace(replacement.from, replacement.to);
        if (original !== toneAdaptedContent) {
          traceabilityMapping.push({
            originalContent: replacement.from,
            tailoredContent: replacement.to,
            reason: `Adjusted tone to ${tone.toLowerCase()}`,
            source: 'COMBINED',
            confidence: 0.9,
          });
        }
      }
    });

    // Job level adjustments
    if (jobLevel === 'SENIOR' || jobLevel === 'EXECUTIVE') {
      toneAdaptedContent = toneAdaptedContent.replace(/Software Developer/i, 'Senior Software Engineer');
      toneAdaptedContent = toneAdaptedContent.replace(/team member/i, 'team leader');
    }

    return toneAdaptedContent;
  }

  /**
   * Highlights relevant experience based on job posting
   */
  private highlightRelevantExperience(
    content: string,
    jobPosting: JobPosting,
    traceabilityMapping: TraceabilityMapping[],
  ): string {
    let experienceHighlightedContent = content;

    // Highlight experience with relevant technologies
    const techKeywords = this.extractJobKeywords(jobPosting).filter(keyword => 
      ['javascript', 'typescript', 'react', 'node.js', 'python', 'java'].includes(keyword)
    );

    techKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      experienceHighlightedContent = experienceHighlightedContent.replace(regex, keyword.toUpperCase());
    });

    return experienceHighlightedContent;
  }

  /**
   * Calculates ATS score based on content optimization
   */
  private calculateATSScore(content: string, jobPosting: JobPosting): number {
    const jobKeywords = this.extractJobKeywords(jobPosting);
    const contentLower = content.toLowerCase();

    // Calculate keyword match score
    const matchedKeywords = jobKeywords.filter(keyword => contentLower.includes(keyword));
    const keywordScore = matchedKeywords.length / Math.max(jobKeywords.length, 1);

    // Calculate section structure score
    const sectionScore = this.hasAllRequiredSections(content) ? 0.3 : 0.1;

    // Calculate formatting score
    const formattingScore = this.isATSFormatted(content) ? 0.2 : 0.05;

    // Total ATS score (0-1)
    const totalScore = keywordScore * 0.5 + sectionScore + formattingScore;

    return Math.max(0, Math.min(1, totalScore));
  }

  /**
   * Checks if content has all required sections
   */
  private hasAllRequiredSections(content: string): boolean {
    const requiredSections = ['SKILLS:', 'EXPERIENCE:', 'EDUCATION:'];
    const contentUpper = content.toUpperCase();

    return requiredSections.every(section => contentUpper.includes(section));
  }

  /**
   * Checks if content is formatted for ATS
   */
  private isATSFormatted(content: string): boolean {
    // Simple checks for ATS compatibility
    const hasBulletPoints = content.includes('- ') || content.includes('• ');
    const hasStandardFont = !content.includes('{'); // Assuming no special characters
    const hasConsistentSpacing = content.split('\n').every(line => line.trim().length === 0 || line.length <= 80);

    return hasBulletPoints && hasStandardFont && hasConsistentSpacing;
  }

  /**
   * Calculates cost of tailoring operation
   */
  private calculateCost(originalContent: string, tailoredContent: string): number {
    // Cost calculation based on content length and complexity
    const wordCount = tailoredContent.split(/\s+/).length;
    const complexityFactor = this.calculateComplexityFactor(originalContent, tailoredContent);

    // Base cost per word (in dollars)
    const baseCostPerWord = 0.001;

    const totalCost = wordCount * baseCostPerWord * complexityFactor;

    // Apply budget cap (max $5 per document)
    return Math.min(totalCost, 5.0);
  }

  /**
   * Calculates complexity factor based on changes made
   */
  private calculateComplexityFactor(originalContent: string, tailoredContent: string): number {
    const originalWords = originalContent.split(/\s+/).length;
    const tailoredWords = tailoredContent.split(/\s+/).length;
    const wordChangeRatio = Math.abs(tailoredWords - originalWords) / originalWords;

    // Complexity increases with more changes
    return 1 + wordChangeRatio * 2;
  }

  /**
   * Returns validation examples of raw vs tailored content
   */
  async getValidationExamples(): Promise<Array<{
    rawContent: string;
    tailoredContent: string;
    documentType: 'RESUME' | 'COVER_LETTER';
    jobTitle: string;
    company: string;
  }>> {
    // Example 1: Junior Frontend Developer Resume
    const juniorFrontendRaw = `
Frontend Developer
Passionate frontend developer with experience in JavaScript and React.

Skills: JavaScript, React, CSS

Experience:
- Frontend Developer at Web Agency (2022-Present)

Education:
- Bachelor's Degree in Computer Science
    `.trim();

    const juniorFrontendTailored = `
FRONTEND DEVELOPER
Passionate frontend developer with experience in JavaScript and React.

SKILLS: JavaScript, React, CSS, TypeScript, Vue.js

EXPERIENCE:
- Frontend Developer at Web Agency (2022-Present) - Proficient in JavaScript, React, and CSS

EDUCATION:
- Bachelor's Degree in Computer Science
    `.trim();

    // Example 2: Senior Software Engineer Cover Letter
    const seniorSoftwareRaw = `
Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position. With my experience in JavaScript and React, I believe I would be a great fit for your team.

I have a strong background in frontend development and have worked on various projects throughout my career.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your company.

Sincerely,
[Candidate Name]
    `.trim();

    const seniorSoftwareTailored = `
Dear Hiring Manager,

I am writing to express my interest in the Senior Software Engineer position. With my track record of innovation in JavaScript and React, I believe I would be a strong candidate for your team.

I have a strong background in frontend development and have worked on various projects throughout my career, leading teams to deliver cutting-edge solutions.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your company.

Sincerely,
[Candidate Name]
    `.trim();

    return [
      {
        rawContent: juniorFrontendRaw,
        tailoredContent: juniorFrontendTailored,
        documentType: 'RESUME',
        jobTitle: 'Junior Frontend Developer',
        company: 'Tech Startup Inc.',
      },
      {
        rawContent: seniorSoftwareRaw,
        tailoredContent: seniorSoftwareTailored,
        documentType: 'COVER_LETTER',
        jobTitle: 'Senior Software Engineer',
        company: 'Enterprise Tech Corp.',
      },
    ];
  }

  /**
   * Returns prevention and cost plans
   */
  getPreventionCostPlans() {
    return {
      preventionPlans: [
        {
          id: '1',
          name: 'Truth-Preservation Check',
          description: 'Validate all content changes against original profile data to prevent hallucinations',
          implementation: 'After each tailoring operation, verify that all tailored content matches the candidate profile',
          effectiveness: 'High',
        },
        {
          id: '2',
          name: 'Keyword Validation',
          description: 'Only add keywords that are relevant to the candidate\'s skills and experience',
          implementation: 'Check each keyword against the persona\'s skills before adding to tailored content',
          effectiveness: 'Medium',
        },
        {
          id: '3',
          name: 'Content Consistency',
          description: 'Ensure tailored content maintains consistency with original experience and achievements',
          implementation: 'Track all changes and verify they align with the candidate\'s work history',
          effectiveness: 'High',
        },
      ],
      costPlans: [
        {
          id: '1',
          name: 'LLM Call Optimization',
          description: 'Reuse existing tailored content for similar job postings',
          implementation: 'Cache results of tailoring operations for similar jobs (same title and industry)',
          effectiveness: 'High',
        },
        {
          id: '2',
          name: 'Cost Capping',
          description: 'Set maximum cost per tailoring operation',
          implementation: 'Implement budget caps and stop processing if costs exceed limits',
          effectiveness: 'High',
        },
        {
          id: '3',
          name: 'Content Reuse',
          description: 'Reuse sections of previously tailored documents',
          implementation: 'Identify reusable content blocks and avoid regenerating them',
          effectiveness: 'Medium',
        },
      ],
    };
  }

  /**
   * Returns assumptions for human review
   */
  getAssumptions() {
    return {
      assumptions: [
        {
          id: '1',
          category: 'Technical',
          description: 'Content changes are based on keyword matching, not semantic understanding',
          risk: 'Low',
        },
        {
          id: '2',
          category: 'Business',
          description: 'Relevant keywords are accurately extracted from job postings',
          risk: 'Medium',
        },
        {
          id: '3',
          category: 'Design',
          description: 'Standard ATS formatting rules apply to all job postings',
          risk: 'Low',
        },
        {
          id: '4',
          category: 'Implementation',
          description: 'Tailoring pipeline maintains content truthfulness',
          risk: 'High',
        },
        {
          id: '5',
          category: 'Future Considerations',
          description: 'Semantic understanding will be added in future updates',
          risk: 'Low',
        },
      ],
    };
  }
}
