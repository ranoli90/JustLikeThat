import { Injectable, Logger } from '@nestjs/common';
import { JobPosting } from '../../entities/job-posting.entity';
import { Persona } from '../../entities/persona.entity';

export interface KeywordAnalysis {
  targetKeywords: TargetKeyword[];
  missingKeywords: string[];
  overusedKeywords: string[];
  keywordDensity: Record<string, number>;
  recommendations: KeywordRecommendation[];
}

export interface TargetKeyword {
  keyword: string;
  frequency: number;
  importance: number; // 1-10
  context: string;
  shouldInclude: boolean;
}

export interface KeywordRecommendation {
  keyword: string;
  action: 'add' | 'remove' | 'rephrase';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedPlacement: string;
}

export interface KeywordOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  changes: KeywordChange[];
  analysis: KeywordAnalysis;
}

export interface KeywordChange {
  type: 'added' | 'removed' | 'modified';
  keyword: string;
  location: string;
  reason: string;
}

@Injectable()
export class KeywordOptimizationService {
  private readonly logger = new Logger(KeywordOptimizationService.name);

  // Common job-related keywords by category
  private readonly keywordCategories: {
    technical: string[];
    'soft-skills': string[];
    management: string[];
    'industry-specific': Record<string, string[]>;
  } = {
    'technical': [
      'programming', 'software development', 'web development', 'mobile development',
      'cloud computing', 'aws', 'azure', 'gcp', 'devops', 'ci/cd', 'agile', 'scrum',
      'api', 'rest', 'graphql', 'microservices', 'database', 'sql', 'nosql',
      'machine learning', 'artificial intelligence', 'data science', 'python',
      'javascript', 'typescript', 'java', 'react', 'angular', 'node.js',
    ],
    'soft-skills': [
      'communication', 'teamwork', 'leadership', 'problem-solving', 'critical thinking',
      'collaboration', 'time management', 'adaptability', 'creativity', 'initiative',
      'attention to detail', 'organization', 'analytical', 'interpersonal',
    ],
    'management': [
      'project management', 'team leadership', 'strategic planning', 'budget management',
      'stakeholder management', 'resource allocation', 'risk management', 'performance optimization',
      'process improvement', 'vendor management', 'contract negotiation',
    ],
    'industry-specific': {
      'technology': ['digital transformation', 'cloud migration', 'cybersecurity', 'data privacy'],
      'finance': ['financial analysis', 'risk assessment', 'compliance', 'regulatory'],
      'healthcare': ['patient care', 'clinical', 'hipaa', 'electronic health records'],
      'marketing': ['digital marketing', 'seo', 'content strategy', 'analytics'],
      'sales': ['pipeline management', 'client relations', 'revenue growth', 'quota'],
    },
  };

  /**
   * Analyzes keywords in content against job requirements
   */
  analyzeKeywords(
    content: string,
    jobPosting: JobPosting,
    persona: Persona,
  ): KeywordAnalysis {
    const extractedKeywords = this.extractKeywordsFromJob(jobPosting);
    const contentKeywords = this.analyzeContentKeywords(content);
    const personaKeywords = this.getPersonaKeywords(persona);

    // Identify target keywords
    const targetKeywords: TargetKeyword[] = extractedKeywords.map(kw => ({
      keyword: kw,
      frequency: contentKeywords[kw.toLowerCase()] || 0,
      importance: this.calculateKeywordImportance(kw, jobPosting),
      context: this.getKeywordContext(kw, content),
      shouldInclude: this.shouldIncludeKeyword(kw, persona),
    }));

    // Find missing keywords
    const missingKeywords = targetKeywords
      .filter(kw => kw.frequency === 0 && kw.shouldInclude)
      .sort((a, b) => b.importance - a.importance)
      .map(kw => kw.keyword);

    // Find overused keywords
    const overusedKeywords = Object.entries(contentKeywords)
      .filter(([_, freq]) => freq > 5)
      .map(([kw, _]) => kw);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      targetKeywords,
      missingKeywords,
      overusedKeywords,
      content,
    );

    return {
      targetKeywords,
      missingKeywords,
      overusedKeywords,
      keywordDensity: contentKeywords,
      recommendations,
    };
  }

  /**
   * Optimizes content by adding/removing keywords
   */
  optimizeKeywords(
    content: string,
    jobPosting: JobPosting,
    persona: Persona,
    options: {
      addMissingKeywords?: boolean;
      removeOverusedKeywords?: boolean;
      targetKeywordDensity?: number;
    } = {},
  ): KeywordOptimizationResult {
    const analysis = this.analyzeKeywords(content, jobPosting, persona);
    let optimized = content;
    const changes: KeywordChange[] = [];

    if (options.addMissingKeywords !== false) {
      // Add missing high-priority keywords
      for (const keyword of analysis.missingKeywords.slice(0, 5)) {
        const placement = this.findBestPlacement(keyword, optimized);
        optimized = this.insertKeyword(optimized, keyword, placement);
        changes.push({
          type: 'added',
          keyword,
          location: placement.section,
          reason: `Missing important keyword for job alignment`,
        });
      }
    }

    if (options.removeOverusedKeywords !== false) {
      // Reduce overused keywords
      for (const keyword of analysis.overusedKeywords) {
        optimized = this.removeKeywordOccurrence(optimized, keyword);
        changes.push({
          type: 'removed',
          keyword,
          location: 'throughout document',
          reason: 'Keyword overused - reduced for better readability',
        });
      }
    }

    // Recalculate analysis on optimized content
    const newAnalysis = this.analyzeKeywords(optimized, jobPosting, persona);

    return {
      originalContent: content,
      optimizedContent: optimized,
      changes,
      analysis: newAnalysis,
    };
  }

  /**
   * Extracts keywords from job posting
   */
  extractKeywordsFromJob(jobPosting: JobPosting): string[] {
    const keywords = new Set<string>();
    const text = `${jobPosting.title} ${jobPosting.description} ${jobPosting.requirements}`;
    
    // Extract from title
    const titleWords = jobPosting.title?.split(/\s+/) || [];
    titleWords.forEach(word => {
      if (word.length > 3 && !this.isStopWord(word)) {
        keywords.add(word.toLowerCase());
      }
    });

    // Extract from description using patterns
    const skillPatterns = [
      /(?:proficient|experienced|familiar|knowledge|skills?)\s+(?:in|with|of)\s+([a-z\s,]+)/gi,
      /(?:experience|background)\s+(?:with|in)\s+([a-z\s,]+)/gi,
      /(?:required|preferred)[:\s]+([a-z\s,]+)/gi,
    ];

    skillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const words = match[1].split(/[,;]/);
        words.forEach(word => {
          const cleaned = word.trim().toLowerCase();
          if (cleaned.length > 2 && cleaned.length < 50) {
            keywords.add(cleaned);
          }
        });
      }
    });

    // Add common technical keywords found in description
    const allKeywords = Array.from(keywords);
    this.keywordCategories.technical.forEach(tech => {
      if (text.toLowerCase().includes(tech)) {
        keywords.add(tech);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Analyzes keyword frequency in content
   */
  analyzeContentKeywords(content: string): Record<string, number> {
    const keywords: Record<string, number> = {};
    const words = content.toLowerCase().split(/\s+/);
    
    // Simple bigram and unigram extraction
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z]/g, '');
      if (word.length > 2) {
        keywords[word] = (keywords[word] || 0) + 1;
      }

      // Check for bigrams
      if (i < words.length - 1) {
        const bigram = `${word} ${words[i + 1].replace(/[^a-z]/g, '')}`;
        if (bigram.length > 3) {
          keywords[bigram] = (keywords[bigram] || 0) + 0.5;
        }
      }
    }

    return keywords;
  }

  /**
   * Gets keywords from persona
   */
  getPersonaKeywords(persona: Persona): string[] {
    const keywords: string[] = [];
    
    if (persona.skills) {
      const skills = Array.isArray(persona.skills) ? persona.skills : [];
      keywords.push(...skills.map(s => s.toLowerCase()));
    }
    
    if (persona.jobTitle) {
      keywords.push(persona.jobTitle.toLowerCase());
    }
    
    return keywords;
  }

  /**
   * Calculates keyword importance based on job posting
   */
  private calculateKeywordImportance(keyword: string, jobPosting: JobPosting): number {
    const lowerKeyword = keyword.toLowerCase();
    const title = jobPosting.title?.toLowerCase() || '';
    const description = jobPosting.description?.toLowerCase() || '';
    const requirements = Array.isArray(jobPosting.requirements) 
      ? jobPosting.requirements.join(' ').toLowerCase() 
      : '';

    let importance = 5; // Base importance

    // Check if keyword is in title
    if (title.includes(lowerKeyword)) {
      importance += 3;
    }

    // Check if keyword is repeated
    const occurrences = (description + requirements).split(lowerKeyword).length - 1;
    importance += Math.min(occurrences, 3);

    // Check if it's a hard requirement
    if (requirements.includes('required') || requirements.includes('must have')) {
      importance += 2;
    }

    return Math.min(10, importance);
  }

  /**
   * Determines if keyword should be included based on persona
   */
  private shouldIncludeKeyword(keyword: string, persona: Persona): boolean {
    const skills = Array.isArray(persona.skills) ? persona.skills : [];
    const personaSkillsLower = skills.map(s => s.toLowerCase());
    const keywordLower = keyword.toLowerCase();

    // Check if persona has this skill
    const hasSkill = personaSkillsLower.some(skill => 
      skill.includes(keywordLower) || keywordLower.includes(skill)
    );

    return hasSkill;
  }

  /**
   * Finds context around keyword in content
   */
  private getKeywordContext(keyword: string, content: string): string {
    const regex = new RegExp(`.{0,50}${keyword}.{0,50}`, 'i');
    const match = content.match(regex);
    return match ? match[0] : '';
  }

  /**
   * Finds the best placement for a keyword
   */
  private findBestPlacement(keyword: string, content: string): { section: string; afterLine: number } {
    const lines = content.split('\n');
    
    // Priority: Skills section > Summary > Experience > anywhere
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('skill')) {
        return { section: 'skills', afterLine: i };
      }
      if (line.includes('summary') || line.includes('objective')) {
        return { section: 'summary', afterLine: i };
      }
      if (line.includes('experience') || line.includes('work history')) {
        return { section: 'experience', afterLine: i };
      }
    }

    return { section: 'body', afterLine: Math.floor(lines.length / 2) };
  }

  /**
   * Inserts keyword at best location
   */
  private insertKeyword(
    content: string,
    keyword: string,
    placement: { section: string; afterLine: number },
  ): string {
    const lines = content.split('\n');
    
    if (placement.section === 'skills' && placement.afterLine < lines.length) {
      // Add to skills line
      lines[placement.afterLine] += `, ${keyword}`;
    } else if (placement.section === 'summary') {
      // Add to summary
      const summaryIndex = lines.findIndex(l => 
        l.toLowerCase().includes('summary')
      );
      if (summaryIndex >= 0) {
        lines[summaryIndex] += ` Strong expertise in ${keyword}.`;
      }
    } else {
      // Add as bullet point
      const insertIndex = Math.min(placement.afterLine + 1, lines.length);
      lines.splice(insertIndex, 0, `- ${keyword}`);
    }

    return lines.join('\n');
  }

  /**
   * Removes a keyword occurrence
   */
  private removeKeywordOccurrence(content: string, keyword: string): string {
    // Remove every other occurrence
    const lines = content.split('\n');
    let removed = 0;
    
    const filteredLines = lines.map(line => {
      if (line.toLowerCase().includes(keyword.toLowerCase()) && removed < 2) {
        removed++;
        return '';
      }
      return line;
    });

    return filteredLines.join('\n').replace(/\n\n+/g, '\n\n');
  }

  /**
   * Generates keyword recommendations
   */
  private generateRecommendations(
    targetKeywords: TargetKeyword[],
    missingKeywords: string[],
    overusedKeywords: string[],
    content: string,
  ): KeywordRecommendation[] {
    const recommendations: KeywordRecommendation[] = [];

    // High priority additions
    missingKeywords.slice(0, 3).forEach(keyword => {
      recommendations.push({
        keyword,
        action: 'add',
        priority: 'high',
        reason: 'Critical keyword missing from job description',
        suggestedPlacement: 'Skills section or summary',
      });
    });

    // Medium priority additions
    missingKeywords.slice(3, 7).forEach(keyword => {
      recommendations.push({
        keyword,
        action: 'add',
        priority: 'medium',
        reason: 'Recommended keyword for better job alignment',
        suggestedPlacement: 'Experience descriptions',
      });
    });

    // Overused keywords
    overusedKeywords.forEach(keyword => {
      recommendations.push({
        keyword,
        action: 'remove',
        priority: 'low',
        reason: 'Keyword appears to be overused',
        suggestedPlacement: 'Reduce usage',
      });
    });

    return recommendations;
  }

  /**
   * Checks if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'for', 'that', 'with', 'this', 'have', 'from',
      'they', 'will', 'would', 'could', 'should', 'what', 'when',
      'where', 'who', 'how', 'which', 'their', 'there', 'been',
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Gets keyword suggestions for a job category
   */
  getKeywordSuggestions(industry: string): string[] {
    const suggestions: string[] = [];
    
    // Add industry-specific keywords
    const industryKeywords = this.keywordCategories['industry-specific']?.[industry] || [];
    suggestions.push(...industryKeywords);
    
    // Add relevant technical keywords
    suggestions.push(...this.keywordCategories.technical.slice(0, 10));
    
    // Add soft skills
    suggestions.push(...this.keywordCategories['soft-skills'].slice(0, 5));
    
    return [...new Set(suggestions)];
  }
}
