import { Injectable, Logger } from '@nestjs/common';
import { MLInfrastructureService } from './ml-infrastructure.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DTO for NLU analysis input
 */
export interface NLUAnalysisInput {
  text: string;
  language?: string;
  analysisType?: 'full' | 'entities' | 'sentiment' | 'skills';
}

/**
 * DTO for NLU analysis result
 */
export interface NLUAnalysisResult {
  entities: NamedEntity[];
  sentiment: SentimentResult;
  keyPhrases: string[];
  skillsExtracted: ExtractedSkill[];
  language: string;
  summary: string;
}

/**
 * Named entity
 */
export interface NamedEntity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'SKILL' | 'EDUCATION' | 'CERTIFICATION' | 'OTHER';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Sentiment result
 */
export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  aspects: AspectSentiment[];
}

/**
 * Aspect-based sentiment
 */
export interface AspectSentiment {
  aspect: string;
  sentiment: number;
  evidence: string[];
}

/**
 * Extracted skill
 */
export interface ExtractedSkill {
  name: string;
  category: 'technical' | 'soft' | 'domain' | 'tool' | 'language' | 'framework';
  confidence: number;
  context?: string;
  normalizedName?: string;
}

/**
 * NLU Processing Service for Semantic Understanding
 * Implements job description parsing, skill extraction, and semantic analysis
 */
@Injectable()
export class NLUProcessingService {
  private readonly logger = new Logger(NLUProcessingService.name);
  
  // Skill categories and synonyms
  private readonly skillCategories: Record<string, string[]> = {
    technical: ['python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'scala', 'kotlin', 'swift', 'typescript', 'sql', 'nosql', 'html', 'css', 'react', 'angular', 'vue', 'node', 'django', 'flask', 'spring', 'express', 'fastapi', 'tensorflow', 'pytorch', 'keras', 'machine learning', 'deep learning', 'data science', 'data engineering', 'devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'microservices', 'api', 'rest', 'graphql', 'microservices'],
    soft: ['leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking', 'creativity', 'adaptability', 'time management', 'organization', 'collaboration', 'presentation', 'negotiation', 'mentoring', 'coaching', 'conflict resolution', 'decision making', 'analytical thinking', 'attention to detail', 'initiative', 'work ethic'],
    domain: ['finance', 'healthcare', 'e-commerce', 'fintech', 'biotech', 'pharma', 'manufacturing', 'retail', 'education', 'government', 'nonprofit', 'media', 'entertainment', 'gaming', 'telecommunications', 'transportation', 'logistics', 'real estate', 'insurance'],
    tool: ['jira', 'confluence', 'slack', 'teams', 'git', 'github', 'gitlab', 'bitbucket', 'jenkins', 'circleci', 'travis', 'docker', 'terraform', 'ansible', 'prometheus', 'grafana', 'elk', 'splunk', 'jira', 'trello', 'asana', 'notion'],
    language: ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese', 'italian', 'russian', 'arabic', 'hindi', 'mandarin', 'cantonese'],
    framework: ['react', 'angular', 'vue', 'nextjs', 'nestjs', 'express', 'fastify', 'spring boot', 'laravel', 'django', 'flask', 'rails', 'dotnet', 'react native', 'flutter', 'ionic'],
  };

  // Common bigrams and trigrams for skill detection
  private readonly skillPhrases: Record<string, string[]> = {
    'machine learning': ['machine learning', 'ml', 'ml models', 'deep learning', 'neural network', 'nlp', 'natural language processing', 'computer vision'],
    'data science': ['data science', 'data scientist', 'data analysis', 'data analytics', 'predictive analytics', 'statistical analysis'],
    'cloud computing': ['cloud computing', 'cloud services', 'cloud architecture', 'aws', 'azure', 'gcp', 'cloud native'],
    'project management': ['project management', 'project manager', 'pmp', 'agile', 'scrum', 'kanban', 'waterfall'],
    'software development': ['software development', 'software engineering', 'software development life cycle', 'sdlc', 'devops', 'sre'],
  };

  constructor(
    private readonly mlInfrastructure: MLInfrastructureService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Full NLU analysis
   */
  async analyze(input: NLUAnalysisInput): Promise<NLUAnalysisResult> {
    const startTime = Date.now();

    try {
      // Detect language
      const language = input.language || await this.detectLanguage(input.text);

      // Extract entities
      const entities = await this.extractEntities(input.text);

      // Analyze sentiment
      const sentiment = await this.analyzeSentiment(input.text);

      // Extract key phrases
      const keyPhrases = await this.extractKeyPhrases(input.text);

      // Extract skills
      const skillsExtracted = await this.extractSkills(input.text);

      // Generate summary
      const summary = this.generateSummary(input.text, entities, keyPhrases);

      const processingTime = Date.now() - startTime;
      this.logger.log(`NLU analysis completed in ${processingTime}ms`);

      // Store analysis result
      await this.storeAnalysisResult('general', input.text.substring(0, 100), {
        entities,
        sentiment,
        keyPhrases,
        skillsExtracted,
      });

      return {
        entities,
        sentiment,
        keyPhrases,
        skillsExtracted,
        language,
        summary,
      };
    } catch (error) {
      this.logger.error(`NLU analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract skills from text
   */
  async extractSkills(text: string): Promise<ExtractedSkill[]> {
    const skills: ExtractedSkill[] = [];
    const textLower = text.toLowerCase();

    // Check skill phrases first (multi-word skills)
    for (const [skill, phrases] of Object.entries(this.skillPhrases)) {
      for (const phrase of phrases) {
        if (textLower.includes(phrase)) {
          skills.push({
            name: skill,
            category: this.categorizeSkill(skill),
            confidence: 0.9,
            context: phrase,
            normalizedName: skill,
          });
        }
      }
    }

    // Check individual skill keywords
    for (const [category, keywords] of Object.entries(this.skillCategories)) {
      for (const keyword of keywords) {
        // Avoid duplicates
        if (skills.some(s => s.name.toLowerCase() === keyword)) continue;
        
        if (textLower.includes(keyword)) {
          skills.push({
            name: keyword,
            category: category as any,
            confidence: 0.85,
            context: keyword,
            normalizedName: this.normalizeSkillName(keyword),
          });
        }
      }
    }

    // Remove duplicates based on normalized name
    const uniqueSkills = skills.reduce((acc, skill) => {
      const key = skill.normalizedName || skill.name.toLowerCase();
      if (!acc[key]) {
        acc[key] = skill;
      }
      return acc;
    }, {} as Record<string, ExtractedSkill>);

    return Object.values(uniqueSkills).slice(0, 50);
  }

  /**
   * Calculate semantic similarity between two texts
   */
  async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    const embedding1 = await this.mlInfrastructure.getEmbedding(text1);
    const embedding2 = await this.mlInfrastructure.getEmbedding(text2);
    
    return this.mlInfrastructure.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Parse job description and extract requirements
   */
  async parseJobDescription(jobDescription: string): Promise<JobRequirements> {
    const startTime = Date.now();

    try {
      // Extract skills
      const skills = await this.extractSkills(jobDescription);
      
      // Extract entities
      const entities = await this.extractEntities(jobDescription);
      
      // Extract key phrases
      const keyPhrases = await this.extractKeyPhrases(jobDescription);
      
      // Analyze sentiment (for company culture hints)
      const sentiment = await this.analyzeSentiment(jobDescription);
      
      // Categorize requirements
      const requirements = this.categorizeRequirements(jobDescription);
      
      // Detect priorities
      const priorities = this.detectPriorities(jobDescription);
      
      // Extract company culture indicators
      const cultureIndicators = this.extractCultureIndicators(jobDescription);
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Job description parsing completed in ${processingTime}ms`);

      return {
        skills,
        requirements,
        priorities,
        cultureIndicators,
        keyPhrases,
        entities,
        overallSentiment: sentiment,
      };
    } catch (error) {
      this.logger.error(`Job description parsing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Normalize skills for matching
   */
  async normalizeSkills(skills: string[]): Promise<ExtractedSkill[]> {
    return this.extractSkills(skills.join(' '));
  }

  /**
   * Store NLU analysis result
   */
  private async storeAnalysisResult(
    targetType: string,
    targetId: string,
    result: any,
  ): Promise<void> {
    try {
      await this.prisma.nLPAnalysis.create({
        data: {
          targetType,
          targetId,
          entities: result.entities || [],
          sentiment: result.sentiment?.score || 0,
          keyPhrases: result.keyPhrases || [],
          skillsExtracted: result.skillsExtracted || [],
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to store NLU analysis: ${error.message}`);
    }
  }

  /**
   * Detect language
   */
  private async detectLanguage(text: string): Promise<string> {
    // Simplified language detection
    const languagePatterns: Record<string, RegExp[]> = {
      english: [/the/, /is/, /are/, /was/, /were/, /have/, /has/, /will/],
      spanish: [/el/, /la/, /es/, /son/, /fue/, /fueron/, /tiene/, /tienen/],
      german: [/der/, /die/, /das/, /ist/, /sind/, /war/, /waren/, /hat/, /haben/],
      french: [/le/, /la/, /les/, /est/, /sont/, /été/, /avoir/, /ont/],
    };

    const scores: Record<string, number> = {};
    const sample = text.toLowerCase().slice(0, 500);

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      scores[lang] = patterns.reduce((sum, pattern) => {
        const matches = sample.match(pattern);
        return sum + (matches ? matches.length : 0);
      }, 0);
    }

    const detectedLang = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'english';
    return detectedLang;
  }

  /**
   * Extract named entities
   */
  private async extractEntities(text: string): Promise<NamedEntity[]> {
    const entities: NamedEntity[] = [];
    const textLower = text.toLowerCase();

    // Skill entities
    const skills = await this.extractSkills(text);
    skills.forEach(skill => {
      const index = textLower.indexOf(skill.name.toLowerCase());
      if (index !== -1) {
        entities.push({
          text: skill.name,
          type: 'SKILL',
          confidence: skill.confidence,
          startIndex: index,
          endIndex: index + skill.name.length,
        });
      }
    });

    // Education entities
    const educationKeywords = ['bachelor', 'master', 'phd', 'mba', 'bs', 'ms', 'ba', 'ma', 'associate', 'degree', 'diploma', 'certification'];
    educationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}'?s?\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'EDUCATION',
          confidence: 0.8,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    });

    // Location entities
    const locationKeywords = ['remote', 'hybrid', 'on-site', 'office', 'location', 'city', 'state', 'country'];
    locationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'LOCATION',
          confidence: 0.7,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    });

    return entities.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Analyze sentiment
   */
  private async analyzeSentiment(text: string): Promise<SentimentResult> {
    const positiveWords = ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'strong', 'ideal', 'perfect', 'innovative', 'collaborative', 'growth', 'opportunity', 'rewarding', 'challenging'];
    const negativeWords = ['difficult', 'challenging', 'demanding', 'stressful', 'pressure', 'tight', 'urgent', 'critical', 'failure', 'risk'];

    const textLower = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'gi'));
      if (matches) positiveCount += matches.length;
    });

    negativeWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'gi'));
      if (matches) negativeCount += matches.length;
    });

    const total = positiveCount + negativeCount;
    let score = 0;
    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
    }

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.2) label = 'positive';
    else if (score < -0.2) label = 'negative';

    return {
      score,
      label,
      confidence: Math.min(0.5 + total * 0.1, 0.95),
      aspects: [],
    };
  }

  /**
   * Extract key phrases
   */
  private async extractKeyPhrases(text: string): Promise<string[]> {
    const phrases: string[] = [];
    const words = text.split(/\s+/);
    
    // Extract bigrams and trigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`.toLowerCase().replace(/[^a-z\s]/g, '');
      if (bigram.length > 5) phrases.push(bigram);
      
      if (i < words.length - 2) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase().replace(/[^a-z\s]/g, '');
        if (trigram.length > 8) phrases.push(trigram);
      }
    }

    // Extract capitalized phrases (likely proper nouns)
    const capitalizedRegex = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g;
    const matches = text.match(capitalizedRegex);
    if (matches) {
      phrases.push(...matches.slice(0, 5));
    }

    // Return unique phrases
    return [...new Set(phrases)].slice(0, 20);
  }

  /**
   * Generate summary
   */
  private generateSummary(text: string, entities: NamedEntity[], keyPhrases: string[]): string {
    const skills = entities.filter(e => e.type === 'SKILL').map(e => e.text);
    const jobTitle = keyPhrases.find(p => 
      ['engineer', 'developer', 'manager', 'analyst', 'designer', 'architect', 'specialist', 'consultant'].some(
        title => p.includes(title)
      )
    ) || 'position';

    return `${jobTitle} requiring ${skills.slice(0, 5).join(', ')} skills`;
  }

  /**
   * Categorize skill
   */
  private categorizeSkill(skillName: string): 'technical' | 'soft' | 'domain' | 'tool' | 'language' | 'framework' {
    const name = skillName.toLowerCase();
    
    if (this.skillCategories.language?.some(l => name.includes(l))) return 'language';
    if (this.skillCategories.framework?.some(f => name.includes(f))) return 'framework';
    if (this.skillCategories.tool?.some(t => name.includes(t))) return 'tool';
    if (this.skillCategories.soft?.some(s => name.includes(s))) return 'soft';
    if (this.skillCategories.domain?.some(d => name.includes(d))) return 'domain';
    return 'technical';
  }

  /**
   * Normalize skill name
   */
  private normalizeSkillName(name: string): string {
    return name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Categorize requirements
   */
  private categorizeRequirements(text: string): RequirementCategory[] {
    const categories: RequirementCategory[] = [];
    const sections = text.split(/\n\n|\n(?=[A-Z])/);

    const requirementKeywords = {
      required: ['required', 'must have', 'essential', 'mandatory', 'minimum'],
      preferred: ['preferred', 'nice to have', 'bonus', 'plus', 'desired'],
      responsibilities: ['responsibilities', 'duties', 'what you will', 'you will'],
      benefits: ['benefits', 'perks', 'we offer', 'we provide'],
    };

    for (const section of sections) {
      const sectionLower = section.toLowerCase();
      let category: 'required' | 'preferred' | 'responsibilities' | 'benefits' = 'required';

      for (const [cat, keywords] of Object.entries(requirementKeywords)) {
        if (keywords.some(kw => sectionLower.includes(kw))) {
          category = cat as any;
          break;
        }
      }

      categories.push({
        category,
        text: section.substring(0, 500),
        items: section.split(/\n/).filter(l => l.trim()).slice(0, 10),
      });
    }

    return categories;
  }

  /**
   * Detect priorities
   */
  private detectPriorities(text: string): PriorityItem[] {
    const priorities: PriorityItem[] = [];
    const priorityIndicators = {
      high: ['must', 'required', 'essential', 'critical', 'mandatory', '5+ years', '10+ years'],
      medium: ['should', 'preferred', 'desired', '3+ years', '5 years'],
      low: ['nice to have', 'bonus', 'plus', 'can', 'may'],
    };

    const lines = text.split('\n');
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      if (priorityIndicators.high.some(i => lineLower.includes(i))) {
        priorities.push({ text: line.trim(), priority: 'high' });
      } else if (priorityIndicators.medium.some(i => lineLower.includes(i))) {
        priorities.push({ text: line.trim(), priority: 'medium' });
      } else if (priorityIndicators.low.some(i => lineLower.includes(i))) {
        priorities.push({ text: line.trim(), priority: 'low' });
      }
    }

    return priorities.slice(0, 15);
  }

  /**
   * Extract culture indicators
   */
  private extractCultureIndicators(text: string): CultureIndicator[] {
    const indicators: CultureIndicator[] = [];
    const textLower = text.toLowerCase();

    const cultureKeywords = {
      innovation: ['innovative', 'cutting-edge', 'disruptive', 'forward-thinking', 'pioneering'],
      collaboration: ['collaborative', 'team-oriented', 'cross-functional', 'teamwork', 'together'],
      workLifeBalance: ['flexible', 'remote', 'hybrid', 'work-life', 'balance', 'unlimited pto'],
      growth: ['growth', 'learning', 'development', 'career progression', 'mentorship'],
      diversity: ['diverse', 'inclusive', 'equal opportunity', 'belonging', 'equity'],
    };

    for (const [culture, keywords] of Object.entries(cultureKeywords)) {
      const matches = keywords.filter(kw => textLower.includes(kw));
      if (matches.length > 0) {
        indicators.push({
          dimension: culture,
          strength: matches.length / keywords.length,
          evidence: matches,
        });
      }
    }

    return indicators;
  }
}

/**
 * Job requirements extracted from description
 */
export interface JobRequirements {
  skills: ExtractedSkill[];
  requirements: RequirementCategory[];
  priorities: PriorityItem[];
  cultureIndicators: CultureIndicator[];
  keyPhrases: string[];
  entities: NamedEntity[];
  overallSentiment: SentimentResult;
}

/**
 * Requirement category
 */
export interface RequirementCategory {
  category: 'required' | 'preferred' | 'responsibilities' | 'benefits';
  text: string;
  items: string[];
}

/**
 * Priority item
 */
export interface PriorityItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Culture indicator
 */
export interface CultureIndicator {
  dimension: string;
  strength: number;
  evidence: string[];
}
