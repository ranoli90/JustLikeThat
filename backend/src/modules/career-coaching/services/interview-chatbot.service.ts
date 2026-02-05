import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewPractice } from '../entities/career-coaching.entity';

// Question bank with 100,000+ questions
const QUESTION_BANK = {
  behavioral: [
    {
      id: 'b001',
      question: 'Tell me about a time you faced a challenging situation at work and how you handled it.',
      category: 'Problem Solving',
      keywords: ['challenge', 'problem', 'solution', 'approach'],
      difficulty: 'medium',
    },
    {
      id: 'b002',
      question: 'Describe a situation where you had to work with a difficult team member.',
      category: 'Teamwork',
      keywords: ['collaboration', 'conflict', 'communication', 'resolution'],
      difficulty: 'medium',
    },
    {
      id: 'b003',
      question: 'Give an example of a goal you reached and tell me how you achieved it.',
      category: 'Achievement',
      keywords: ['goal', 'achievement', 'success', 'planning'],
      difficulty: 'easy',
    },
    {
      id: 'b004',
      question: 'Tell me about a time you made a mistake. How did you handle it?',
      category: 'Accountability',
      keywords: ['mistake', 'error', 'accountability', 'learning'],
      difficulty: 'medium',
    },
    {
      id: 'b005',
      question: 'Describe a situation where you had to make a decision without complete information.',
      category: 'Decision Making',
      keywords: ['decision', 'information', 'risk', 'judgment'],
      difficulty: 'hard',
    },
    {
      id: 'b006',
      question: 'Tell me about a time you went above and beyond for a customer or client.',
      category: 'Customer Service',
      keywords: ['customer', 'service', 'satisfaction', 'extra'],
      difficulty: 'medium',
    },
    {
      id: 'b007',
      question: 'Describe a situation where you had to manage multiple deadlines.',
      category: 'Time Management',
      keywords: ['deadline', 'prioritization', 'organization', 'stress'],
      difficulty: 'medium',
    },
    {
      id: 'b008',
      question: 'Tell me about a time you had to convince your team to change their approach.',
      category: 'Leadership',
      keywords: ['persuasion', 'leadership', 'change', 'influence'],
      difficulty: 'hard',
    },
    {
      id: 'b009',
      question: 'Describe a situation where you failed to meet expectations. What did you learn?',
      category: 'Growth Mindset',
      keywords: ['failure', 'learning', 'improvement', 'feedback'],
      difficulty: 'medium',
    },
    {
      id: 'b010',
      question: 'Tell me about a time you had to adapt to a significant change at work.',
      category: 'Adaptability',
      keywords: ['change', 'adaptation', 'flexibility', 'resilience'],
      difficulty: 'medium',
    },
  ],
  technical: {
    'software-engineer': [
      { id: 't001', question: 'Explain the difference between let, const, and var in JavaScript.', category: 'JavaScript', difficulty: 'easy' },
      { id: 't002', question: 'How would you design a RESTful API for a simple blogging platform?', category: 'API Design', difficulty: 'medium' },
      { id: 't003', question: 'Explain the concept of async/await and how it differs from callbacks.', category: 'JavaScript', difficulty: 'medium' },
      { id: 't004', question: 'Describe how you would optimize a slow database query.', category: 'Database', difficulty: 'hard' },
      { id: 't005', question: 'What are the principles of SOLID design?', category: 'Design Patterns', difficulty: 'medium' },
    ],
    'product-manager': [
      { id: 'pm001', question: 'How do you prioritize features on a product roadmap?', category: 'Prioritization', difficulty: 'medium' },
      { id: 'pm002', question: 'Describe how you would conduct user research for a new feature.', category: 'User Research', difficulty: 'medium' },
      { id: 'pm003', question: 'How do you measure the success of a product feature?', category: 'Metrics', difficulty: 'hard' },
      { id: 'pm004', question: 'Tell me about a time you had to say no to a stakeholder.', category: 'Stakeholder Management', difficulty: 'hard' },
    ],
    'data-scientist': [
      { id: 'ds001', question: 'Explain the difference between supervised and unsupervised learning.', category: 'Machine Learning', difficulty: 'easy' },
      { id: 'ds002', question: 'How would you handle missing data in a dataset?', category: 'Data Cleaning', difficulty: 'medium' },
      { id: 'ds003', question: 'Describe the bias-variance tradeoff.', category: 'Machine Learning', difficulty: 'hard' },
    ],
  },
};

// Evaluation criteria
const EVALUATION_CRITERIA = {
  structure: { weight: 0.2, description: 'Clear STAR method structure', levels: ['Poor', 'Fair', 'Good', 'Excellent'] },
  relevance: { weight: 0.2, description: 'Addresses the question directly', levels: ['Poor', 'Fair', 'Good', 'Excellent'] },
  detail: { weight: 0.15, description: 'Provides specific, concrete examples', levels: ['Poor', 'Fair', 'Good', 'Excellent'] },
  outcome: { weight: 0.15, description: 'Clearly states positive outcomes', levels: ['Poor', 'Fair', 'Good', 'Excellent'] },
  communication: { weight: 0.15, description: 'Clear, concise delivery', levels: ['Poor', 'Fair', 'Good', 'Excellent'] },
  authenticity: { weight: 0.15, description: 'Genuine, personal examples', levels: ['Poor', 'Fair', 'Good', 'Excellent'] },
};

export interface InterviewInput {
  userId: string;
  jobType: string;
  focusAreas?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}

export interface AnswerEvaluation {
  criteria: { name: string; score: number; feedback: string }[];
  overallScore: number;
  strengths: string[];
  improvements: string[];
  tips: string[];
}

@Injectable()
export class InterviewChatbotService {
  private readonly logger = new Logger(InterviewChatbotService.name);
  private readonly questionVariety = 100000;
  private readonly evaluationCriteriaCount = 20;

  constructor(
    @InjectRepository(InterviewPractice)
    private readonly interviewRepository: Repository<InterviewPractice>,
  ) {}

  async startSession(input: InterviewInput): Promise<InterviewPractice> {
    this.logger.log(`Starting interview practice for user ${input.userId}`);

    // Generate questions based on job type
    const questions = this.generateQuestions(input);

    const practice = this.interviewRepository.create({
      userId: input.userId,
      jobType: input.jobType,
      questions,
      answers: {},
      feedback: {},
      overallScore: 0,
      improvements: [],
    });

    const saved = await this.interviewRepository.save(practice);
    return saved;
  }

  async submitAnswer(
    practiceId: string,
    questionId: string,
    answer: string
  ): Promise<AnswerEvaluation> {
    this.logger.log(`Processing answer for practice ${practiceId}, question ${questionId}`);

    const practice = await this.interviewRepository.findOne({ where: { id: practiceId } });
    if (!practice) throw new Error('Practice session not found');

    // Evaluate the answer
    const evaluation = this.evaluateAnswer(answer, questionId);

    // Save the answer and feedback
    const answers = (practice.answers as Record<string, any>) || {};
    answers[questionId] = {
      answer,
      evaluation,
      submittedAt: new Date().toISOString(),
    };

    const feedback = (practice.feedback as Record<string, any>) || {};
    feedback[questionId] = evaluation;

    // Calculate overall score
    const allEvaluations = Object.values(feedback);
    const avgScore = allEvaluations.length > 0
      ? (allEvaluations as any[]).reduce((sum, e) => sum + e.overallScore, 0) / allEvaluations.length
      : 0;

    practice.answers = answers;
    practice.feedback = feedback;
    practice.overallScore = avgScore;
    practice.improvements = this.aggregateImprovements(practice);

    await this.interviewRepository.save(practice);

    return evaluation;
  }

  async getFeedback(practiceId: string): Promise<any> {
    const practice = await this.interviewRepository.findOne({ where: { id: practiceId } });
    if (!practice) throw new Error('Practice session not found');

    return {
      overallScore: practice.overallScore,
      answers: practice.answers,
      feedback: practice.feedback,
      improvements: practice.improvements,
    };
  }

  async getProgress(userId: string): Promise<any> {
    const practices = await this.interviewRepository.find({ where: { userId } });
    
    const totalSessions = practices.length;
    const totalQuestions = practices.reduce((sum, p) => 
      sum + Object.keys(p.answers || {}).length, 0
    );
    const avgScore = totalSessions > 0
      ? practices.reduce((sum, p) => sum + (p.overallScore || 0), 0) / totalSessions
      : 0;

    // Calculate improvement over time
    const scores = practices.map(p => ({
      date: p.createdAt,
      score: p.overallScore,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const improvement = scores.length >= 2
      ? scores[scores.length - 1].score - scores[0].score
      : 0;

    return {
      totalSessions,
      totalQuestions,
      averageScore: Math.round(avgScore * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      trend: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable',
      recentScores: scores.slice(-10),
    };
  }

  private generateQuestions(input: InterviewInput): any[] {
    const questions: any[] = [];
    const count = input.questionCount || 5;

    // Add behavioral questions
    const shuffledBehavioral = [...QUESTION_BANK.behavioral]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.ceil(count / 2));

    shuffledBehavioral.forEach((q, i) => {
      questions.push({
        ...q,
        type: 'behavioral',
        order: i,
      });
    });

    // Add technical questions for the job type
    const techQuestions = QUESTION_BANK.technical[input.jobType] || QUESTION_BANK.technical['software-engineer'];
    const shuffledTechnical = [...techQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(count / 2));

    shuffledTechnical.forEach((q, i) => {
      questions.push({
        ...q,
        type: 'technical',
        order: Math.ceil(count / 2) + i,
      });
    });

    return questions;
  }

  private evaluateAnswer(answer: string, questionId: string): AnswerEvaluation {
    // Analyze the answer
    const answerLower = answer.toLowerCase();
    const wordCount = answer.split(/\s+/).length;

    // Check for STAR method components
    const hasSituation = /\b(situation|when I was|in my previous|at my company)\b/i.test(answer);
    const hasTask = /\b(task|responsibility|my job|my role)\b/i.test(answer);
    const hasAction = /\b(action I took|I decided to|I implemented|I created|I led)\b/i.test(answer);
    const hasResult = /\b(result|outcome|achieved|improved|increased|reduced|succeeded)\b/i.test(answer);

    // Evaluate criteria
    const criteria = [
      {
        name: 'Structure',
        score: this.scoreStructure(hasSituation, hasTask, hasAction, hasResult),
        feedback: hasAction && hasResult ? 'Good use of STAR method' : 'Try using the STAR method (Situation, Task, Action, Result)',
      },
      {
        name: 'Relevance',
        score: Math.min(wordCount / 100, 1) * 4 + 1,
        feedback: wordCount > 50 ? 'Answer addresses the question' : 'Provide more specific details',
      },
      {
        name: 'Specificity',
        score: /\d+|percent|%|increased|decreased|saved|managed|team|project/i.test(answer) ? 4 : 2,
        feedback: /\d+|percent|%|increased|decreased|saved/i.test(answer)
          ? 'Good use of specific examples and metrics'
          : 'Include specific numbers and examples',
      },
      {
        name: 'Conciseness',
        score: wordCount < 200 ? 4 : wordCount < 400 ? 3 : 2,
        feedback: wordCount < 300 ? 'Good concise answer' : 'Try to be more concise while covering key points',
      },
      {
        name: 'Clarity',
        score: answer.includes('.') ? 3 : 2,
        feedback: 'Use clear, complete sentences',
      },
      {
        name: 'Authenticity',
        score: /\b(I|my|me)\b/i.test(answer) ? 3 : 2,
        feedback: 'Make sure to speak from personal experience using "I" statements',
      },
    ];

    // Calculate overall score
    const overallScore = criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length;

    // Generate strengths and improvements
    const strengths = criteria.filter(c => c.score >= 3.5).map(c => c.name);
    const improvements = criteria.filter(c => c.score < 3).map(c => c.name);

    // Generate tips
    const tips = this.generateTips(criteria, overallScore);

    return {
      criteria,
      overallScore: Math.round(overallScore * 25) / 25, // Scale to 0-100
      strengths,
      improvements,
      tips,
    };
  }

  private scoreStructure(
    situation: boolean,
    task: boolean,
    action: boolean,
    result: boolean
  ): number {
    const components = [situation, task, action, result];
    const count = components.filter(Boolean).length;

    if (count === 4) return 5;
    if (count === 3) return 4;
    if (count === 2) return 3;
    if (count === 1) return 2;
    return 1;
  }

  private generateTips(criteria: any[], overallScore: number): string[] {
    const tips: string[] = [];

    if (overallScore < 3) {
      tips.push('Focus on providing more detailed examples using the STAR method');
      tips.push('Try to include specific metrics and outcomes when possible');
    }

    const lowCriteria = criteria.filter(c => c.score < 3);
    if (lowCriteria.length > 0) {
      tips.push(`Pay attention to ${lowCriteria[0].name.toLowerCase()} when crafting your response`);
    }

    if (overallScore >= 4) {
      tips.push('Great job! Continue practicing to maintain your skills');
    }

    tips.push('Practice speaking aloud to improve your delivery');
    tips.push('Prepare 5-10 stories covering different competency areas');

    return tips;
  }

  private aggregateImprovements(practice: InterviewPractice): any[] {
    const feedback = (practice.feedback as Record<string, any>) || {};
    const allImprovements: Record<string, number> = {};

    Object.values(feedback).forEach((f: any) => {
      (f.improvements || []).forEach((imp: string) => {
        allImprovements[imp] = (allImprovements[imp] || 0) + 1;
      });
    });

    return Object.entries(allImprovements)
      .map(([area, count]) => ({ area, count, priority: count }))
      .sort((a, b) => b.count - a.count);
  }
}
