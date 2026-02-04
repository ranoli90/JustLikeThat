import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../../entities/interview-session.entity';
import { InterviewQuestion, QuestionType } from '../../entities/interview-question.entity';
import { InterviewPractice } from '../../entities/interview-practice.entity';

export interface AnswerFeedback {
  score: number;
  strengths: string[];
  improvementAreas: string[];
  suggestedImprovements: string[];
  overallAssessment: string;
}

@Injectable()
export class InterviewFeedbackService {
  constructor(
    @InjectRepository(InterviewPractice)
    private readonly practiceRepository: Repository<InterviewPractice>,
  ) {}

  /**
   * Analyzes an interview answer and provides feedback
   */
  async analyzeAnswer(
    question: string,
    userAnswer: string,
    questionType: QuestionType,
    suggestedAnswer?: string,
  ): Promise<AnswerFeedback> {
    // In production, this would use an AI model to analyze the answer
    // For now, we use heuristic-based analysis
    
    const analysis = this.analyzeAnswerContent(userAnswer, questionType);
    const structureScore = this.evaluateStructure(userAnswer);
    const relevanceScore = this.evaluateRelevance(userAnswer, question);
    const completenessScore = this.evaluateCompleteness(userAnswer, suggestedAnswer);
    
    const overallScore = (analysis.score * 0.4 + structureScore * 0.3 + relevanceScore * 0.2 + completenessScore * 0.1);

    return {
      score: Math.round(overallScore),
      strengths: analysis.strengths,
      improvementAreas: analysis.improvementAreas,
      suggestedImprovements: analysis.suggestedImprovements,
      overallAssessment: this.generateOverallAssessment(overallScore, questionType),
    };
  }

  /**
   * Generates overall feedback for a completed interview session
   */
  async generateOverallFeedback(sessionId: string): Promise<Record<string, unknown>> {
    const practices = await this.practiceRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });

    if (practices.length === 0) {
      return {
        totalQuestions: 0,
        averageScore: 0,
        overallAssessment: 'No practice sessions completed.',
        recommendations: [],
      };
    }

    const scores = practices.map(p => p.confidenceScore || 0).filter(s => s > 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const strengthCounts: Record<string, number> = {};
    const improvementCounts: Record<string, number> = {};

    practices.forEach(p => {
      (p.strengths as string[])?.forEach(s => {
        strengthCounts[s] = (strengthCounts[s] || 0) + 1;
      });
      (p.improvementAreas as string[])?.forEach(i => {
        improvementCounts[i] = (improvementCounts[i] || 0) + 1;
      });
    });

    const topStrengths = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);

    const topImprovements = Object.entries(improvementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);

    return {
      totalQuestions: practices.length,
      averageScore: Math.round(averageScore),
      completedPractices: practices.length,
      overallAssessment: this.generateOverallAssessment(averageScore, undefined),
      strengths: topStrengths,
      improvementAreas: topImprovements,
      recommendations: this.generateRecommendations(topImprovements, averageScore),
      practiceHistory: practices.map(p => ({
        question: p.question,
        score: p.confidenceScore,
        date: p.createdAt,
      })),
    };
  }

  /**
   * Gets improvement recommendations based on performance
   */
  getImprovementRecommendations(sessionId: string): Record<string, unknown>[] {
    return [
      {
        area: 'Structure',
        tips: [
          'Use the STAR method for behavioral questions',
          'Start with a brief overview before diving into details',
          'End with a clear conclusion or lesson learned',
        ],
        priority: 'high',
      },
      {
        area: 'Specificity',
        tips: [
          'Include specific numbers and metrics when possible',
          'Name specific tools, technologies, or methodologies used',
          'Describe exact actions you took, not just team actions',
        ],
        priority: 'high',
      },
      {
        area: 'Conciseness',
        tips: [
          'Keep answers focused on the key points',
          'Avoid unnecessary background information',
          'Practice timing your answers to 2-3 minutes',
        ],
        priority: 'medium',
      },
      {
        area: 'Body Language',
        tips: [
          'Maintain eye contact (or look at camera for video)',
          'Use hand gestures naturally to emphasize points',
          'Sit up straight and show confidence',
        ],
        priority: 'medium',
      },
      {
        area: 'Engagement',
        tips: [
          'Show enthusiasm through your tone of voice',
          'Ask clarifying questions when needed',
          'Connect your experience to the role requirements',
        ],
        priority: 'low',
      },
    ];
  }

  /**
   * Analyzes answer content for key elements
   */
  private analyzeAnswerContent(answer: string, questionType: QuestionType): {
    score: number;
    strengths: string[];
    improvementAreas: string[];
    suggestedImprovements: string[];
  } {
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    const suggestedImprovements: string[] = [];
    let score = 50;

    const wordCount = answer.split(/\s+/).length;
    const hasNumbers = /\d+/.test(answer);
    const hasActionVerbs = /\b(led|created|developed|implemented|managed|achieved|improved|increased|decreased|designed|built|launched|delivered)\b/i.test(answer);
    const hasContext = /\b(because|when|where|while|during)\b/i.test(answer);
    const hasOutcome = /\b(resulted|led to|caused|enabled|helped|contributed)\b/i.test(answer);
    const hasSelfReference = /\b(I |my |me |myself)\b/i.test(answer);

    // Check for structure keywords
    const starKeywords = ['situation', 'task', 'action', 'result', 'challenge', 'solution', 'outcome'];
    const hasStructure = starKeywords.some(keyword => answer.toLowerCase().includes(keyword));

    // Evaluate elements
    if (wordCount > 50) {
      score += 10;
      strengths.push('Comprehensive answer');
    } else if (wordCount < 30) {
      score -= 10;
      improvementAreas.push('Answer length');
      suggestedImprovements.push('Provide more context and details');
    }

    if (hasNumbers) {
      score += 10;
      strengths.push('Quantifiable results');
    }

    if (hasActionVerbs) {
      score += 10;
      strengths.push('Action-oriented language');
    } else {
      improvementAreas.push('Action verbs');
      suggestedImprovements.push('Use strong action verbs to describe your contributions');
    }

    if (hasContext) {
      score += 5;
      strengths.push('Good context setting');
    }

    if (hasOutcome) {
      score += 10;
      strengths.push('Results-focused');
    } else {
      improvementAreas.push('Results');
      suggestedImprovements.push('Always conclude with the positive outcome or lesson learned');
    }

    if (hasSelfReference) {
      score += 5;
      strengths.push('Personal ownership');
    }

    if (hasStructure) {
      score += 10;
      strengths.push('Well-structured narrative');
    }

    // Type-specific checks
    if (questionType === QuestionType.TECHNICAL) {
      if (/\b(algorithm|data structure|API|database|architecture|design|code|implementation)\b/i.test(answer)) {
        score += 10;
        strengths.push('Technical depth');
      } else {
        improvementAreas.push('Technical specifics');
        suggestedImprovements.push('Include more technical details and methodologies');
      }
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      strengths,
      improvementAreas,
      suggestedImprovements,
    };
  }

  /**
   * Evaluates answer structure
   */
  private evaluateStructure(answer: string): number {
    const hasParagraphs = answer.split('\n\n').length > 1;
    const hasClearBeginning = /^(I|We|The|When|While|In|During)/.test(answer.trim());
    const hasClearEnding = /\.( |\n)/.test(answer.slice(-5));
    
    let score = 60;
    if (hasParagraphs) score += 15;
    if (hasClearBeginning) score += 15;
    if (hasClearEnding) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Evaluates answer relevance to question
   */
  private evaluateRelevance(answer: string, question: string): number {
    // Simple keyword matching - in production, use NLP
    const questionWords = question.toLowerCase().split(/\s+/);
    const answerLower = answer.toLowerCase();
    
    const matchedWords = questionWords.filter(word => 
      word.length > 4 && answerLower.includes(word)
    );

    const relevance = Math.min(100, (matchedWords.length / questionWords.length) * 200 + 50);
    return relevance;
  }

  /**
   * Evaluates answer completeness
   */
  private evaluateCompleteness(answer: string, suggestedAnswer?: string): number {
    if (!suggestedAnswer) return 70;
    
    const answerLength = answer.length;
    const suggestedLength = suggestedAnswer.length;
    
    if (answerLength < suggestedLength * 0.5) return 40;
    if (answerLength < suggestedLength) return 70;
    if (answerLength >= suggestedLength) return 90;
    
    return 70;
  }

  /**
   * Generates overall assessment text
   */
  private generateOverallAssessment(score: number, questionType?: QuestionType): string {
    if (score >= 85) {
      return 'Excellent! Your answer demonstrates strong skills and experience. Well-structured with clear results and actionable insights.';
    } else if (score >= 70) {
      return 'Good answer with solid structure. Consider adding more specific metrics and outcomes to strengthen your response.';
    } else if (score >= 50) {
      return 'Adequate answer but needs improvement. Focus on using the STAR method and including more concrete examples.';
    } else {
      return 'Your answer needs more preparation. Practice articulating your experiences using structured frameworks like STAR.';
    }
  }

  /**
   * Generates personalized recommendations
   */
  private generateRecommendations(improvementAreas: string[], score: number): Record<string, unknown>[] {
    const recommendations: Record<string, unknown>[] = [];

    if (score < 70) {
      recommendations.push({
        priority: 'high',
        focus: 'Practice Mode',
        action: 'Complete at least 5 more practice sessions',
        tip: 'Focus on building confidence in answering common questions',
      });
    }

    if (improvementAreas.includes('Structure')) {
      recommendations.push({
        priority: 'high',
        focus: 'STAR Method',
        action: 'Review and practice the STAR framework',
        tip: 'Always start with Situation/Task, explain Action, and end with Result',
      });
    }

    if (improvementAreas.includes('Results')) {
      recommendations.push({
        priority: 'medium',
        focus: 'Quantifiable Achievements',
        action: 'Prepare 3-5 quantified achievement stories',
        tip: 'Include specific numbers, percentages, and measurable outcomes',
      });
    }

    recommendations.push({
      priority: 'medium',
      focus: 'Mock Interview',
      action: 'Schedule a mock interview with feedback',
      tip: 'Practice with a friend or mentor to get real-time feedback',
    });

    return recommendations;
  }
}
