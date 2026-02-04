import { Injectable, Logger } from '@nestjs/common';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';

export interface QualityScore {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  componentScores: ComponentScore[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  analyzedAt: Date;
}

export interface ComponentScore {
  component: string;
  score: number;
  maxScore: number;
  weight: number;
  details: string;
  feedback: string[];
}

export interface ApplicationVariant {
  id: string;
  content: string;
  type: 'resume' | 'cover_letter';
  variantName: string;
  scores?: QualityScore;
  metrics?: VariantMetrics;
}

export interface VariantMetrics {
  atsScore: number;
  readabilityScore: number;
  keywordDensity: number;
  toneScore: number;
  lengthScore: number;
}

export interface ScoringCriteria {
  atsWeight: number;
  readabilityWeight: number;
  relevanceWeight: number;
  toneWeight: number;
  completenessWeight: number;
  customWeights?: Record<string, number>;
}

export interface ImprovementPlan {
  targetScore: number;
  currentScore: number;
  scoreGap: number;
  prioritizedActions: {
    component: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: number;
  }[];
  estimatedTimeToImprove: string;
}

@Injectable()
export class QualityScoringService {
  private readonly logger = new Logger(QualityScoringService.name);

  private readonly defaultCriteria: ScoringCriteria = {
    atsWeight: 0.25,
    readabilityWeight: 0.20,
    relevanceWeight: 0.25,
    toneWeight: 0.15,
    completenessWeight: 0.15,
  };

  async scoreApplication(
    content: string,
    jobPosting: JobPosting,
    persona: Persona,
    criteria?: Partial<ScoringCriteria>,
  ): Promise<QualityScore> {
    const weights = { ...this.defaultCriteria, ...criteria };
    const componentScores: ComponentScore[] = [];

    // ATS Score
    const atsResult = this.scoreATSCompatibility(content);
    componentScores.push({
      component: 'ATS Compatibility',
      score: atsResult.score,
      maxScore: 100,
      weight: weights.atsWeight,
      details: atsResult.details,
      feedback: atsResult.feedback,
    });

    // Readability Score
    const readabilityResult = this.scoreReadability(content);
    componentScores.push({
      component: 'Readability',
      score: readabilityResult.score,
      maxScore: 100,
      weight: weights.readabilityWeight,
      details: readabilityResult.details,
      feedback: readabilityResult.feedback,
    });

    // Relevance Score
    const relevanceResult = this.scoreRelevance(content, jobPosting);
    componentScores.push({
      component: 'Job Relevance',
      score: relevanceResult.score,
      maxScore: 100,
      weight: weights.relevanceWeight,
      details: relevanceResult.details,
      feedback: relevanceResult.feedback,
    });

    // Tone Score
    const toneResult = this.scoreTone(content);
    componentScores.push({
      component: 'Professional Tone',
      score: toneResult.score,
      maxScore: 100,
      weight: weights.toneWeight,
      details: toneResult.details,
      feedback: toneResult.feedback,
    });

    // Completeness Score
    const completenessResult = this.scoreCompleteness(content);
    componentScores.push({
      component: 'Content Completeness',
      score: completenessResult.score,
      maxScore: 100,
      weight: weights.completenessWeight,
      details: completenessResult.details,
      feedback: completenessResult.feedback,
    });

    // Calculate overall score
    const overallScore = componentScores.reduce(
      (sum, component) =>
        sum + (component.score / component.maxScore) * component.weight * 100,
      0,
    );

    const { strengths, weaknesses, recommendations } = this.analyzeResults(componentScores);
    const confidenceLevel = this.determineConfidence(componentScores);

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      grade: this.calculateGrade(overallScore),
      componentScores,
      strengths,
      weaknesses,
      recommendations,
      confidenceLevel,
      analyzedAt: new Date(),
    };
  }

  async selectBestVariant(
    variants: ApplicationVariant[],
    jobPosting: JobPosting,
  ): Promise<{ bestVariant: ApplicationVariant; ranking: ApplicationVariant[] }> {
    const scoredVariants = await Promise.all(
      variants.map(async (variant) => {
        const scores = await this.scoreApplication(
          variant.content,
          jobPosting,
          {} as Persona,
        );
        return { ...variant, scores };
      }),
    );

    const ranking = scoredVariants.sort(
      (a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0),
    );

    return {
      bestVariant: ranking[0],
      ranking,
    };
  }

  generateImprovementPlan(
    currentScore: QualityScore,
    targetScore: number = 85,
  ): ImprovementPlan {
    const gaps = currentScore.componentScores
      .map((cs) => ({
        component: cs.component,
        currentScore: cs.score,
        targetScore: Math.min(100, targetScore),
        gap: Math.max(0, targetScore - cs.score),
      }))
      .filter((g) => g.gap > 5)
      .sort((a, b) => b.gap - a.gap);

    const prioritizedActions = gaps.map((gap) => {
      const action = this.getImprovementAction(gap.component, gap.gap);
      const priority: 'high' | 'medium' | 'low' = gap.gap > 20 ? 'high' : gap.gap > 10 ? 'medium' : 'low';
      return {
        component: gap.component,
        action,
        priority,
        estimatedImpact: Math.min(100, gap.gap * 1.5),
      };
    });

    return {
      targetScore,
      currentScore: currentScore.overallScore,
      scoreGap: Math.max(0, targetScore - currentScore.overallScore),
      prioritizedActions,
      estimatedTimeToImprove: this.estimateImprovementTime(prioritizedActions),
    };
  }

  // Private helper methods

  private scoreATSCompatibility(content: string): { score: number; details: string; feedback: string[] } {
    const feedback: string[] = [];
    let deductions = 0;

    if (this.hasStandardHeaders(content)) {
      feedback.push('Standard section headers found');
    } else {
      deductions += 20;
      feedback.push('Missing standard section headers');
    }

    const keywordScore = this.calculateKeywordScore(content);
    if (keywordScore >= 80) {
      feedback.push('Good keyword integration');
    } else {
      deductions += (100 - keywordScore) * 0.3;
      feedback.push('Keyword optimization could be improved');
    }

    const lengthScore = this.scoreLength(content);
    if (lengthScore < 50) {
      deductions += 20;
      feedback.push('Content length may be problematic');
    }

    return {
      score: Math.max(0, 100 - deductions),
      details: `ATS score: ${100 - deductions}`,
      feedback,
    };
  }

  private scoreReadability(content: string): { score: number; details: string; feedback: string[] } {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : words;

    const syllables = this.estimateSyllables(content);
    const avgSyllablesPerWord = words > 0 ? syllables / words : 0;
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    let score = Math.max(0, Math.min(100, fleschScore));

    if (avgWordsPerSentence > 20) {
      score -= 10;
    }

    return {
      score: Math.round(score),
      details: `Flesch-Kincaid: ${Math.round(fleschScore)}`,
      feedback: score >= 70 ? ['Good readability'] : ['Could use shorter sentences'],
    };
  }

  private scoreRelevance(content: string, jobPosting: JobPosting): { score: number; details: string; feedback: string[] } {
    const jobTitle = jobPosting.title?.toLowerCase() || '';
    const jobDescription = jobPosting.description?.toLowerCase() || '';
    const requirements = Array.isArray(jobPosting.requirements) 
      ? jobPosting.requirements.join(' ').toLowerCase() 
      : '';

    const jobText = `${jobTitle} ${jobDescription} ${requirements}`;
    const jobKeywords = this.extractKeywords(jobText);
    const contentLower = content.toLowerCase();
    
    let matchedKeywords = 0;
    for (const keyword of jobKeywords) {
      if (contentLower.includes(keyword)) {
        matchedKeywords++;
      }
    }

    const relevanceScore = jobKeywords.length > 0
      ? (matchedKeywords / jobKeywords.length) * 100
      : 50;

    return {
      score: Math.round(relevanceScore),
      details: `${matchedKeywords}/${jobKeywords.length} keywords matched`,
      feedback: relevanceScore >= 70 ? ['Strong alignment'] : ['Consider adding more job keywords'],
    };
  }

  private scoreTone(content: string): { score: number; details: string; feedback: string[] } {
    const positiveWords = /\b(success|achievement|excellent|strong|proven|lead|manage|deliver)/gi;
    const actionVerbs = /\b(led|developed|created|implemented|managed|achieved|increased|decreased|improved)/gi;

    const positiveMatches = (content.match(positiveWords) || []).length;
    const actionMatches = (content.match(actionVerbs) || []).length;

    const wordCount = content.split(/\s+/).length;
    const positiveRatio = (positiveMatches / wordCount) * 100;
    const actionRatio = (actionMatches / wordCount) * 100;

    let score = 50 + Math.min(positiveRatio * 10, 20) + Math.min(actionRatio * 15, 25);

    return {
      score: Math.min(100, Math.max(0, Math.round(score))),
      details: `Positive: ${positiveMatches}, Actions: ${actionMatches}`,
      feedback: actionMatches > 5 ? ['Strong action verbs'] : ['Add more action verbs'],
    };
  }

  private scoreCompleteness(content: string): { score: number; details: string; feedback: string[] } {
    const requiredSections = ['experience', 'education', 'skills', 'summary'];
    const contentLower = content.toLowerCase();
    const foundSections = requiredSections.filter(section =>
      contentLower.includes(section)
    );

    let score = (foundSections.length / requiredSections.length) * 100;

    if (content.includes('@')) score += 5;
    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(content)) score += 5;

    return {
      score: Math.min(100, Math.round(score)),
      details: `${foundSections.length}/${requiredSections.length} sections`,
      feedback: foundSections.length === requiredSections.length 
        ? ['All sections present'] 
        : [`Missing: ${requiredSections.filter(s => !foundSections.includes(s)).join(', ')}`],
    };
  }

  private hasStandardHeaders(content: string): boolean {
    return /EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROJECTS/i.test(content);
  }

  private calculateKeywordScore(content: string): number {
    const techTerms = /\b(javascript|python|java|react|node\.js|aws|docker|kubernetes|sql|api|agile|scrum)\b/gi;
    const softSkills = /\b(communication|leadership|teamwork|problem.solving|project management)\b/gi;

    const techMatches = (content.match(techTerms) || []).length;
    const softMatches = (content.match(softSkills) || []).length;

    if (techMatches + softMatches >= 10) return 90;
    if (techMatches + softMatches >= 5) return 70;
    if (techMatches + softMatches >= 2) return 50;
    return 30;
  }

  private scoreLength(content: string): number {
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 400 && wordCount <= 800) return 100;
    if (wordCount >= 300 && wordCount <= 1000) return 80;
    if (wordCount >= 200 && wordCount <= 1200) return 60;
    return 40;
  }

  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>();
    const words = text.split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    words.forEach(word => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        keywords.add(cleaned);
      }
    });

    return Array.from(keywords).slice(0, 20);
  }

  private estimateSyllables(text: string): number {
    const words = text.split(/\s+/);
    return words.reduce((count, word) => {
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) return count + 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const syllables = word.match(/[aeiouy]{1,2}/g);
      return count + (syllables ? syllables.length : 1);
    }, 0);
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private analyzeResults(componentScores: ComponentScore[]) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    componentScores.forEach((cs) => {
      const percentage = (cs.score / cs.maxScore) * 100;
      
      if (percentage >= 80) {
        strengths.push(cs.component);
      } else if (percentage < 60) {
        weaknesses.push(cs.component);
        recommendations.push(`Improve ${cs.component.toLowerCase()}`);
      }
    });

    return { strengths, weaknesses, recommendations };
  }

  private determineConfidence(componentScores: ComponentScore[]): 'high' | 'medium' | 'low' {
    const scores = componentScores.map((cs) => cs.score / cs.maxScore);
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - scores.reduce((a, b) => a + b, 0) / scores.length, 2), 0) / scores.length;
    return variance < 0.1 ? 'high' : variance < 0.25 ? 'medium' : 'low';
  }

  private getImprovementAction(component: string, gap: number): string {
    const actions: Record<string, string> = {
      'ATS Compatibility': 'Use standard formatting and section headers',
      'Readability': 'Shorten sentences and use bullet points',
      'Job Relevance': 'Incorporate more keywords from job description',
      'Professional Tone': 'Use more action verbs and positive language',
      'Content Completeness': 'Add missing sections and contact information',
    };
    return actions[component] || 'Review and improve content quality';
  }

  private estimateImprovementTime(actions: { priority: string }[]): string {
    const highPriorityCount = actions.filter(a => a.priority === 'high').length;
    if (highPriorityCount > 2) return '1-2 hours';
    if (highPriorityCount > 0) return '30-60 minutes';
    return '15-30 minutes';
  }
}
