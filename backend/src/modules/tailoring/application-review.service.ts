import { Injectable, Logger } from '@nestjs/common';
import { JobPosting } from '../../entities/job-posting.entity';
import { Persona } from '../../entities/persona.entity';
import { ATSOptimizationService } from './ats-optimization.service';
import { QualityScoringService } from './quality-scoring.service';
import { KeywordOptimizationService } from './keyword-optimization.service';
import { BrandVoiceService } from './brand-voice.service';

export interface ApplicationReview {
  id: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: ReviewSummary;
  categoryReviews: CategoryReview[];
  redFlags: RedFlag[];
  recommendations: ReviewRecommendation[];
  autoApprovalStatus: 'APPROVED' | 'REVIEW_REQUIRED' | 'REJECTED';
  confidenceLevel: number;
  reviewedAt: Date;
}

export interface ReviewSummary {
  strengths: string[];
  weaknesses: string[];
  keyTakeaways: string[];
  fitScore: number; // 0-100
}

export interface CategoryReview {
  category: string;
  score: number;
  maxScore: number;
  verdict: 'excellent' | 'good' | 'acceptable' | 'needs-improvement' | 'poor';
  observations: string[];
  suggestions: string[];
}

export interface RedFlag {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  impact: string;
  recommendation: string;
}

export interface ReviewRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  expectedImpact: string;
  implementationEffort: 'minimal' | 'moderate' | 'significant';
}

export interface ReviewThresholds {
  minOverallScore: number;
  minCategoryScores: Record<string, number>;
  maxRedFlags: number;
  allowedRedFlagSeverities: string[];
}

@Injectable()
export class ApplicationReviewService {
  private readonly logger = new Logger(ApplicationReviewService.name);

  private readonly defaultThresholds: ReviewThresholds = {
    minOverallScore: 70,
    minCategoryScores: {
      'ATS Compatibility': 65,
      'Job Relevance': 70,
      'Professional Tone': 60,
      'Content Completeness': 65,
    },
    maxRedFlags: 3,
    allowedRedFlagSeverities: ['info', 'warning'],
  };

  constructor(
    private readonly atsOptimization: ATSOptimizationService,
    private readonly qualityScoring: QualityScoringService,
    private readonly keywordOptimization: KeywordOptimizationService,
    private readonly brandVoice: BrandVoiceService,
  ) {}

  /**
   * Performs comprehensive automated application review
   */
  async reviewApplication(
    resumeContent: string,
    coverLetterContent: string | undefined,
    jobPosting: JobPosting,
    persona: Persona,
    thresholds?: Partial<ReviewThresholds>,
  ): Promise<ApplicationReview> {
    const finalThresholds = { ...this.defaultThresholds, ...thresholds };

    const categoryReviews: CategoryReview[] = [];
    const redFlags: RedFlag[] = [];
    const recommendations: ReviewRecommendation[] = [];

    // 1. ATS Compatibility Review
    const atsReview = this.reviewATSCompatibility(resumeContent, jobPosting);
    categoryReviews.push(atsReview);

    if (atsReview.score < finalThresholds.minCategoryScores['ATS Compatibility']) {
      redFlags.push({
        severity: 'warning',
        category: 'ATS Compatibility',
        message: 'ATS compatibility score is below recommended threshold',
        impact: 'Application may not pass initial screening',
        recommendation: 'Optimize formatting and keywords for ATS',
      });
    }

    // 2. Job Relevance Review
    const relevanceReview = this.reviewJobRelevance(resumeContent, jobPosting);
    categoryReviews.push(relevanceReview);

    if (relevanceReview.score < finalThresholds.minCategoryScores['Job Relevance']) {
      redFlags.push({
        severity: 'critical',
        category: 'Job Relevance',
        message: 'Content does not sufficiently match job requirements',
        impact: 'Low probability of advancing to interview stage',
        recommendation: 'Incorporate more job-specific keywords and requirements',
      });
    }

    // 3. Professional Tone Review
    const toneReview = this.reviewProfessionalTone(resumeContent);
    categoryReviews.push(toneReview);

    // 4. Content Completeness Review
    const completenessReview = this.reviewContentCompleteness(resumeContent, persona);
    categoryReviews.push(completenessReview);

    // 5. Cover Letter Review (if provided)
    if (coverLetterContent) {
      const coverLetterReview = this.reviewCoverLetter(coverLetterContent, jobPosting);
      categoryReviews.push(coverLetterReview);
    }

    // 6. Keyword Optimization Review
    const keywordAnalysis = this.keywordOptimization.analyzeKeywords(
      resumeContent,
      jobPosting,
      persona,
    );

    if (keywordAnalysis.missingKeywords.length > 5) {
      redFlags.push({
        severity: 'warning',
        category: 'Keywords',
        message: `Missing ${keywordAnalysis.missingKeywords.length} important keywords`,
        impact: 'May not rank high in ATS keyword matching',
        recommendation: `Add: ${keywordAnalysis.missingKeywords.slice(0, 3).join(', ')}`,
      });
    }

    // Generate summary
    const summary = this.generateSummary(categoryReviews, redFlags);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(categoryReviews);

    // Determine auto-approval status
    const autoApprovalStatus = this.determineAutoApproval(
      overallScore,
      redFlags,
      finalThresholds,
    );

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(categoryReviews, redFlags));

    return {
      id: crypto.randomUUID(),
      overallScore,
      grade: this.calculateGrade(overallScore),
      summary,
      categoryReviews,
      redFlags,
      recommendations,
      autoApprovalStatus,
      confidenceLevel: this.calculateConfidence(categoryReviews, redFlags),
      reviewedAt: new Date(),
    };
  }

  /**
   * Reviews ATS compatibility
   */
  private reviewATSCompatibility(
    content: string,
    jobPosting: JobPosting,
  ): CategoryReview {
    const atsResult = this.atsOptimization.analyzeDocument(content, jobPosting.description);

    return {
      category: 'ATS Compatibility',
      score: atsResult.overallScore,
      maxScore: 100,
      verdict: this.determineVerdict(atsResult.overallScore),
      observations: [
        `Overall ATS Score: ${atsResult.overallScore.toFixed(1)}%`,
        `Grade: ${atsResult.grade}`,
        `Formatting Score: ${atsResult.formattingScore}%`,
        `Readability Score: ${atsResult.readabilityScore}%`,
      ],
      suggestions: atsResult.suggestions.slice(0, 3).map(s => s.suggestion),
    };
  }

  /**
   * Reviews job relevance
   */
  private reviewJobRelevance(
    content: string,
    jobPosting: JobPosting,
  ): CategoryReview {
    // Use the public analyzeKeywords method instead
    const keywordAnalysis = this.keywordOptimization.analyzeKeywords(
      content,
      jobPosting,
      {} as Persona,
    );

    const matchedKeywords = keywordAnalysis.targetKeywords.filter(k => k.frequency > 0).length;
    const totalRelevantKeywords = keywordAnalysis.targetKeywords.filter(k => k.shouldInclude).length;
    const score = totalRelevantKeywords > 0
      ? (matchedKeywords / totalRelevantKeywords) * 100
      : 50;

    return {
      category: 'Job Relevance',
      score,
      maxScore: 100,
      verdict: this.determineVerdict(score),
      observations: [
        `Matched ${matchedKeywords}/${Math.min(totalRelevantKeywords, 20)} top keywords`,
        keywordAnalysis.missingKeywords.length > 0 
          ? `Missing: ${keywordAnalysis.missingKeywords.slice(0, 5).join(', ')}` 
          : 'All key terms present',
      ],
      suggestions: keywordAnalysis.missingKeywords.slice(0, 5).map(kw => `Add "${kw}" to your application`),
    };
  }

  /**
   * Reviews professional tone
   */
  private reviewProfessionalTone(content: string): CategoryReview {
    const voiceAnalysis = this.brandVoice.analyzeVoice(content);

    return {
      category: 'Professional Tone',
      score: voiceAnalysis.confidence * 100,
      maxScore: 100,
      verdict: voiceAnalysis.confidence > 0.7 ? 'good' : 'acceptable',
      observations: [
        `Detected style: ${voiceAnalysis.currentStyle}`,
        `Confidence: ${(voiceAnalysis.confidence * 100).toFixed(0)}%`,
        `Tone markers found: ${voiceAnalysis.toneMarkers.length}`,
      ],
      suggestions: voiceAnalysis.suggestions.slice(0, 3).map(s => s.suggested),
    };
  }

  /**
   * Reviews content completeness
   */
  private reviewContentCompleteness(
    content: string,
    persona: Persona,
  ): CategoryReview {
    const requiredSections = ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'SUMMARY'];
    const contentUpper = content.toUpperCase();

    const presentSections = requiredSections.filter(s =>
      contentUpper.includes(s)
    );

    // Check for contact info
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(content);
    const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(content);

    let score = (presentSections.length / requiredSections.length) * 70;
    if (hasEmail) score += 10;
    if (hasPhone) score += 10;
    if (Array.isArray(persona.skills) && persona.skills.length >= 5) score += 10;

    return {
      category: 'Content Completeness',
      score: Math.min(100, score),
      maxScore: 100,
      verdict: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs-improvement',
      observations: [
        `${presentSections.length}/${requiredSections.length} required sections present`,
        hasEmail ? 'Contact information present' : 'Missing email address',
        hasPhone ? 'Phone number present' : 'Missing phone number',
      ],
      suggestions: presentSections.length < requiredSections.length
        ? ['Add missing sections: ' + requiredSections.filter(s => !presentSections.includes(s)).join(', ')]
        : [],
    };
  }

  /**
   * Reviews cover letter
   */
  private reviewCoverLetter(coverLetter: string, jobPosting: JobPosting): CategoryReview {
    const wordCount = coverLetter.split(/\s+/).length;
    const hasCompanyName = coverLetter.toLowerCase().includes(jobPosting.company.toLowerCase());
    const hasJobTitle = coverLetter.toLowerCase().includes(jobPosting.title.toLowerCase());

    let score = 50;
    if (wordCount >= 200 && wordCount <= 500) score += 20;
    else if (wordCount >= 150) score += 10;
    if (hasCompanyName) score += 15;
    if (hasJobTitle) score += 15;

    return {
      category: 'Cover Letter Quality',
      score: Math.min(100, score),
      maxScore: 100,
      verdict: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs-improvement',
      observations: [
        `Word count: ${wordCount} ${wordCount < 150 ? '(too short)' : wordCount > 500 ? '(too long)' : '(optimal)'}`,
        hasCompanyName ? 'Company mentioned' : 'Company name not found',
        hasJobTitle ? 'Job title referenced' : 'Job title not referenced',
      ],
      suggestions: [
        !hasCompanyName ? 'Mention the company by name' : null,
        !hasJobTitle ? 'Reference the specific job title' : null,
        wordCount < 150 ? 'Expand your cover letter to 200-500 words' : null,
      ].filter(Boolean) as string[],
    };
  }

  /**
   * Generates review summary
   */
  private generateSummary(
    categoryReviews: CategoryReview[],
    redFlags: RedFlag[],
  ): ReviewSummary {
    const strengths = categoryReviews
      .filter(r => r.verdict === 'excellent' || r.verdict === 'good')
      .map(r => `${r.category}: ${r.observations[0]}`);

    const weaknesses = categoryReviews
      .filter(r => r.verdict === 'needs-improvement' || r.verdict === 'poor')
      .map(r => `${r.category} needs attention`);

    const topScore = Math.max(...categoryReviews.map(r => r.score));
    const fitScore = Math.round(
      categoryReviews.reduce((sum, r) => sum + r.score, 0) / categoryReviews.length
    );

    return {
      strengths,
      weaknesses,
      keyTakeaways: [
        `Highest scoring area: ${categoryReviews.find(r => r.score === topScore)?.category}`,
        `Application fit score: ${fitScore}%`,
        `${strengths.length} strength(s) identified`,
        `${weaknesses.length} area(s) for improvement`,
      ],
      fitScore,
    };
  }

  /**
   * Calculates overall score
   */
  private calculateOverallScore(categoryReviews: CategoryReview[]): number {
    const weights: Record<string, number> = {
      'ATS Compatibility': 0.25,
      'Job Relevance': 0.30,
      'Professional Tone': 0.20,
      'Content Completeness': 0.15,
      'Cover Letter Quality': 0.10,
    };

    let totalScore = 0;
    let totalWeight = 0;

    categoryReviews.forEach(review => {
      const weight = weights[review.category] || 0.1;
      totalScore += (review.score / review.maxScore) * weight * 100;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Determines auto-approval status
   */
  private determineAutoApproval(
    overallScore: number,
    redFlags: RedFlag[],
    thresholds: ReviewThresholds,
  ): 'APPROVED' | 'REVIEW_REQUIRED' | 'REJECTED' {
    const criticalFlags = redFlags.filter(f => f.severity === 'critical');
    
    if (overallScore >= thresholds.minOverallScore && criticalFlags.length === 0) {
      return 'APPROVED';
    }
    
    if (overallScore < 40 || criticalFlags.length > 2) {
      return 'REJECTED';
    }
    
    return 'REVIEW_REQUIRED';
  }

  /**
   * Calculates confidence level
   */
  private calculateConfidence(
    categoryReviews: CategoryReview[],
    redFlags: RedFlag[],
  ): number {
    const flagPenalty = redFlags.length * 0.05;
    const verdictBonus = categoryReviews.filter(
      r => r.verdict === 'excellent' || r.verdict === 'good'
    ).length * 0.1;

    return Math.max(0.5, Math.min(0.95, 0.7 + verdictBonus - flagPenalty));
  }

  /**
   * Determines verdict based on score
   */
  private determineVerdict(score: number): CategoryReview['verdict'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 40) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Calculates grade from score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generates recommendations based on reviews
   */
  private generateRecommendations(
    categoryReviews: CategoryReview[],
    redFlags: RedFlag[],
  ): ReviewRecommendation[] {
    const recommendations: ReviewRecommendation[] = [];

    // Process category reviews
    categoryReviews.forEach(review => {
      if (review.verdict === 'needs-improvement' || review.verdict === 'poor') {
        review.suggestions.forEach((suggestion, index) => {
          recommendations.push({
            priority: index === 0 ? 'high' : 'medium',
            category: review.category,
            recommendation: suggestion,
            expectedImpact: 'Improves overall application score',
            implementationEffort: 'minimal',
          });
        });
      }
    });

    // Process red flags
    redFlags.forEach(flag => {
      if (flag.severity === 'critical' || flag.severity === 'warning') {
        recommendations.push({
          priority: flag.severity === 'critical' ? 'high' : 'medium',
          category: flag.category,
          recommendation: flag.recommendation,
          expectedImpact: flag.impact,
          implementationEffort: 'moderate',
        });
      }
    });

    return recommendations.slice(0, 10);
  }
}
