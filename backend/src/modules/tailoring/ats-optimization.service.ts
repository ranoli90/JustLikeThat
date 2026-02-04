import { Injectable, Logger } from '@nestjs/common';

export interface ATSCheckResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categoryScores: CategoryScore[];
  issues: ATSIssue[];
  suggestions: ATSSuggestion[];
  keywordAnalysis: KeywordAnalysis;
  formattingScore: number;
  readabilityScore: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  details: string;
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  location?: string;
  suggestion: string;
}

export interface ATSSuggestion {
  category: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  example?: string;
}

export interface KeywordAnalysis {
  found: string[];
  missing: string[];
  density: Record<string, number>;
  relevanceScore: number;
}

export interface ATSOptimizationOptions {
  targetJobTitle?: string;
  targetCompany?: string;
  requiredKeywords?: string[];
  preferredKeywords?: string[];
  industry?: string;
  experienceLevel?: 'JUNIOR' | 'MID' | 'SENIOR' | 'EXECUTIVE';
}

@Injectable()
export class ATSOptimizationService {
  private readonly logger = new Logger(ATSOptimizationService.name);

  // Common ATS systems and their parsing behaviors
  private readonly atsSystems = [
    { name: 'Workday', compatibility: 0.95, notes: 'Handles standard formats well' },
    { name: 'Greenhouse', compatibility: 0.92, notes: 'Good with clean formatting' },
    { name: 'Lever', compatibility: 0.90, notes: 'Prefers simple layouts' },
    { name: 'iCIMS', compatibility: 0.88, notes: 'Requires standard section headers' },
    { name: ' Taleo', compatibility: 0.85, notes: 'Can struggle with complex formatting' },
    { name: 'Bullhorn', compatibility: 0.87, notes: 'Best with ATS-friendly resumes' },
  ];

  // Industry-specific keyword weights
  private readonly industryKeywords: Record<string, string[]> = {
    'technology': [
      'software development', 'programming', 'agile', 'scrum', 'devops', 'cloud',
      'aws', 'azure', 'kubernetes', 'docker', 'microservices', 'api', 'rest',
      'javascript', 'python', 'java', 'react', 'node.js', 'machine learning'
    ],
    'finance': [
      'financial analysis', 'risk management', 'compliance', 'audit', 'forecasting',
      'budgeting', 'accounting', 'tax planning', 'investment', 'portfolio management',
      'financial modeling', 'excel', 'sql', 'blockchain', 'fintech'
    ],
    'marketing': [
      'digital marketing', 'seo', 'sem', 'content strategy', 'social media',
      'analytics', 'google analytics', 'hubspot', 'salesforce', 'campaign management',
      'brand management', 'customer acquisition', 'conversion optimization'
    ],
    'healthcare': [
      'patient care', 'clinical', 'hipaa', 'electronic health records', 'ehr',
      'medical coding', 'healthcare compliance', 'quality assurance', 'cpt codes',
      'icd-10', 'healthcare analytics', 'telehealth'
    ],
    'sales': [
      'sales operations', 'pipeline management', 'crm', 'salesforce', 'negotiation',
      'client relations', 'revenue growth', 'quota attainment', 'lead generation',
      'account management', 'b2b sales', 'enterprise sales'
    ],
  };

  /**
   * Performs a comprehensive ATS check on the document
   */
  analyzeDocument(
    content: string,
    jobDescription?: string,
    options: ATSOptimizationOptions = {},
  ): ATSCheckResult {
    const categoryScores = this.calculateCategoryScores(content, jobDescription, options);
    const keywordAnalysis = this.analyzeKeywords(content, jobDescription, options);
    const formattingScore = this.analyzeFormatting(content);
    const readabilityScore = this.analyzeReadability(content);
    const issues = this.identifyIssues(content, keywordAnalysis, formattingScore);
    const suggestions = this.generateSuggestions(issues, keywordAnalysis, options);

    // Calculate overall score
    const totalWeightedScore = categoryScores.reduce(
      (sum, cat) => sum + (cat.score / cat.maxScore) * cat.weight,
      0
    );
    const maxPossibleWeight = categoryScores.reduce((sum, cat) => sum + cat.weight, 0);
    const overallScore = (totalWeightedScore / maxPossibleWeight) * 100;

    // Determine grade
    const grade = this.calculateGrade(overallScore);

    return {
      overallScore,
      grade,
      categoryScores,
      issues,
      suggestions,
      keywordAnalysis,
      formattingScore,
      readabilityScore,
    };
  }

  /**
   * Optimizes content for ATS
   */
  optimizeForATS(
    content: string,
    jobDescription: string,
    options: ATSOptimizationOptions = {},
  ): { optimizedContent: string; changes: string[] } {
    const changes: string[] = [];
    let optimized = content;

    // Extract keywords from job description
    const extractedKeywords = this.extractKeywordsFromJobDescription(jobDescription);
    const targetKeywords = [
      ...(options.requiredKeywords || []),
      ...(options.preferredKeywords || []),
      ...extractedKeywords,
    ];

    // Add missing keywords naturally
    optimized = this.addMissingKeywords(optimized, targetKeywords, changes);

    // Fix formatting issues
    optimized = this.fixFormattingIssues(optimized, changes);

    // Improve section headers
    optimized = this.improveSectionHeaders(optimized, changes);

    // Optimize for keyword density
    optimized = this.optimizeKeywordDensity(optimized, targetKeywords, changes);

    return { optimizedContent: optimized, changes };
  }

  /**
   * Checks document compatibility with common ATS systems
   */
  checkATSCompatibility(content: string): {
    compatible: boolean;
    score: number;
    supportedSystems: string[];
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let compatibilityScore = 100;

    // Check for common ATS issues
    if (this.containsComplexFormatting(content)) {
      issues.push('Document contains complex formatting that may not parse correctly');
      compatibilityScore -= 15;
      recommendations.push('Use simple, standard formatting without text boxes or columns');
    }

    if (this.containsTablesOrGraphics(content)) {
      issues.push('Document contains tables or graphics that ATS may not read');
      compatibilityScore -= 20;
      recommendations.push('Remove tables and graphics; use plain text instead');
    }

    if (!this.hasStandardSectionHeaders(content)) {
      issues.push('Missing standard section headers');
      compatibilityScore -= 10;
      recommendations.push('Use standard headers: Experience, Education, Skills');
    }

    if (this.hasInconsistentSpacing(content)) {
      issues.push('Inconsistent spacing detected');
      compatibilityScore -= 5;
      recommendations.push('Use consistent spacing throughout');
    }

    const supportedSystems = compatibilityScore >= 80
      ? this.atsSystems.filter(s => s.compatibility >= 0.9).map(s => s.name)
      : [];

    return {
      compatible: compatibilityScore >= 70,
      score: compatibilityScore,
      supportedSystems,
      issues,
      recommendations,
    };
  }

  /**
   * Extracts keywords from a job description
   */
  extractKeywordsFromJobDescription(jobDescription: string): string[] {
    const keywords = new Set<string>();
    const text = jobDescription.toLowerCase();

    // Common skill patterns
    const skillPatterns = [
      /([a-z]+(?:\s+[a-z]+)?)\s+experience/i,
      /proficient\s+in\s+([a-z]+(?:\s+[a-z]+)?)/gi,
      /knowledge\s+of\s+([a-z]+(?:\s+[a-z]+)?)/gi,
      /familiarity\s+with\s+([a-z]+(?:\s+[a-z]+)?)/gi,
      /experience\s+with\s+([a-z]+(?:\s+[a-z]+)?)/gi,
    ];

    // Extract phrases from patterns
    for (const pattern of skillPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const keyword = match[1].trim();
        if (keyword.length > 2 && keyword.length < 50) {
          keywords.add(keyword);
        }
      }
    }

    // Add common technical terms
    const technicalTerms = [
      'agile', 'scrum', 'devops', 'ci/cd', 'api', 'rest', 'graphql',
      'javascript', 'typescript', 'python', 'java', 'c#', 'ruby',
      'react', 'angular', 'vue', 'node.js', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'sql', 'nosql', 'mongodb', 'postgres',
      'machine learning', 'data analysis', 'project management',
    ];

    technicalTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.add(term);
      }
    });

    return Array.from(keywords);
  }

  /**
   * Generates an ATS-friendly summary
   */
  generateATSSummary(
    candidateInfo: {
      jobTitle: string;
      yearsExperience: number;
      keySkills: string[];
      achievements: string[];
    },
    targetJob: { title: string; requirements: string[] },
  ): string {
    const summary = [
      `${candidateInfo.jobTitle} with ${candidateInfo.yearsExperience}+ years of experience`,
      `Proficient in ${candidateInfo.keySkills.slice(0, 5).join(', ')}`,
      'Demonstrated track record of',
      candidateInfo.achievements.slice(0, 2).join(' and '),
    ].join('. ');

    return summary;
  }

  // Private helper methods

  private calculateCategoryScores(
    content: string,
    jobDescription?: string,
    options?: ATSOptimizationOptions,
  ): CategoryScore[] {
    const scores: CategoryScore[] = [
      {
        category: 'Keyword Optimization',
        score: 0,
        maxScore: 100,
        weight: 0.25,
        details: 'Keywords found and matched',
      },
      {
        category: 'Formatting',
        score: 0,
        maxScore: 100,
        weight: 0.20,
        details: 'ATS-compatible formatting',
      },
      {
        category: 'Content Structure',
        score: 0,
        maxScore: 100,
        weight: 0.20,
        details: 'Standard section headers and organization',
      },
      {
        category: 'Readability',
        score: 0,
        maxScore: 100,
        weight: 0.15,
        details: 'Language complexity and clarity',
      },
      {
        category: 'Completeness',
        score: 0,
        maxScore: 100,
        weight: 0.20,
        details: 'Required sections and information',
      },
    ];

    // Calculate keyword score
    if (jobDescription) {
      const keywords = this.extractKeywordsFromJobDescription(jobDescription);
      const found = keywords.filter(kw => 
        content.toLowerCase().includes(kw.toLowerCase())
      );
      scores[0].score = (found.length / Math.max(keywords.length, 1)) * 100;
    }

    // Calculate formatting score
    scores[1].score = this.analyzeFormatting(content);

    // Calculate structure score
    scores[2].score = this.analyzeStructure(content);

    // Calculate readability score
    scores[3].score = this.analyzeReadability(content);

    // Calculate completeness score
    scores[4].score = this.analyzeCompleteness(content);

    return scores;
  }

  private analyzeKeywords(
    content: string,
    jobDescription?: string,
    options?: ATSOptimizationOptions,
  ): KeywordAnalysis {
    const found: string[] = [];
    const missing: string[] = [];
    const density: Record<string, number> = {};
    
    const jobKeywords = jobDescription 
      ? this.extractKeywordsFromJobDescription(jobDescription)
      : [];

    const contentLower = content.toLowerCase();
    const totalWords = content.split(/\s+/).length;

    jobKeywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        found.push(keyword);
        // Calculate density
        const regex = new RegExp(keyword, 'gi');
        const matches = contentLower.match(regex) || [];
        density[keyword] = (matches.length / totalWords) * 100;
      } else {
        missing.push(keyword);
      }
    });

    // Calculate relevance score
    const relevanceScore = found.length / Math.max(jobKeywords.length, 1) * 100;

    return { found, missing, density, relevanceScore };
  }

  private analyzeFormatting(content: string): number {
    let score = 100;
    const issues: string[] = [];

    // Check for problematic characters
    if (/[▢▣▤▥▦▧▨▩▪▫]/.test(content)) {
      score -= 10;
      issues.push('Special characters detected');
    }

    // Check for text boxes indicators
    if (/\[\s*\]/.test(content)) {
      score -= 15;
      issues.push('Possible text boxes detected');
    }

    // Check for headers/footers
    if (/\b(Header|Footer|Page\s*\d+)/i.test(content)) {
      score -= 5;
      issues.push('Headers or footers detected');
    }

    // Check for bullet consistency
    const bullets = content.match(/[•\-\*]/g) || [];
    if (bullets.length > 0) {
      const uniqueBullets = new Set(bullets.map(b => b)).size;
      if (uniqueBullets > 1) {
        score -= 5;
      }
    }

    // Check line length
    const lines = content.split('\n');
    const longLines = lines.filter(l => l.length > 100).length;
    if (longLines > lines.length * 0.3) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private analyzeStructure(content: string): number {
    let score = 100;
    const standardHeaders = [
      /EXPERIENCE/i,
      /EDUCATION/i,
      /SKILLS/i,
      /SUMMARY/i,
      /PROFESSIONAL/i,
    ];

    const contentUpper = content.toUpperCase();
    const hasStandardHeaders = standardHeaders.some(h => h.test(contentUpper));

    if (!hasStandardHeaders) {
      score -= 30;
    }

    // Check for consistent indentation
    const lines = content.split('\n');
    const indentations = lines.map(l => l.match(/^\s*/)?.[0]?.length || 0);
    const uniqueIndentations = new Set(indentations).size;
    
    if (uniqueIndentations > 10) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private analyzeReadability(content: string): number {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    if (words.length === 0 || sentences.length === 0) {
      return 50;
    }

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.estimateSyllables(words) / words.length;

    // Flesch-Kincaid readability estimate
    const readability = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Ideal is 60-70 for resumes
    const score = Math.max(0, Math.min(100, readability));

    return score;
  }

  private analyzeCompleteness(content: string): number {
    let score = 0;
    const contentUpper = content.toUpperCase();

    const requiredSections = ['EXPERIENCE', 'EDUCATION', 'SKILLS'];
    const foundSections = requiredSections.filter(s => contentUpper.includes(s));

    score = (foundSections.length / requiredSections.length) * 100;

    // Check for contact information
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(content);
    const hasPhone = /[\d\s\-\(\)]+/.test(content);
    
    if (hasEmail) score += 5;
    if (hasPhone) score += 5;

    return Math.min(100, score);
  }

  private identifyIssues(
    content: string,
    keywordAnalysis: KeywordAnalysis,
    formattingScore: number,
  ): ATSIssue[] {
    const issues: ATSIssue[] = [];

    // Critical issues
    if (keywordAnalysis.missing.length > 5) {
      issues.push({
        severity: 'critical',
        category: 'Keywords',
        message: `Missing ${keywordAnalysis.missing.length} important keywords from job description`,
        suggestion: 'Review job description and incorporate relevant keywords',
      });
    }

    if (formattingScore < 70) {
      issues.push({
        severity: 'critical',
        category: 'Formatting',
        message: 'Document formatting may not be ATS-compatible',
        suggestion: 'Use simple, standard formatting without complex layouts',
      });
    }

    // Warnings
    if (keywordAnalysis.missing.length > 0 && keywordAnalysis.missing.length <= 5) {
      issues.push({
        severity: 'warning',
        category: 'Keywords',
        message: `Missing ${keywordAnalysis.missing.length} keywords`,
        location: keywordAnalysis.missing.slice(0, 3).join(', '),
        suggestion: 'Consider adding these keywords naturally',
      });
    }

    // Info
    const densityIssues = this.checkKeywordDensity(keywordAnalysis.density);
    if (densityIssues.length > 0) {
      densityIssues.forEach(issue => {
        issues.push({
          severity: 'info',
          category: 'Keywords',
          message: issue,
          suggestion: 'Ensure keyword appears naturally in context',
        });
      });
    }

    return issues;
  }

  private checkKeywordDensity(density: Record<string, number>): string[] {
    const issues: string[] = [];
    
    for (const [keyword, value] of Object.entries(density)) {
      if (value > 5) {
        issues.push(`Keyword "${keyword}" may be overused (${value.toFixed(1)}% density)`);
      }
    }
    
    return issues;
  }

  private generateSuggestions(
    issues: ATSIssue[],
    keywordAnalysis: KeywordAnalysis,
    options?: ATSOptimizationOptions,
  ): ATSSuggestion[] {
    const suggestions: ATSSuggestion[] = [];

    // Add suggestions for critical issues
    issues.filter(i => i.severity === 'critical').forEach(issue => {
      suggestions.push({
        category: issue.category,
        suggestion: issue.suggestion,
        priority: 'high',
      });
    });

    // Add keyword suggestions
    if (keywordAnalysis.missing.length > 0) {
      suggestions.push({
        category: 'Keywords',
        suggestion: `Add the following keywords: ${keywordAnalysis.missing.slice(0, 5).join(', ')}`,
        priority: 'high',
        example: 'Incorporate these terms naturally into your summary and experience sections',
      });
    }

    // Add formatting suggestions
    if (!this.hasStandardSectionHeaders('')) {
      suggestions.push({
        category: 'Formatting',
        suggestion: 'Use standard section headers: SUMMARY, EXPERIENCE, EDUCATION, SKILLS',
        priority: 'medium',
        example: 'EXPERIENCE instead of "Work History" or "Professional Background"',
      });
    }

    return suggestions;
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private containsComplexFormatting(content: string): boolean {
    return /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content) ||
           /\b(textbox|frame|column|section)\b/i.test(content);
  }

  private containsTablesOrGraphics(content: string): boolean {
    return /\+[\-\+]{2,}\+/.test(content) || // Table borders
           /\b(table|graphic|image|picture)\b/i.test(content);
  }

  private hasStandardSectionHeaders(content: string): boolean {
    const standardHeaders = [
      /EXPERIENCE/i,
      /EDUCATION/i,
      /SKILLS/i,
      /SUMMARY/i,
    ];
    return standardHeaders.some(h => h.test(content));
  }

  private hasInconsistentSpacing(content: string): boolean {
    const lines = content.split('\n');
    const spacings = lines.map(l => l.length - l.trim().length);
    const uniqueSpacings = new Set(spacings).size;
    return uniqueSpacings > 5;
  }

  private addMissingKeywords(
    content: string,
    keywords: string[],
    changes: string[],
  ): string {
    let updated = content;
    
    // Add keywords to skills section if exists
    const skillsMatch = updated.match(/(SKILLS?:?[\s\S]*?)(\n\n|$)/i);
    if (skillsMatch) {
      const missingKeywords = keywords.filter(kw => 
        !updated.toLowerCase().includes(kw.toLowerCase())
      );
      
      if (missingKeywords.length > 0) {
        const newSkillsSection = `${skillsMatch[1]}, ${missingKeywords.join(', ')}`;
        updated = updated.replace(skillsMatch[1], newSkillsSection);
        changes.push(`Added keywords to skills section: ${missingKeywords.join(', ')}`);
      }
    }
    
    return updated;
  }

  private fixFormattingIssues(content: string, changes: string[]): string {
    let fixed = content;
    
    // Replace fancy bullets with standard hyphens
    const bulletPattern = /[•▸▹►‣⁃]/g;
    if (bulletPattern.test(fixed)) {
      fixed = fixed.replace(bulletPattern, '-');
      changes.push('Replaced fancy bullets with standard hyphens');
    }
    
    // Fix multiple spaces
    if (/  +/.test(fixed)) {
      fixed = fixed.replace(/  +/g, ' ');
      changes.push('Fixed multiple spaces');
    }
    
    return fixed;
  }

  private improveSectionHeaders(content: string, changes: string[]): string {
    let improved = content;
    
    const headerMappings = [
      { from: /WORK\s*HISTORY/i, to: 'EXPERIENCE' },
      { from: /PROFESSIONAL\s*BACKGROUND/i, to: 'EXPERIENCE' },
      { from: /CAREER\s*HISTORY/i, to: 'EXPERIENCE' },
      { from: /ACCOMPLISHMENTS/i, to: 'ACHIEVEMENTS' },
      { from: /PROJECTS(?:\s*&?\s*AWARDS)?/i, to: 'PROJECTS' },
    ];
    
    headerMappings.forEach(mapping => {
      if (mapping.from.test(improved)) {
        improved = improved.replace(mapping.from, mapping.to);
        changes.push(`Changed "${mapping.from.source}" to "${mapping.to}"`);
      }
    });
    
    return improved;
  }

  private optimizeKeywordDensity(
    content: string,
    keywords: string[],
    changes: string[],
  ): string {
    // Ensure keywords appear naturally throughout the document
    let optimized = content;
    
    keywords.slice(0, 10).forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = optimized.match(regex);
      
      if (matches && matches.length === 1) {
        // Keyword appears only once, add to another section
        const sentences = optimized.split(/[.!?]+/);
        const lastSentence = sentences[sentences.length - 1];
        
        if (lastSentence && !lastSentence.toLowerCase().includes(keyword.toLowerCase())) {
          sentences[sentences.length - 1] = `${lastSentence} ${keyword}.`;
          optimized = sentences.join('.');
          changes.push(`Added "${keyword}" to improve keyword density`);
        }
      }
    });
    
    return optimized;
  }

  private estimateSyllables(words: string[]): number {
    return words.reduce((count, word) => {
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) return count + 1;
      
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const syllables = word.match(/[aeiouy]{1,2}/g);
      return count + (syllables ? syllables.length : 1);
    }, 0);
  }
}
