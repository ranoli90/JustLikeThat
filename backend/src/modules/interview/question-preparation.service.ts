import { Injectable } from '@nestjs/common';
import { QuestionType, Difficulty } from '../../entities/interview-question.entity';

export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  suggestedAnswer: string;
  difficulty: Difficulty;
  tags: string[];
}

@Injectable()
export class QuestionPreparationService {
  /**
   * Generates interview questions based on type and job title
   */
  async generateQuestions(
    interviewType: string,
    jobTitle?: string,
    count: number = 5,
  ): Promise<GeneratedQuestion[]> {
    const questions = this.getQuestionsForType(interviewType, jobTitle);
    return questions.slice(0, count);
  }

  /**
   * Generates behavioral questions
   */
  async generateBehavioralQuestions(count: number = 5): Promise<GeneratedQuestion[]> {
    return this.getBehavioralQuestions().slice(0, count);
  }

  /**
   * Generates technical questions
   */
  async generateTechnicalQuestions(
    jobTitle?: string,
    count: number = 5,
  ): Promise<GeneratedQuestion[]> {
    return this.getTechnicalQuestions(jobTitle).slice(0, count);
  }

  /**
   * Generates situational questions
   */
  async generateSituationalQuestions(count: number = 5): Promise<GeneratedQuestion[]> {
    return this.getSituationalQuestions().slice(0, count);
  }

  /**
   * Gets suggested answer structure for a question type
   */
  getAnswerStructure(questionType: QuestionType): Record<string, unknown> {
    const structures: Record<QuestionType, Record<string, unknown>> = {
      [QuestionType.BEHAVIORAL]: {
        method: 'STAR',
        description: 'Situation, Task, Action, Result',
        tips: [
          'Be specific about the situation',
          'Explain your role clearly',
          'Focus on your actions',
          'Quantify the results',
        ],
      },
      [QuestionType.TECHNICAL]: {
        method: 'PAR',
        description: 'Problem, Action, Result',
        tips: [
          'Define the problem clearly',
          'Explain your technical approach',
          'Discuss alternatives considered',
          'Share outcomes and learnings',
        ],
      },
      [QuestionType.SITUATIONAL]: {
        method: 'STAR',
        description: 'Situation, Task, Action, Result',
        tips: [
          'Hypothetical scenario approach',
          'Show logical reasoning',
          'Demonstrate soft skills',
          'Consider multiple perspectives',
        ],
      },
      [QuestionType.COMPANY_CULTURE]: {
        method: 'CLEAR',
        description: 'Connection, Learning, Experience, Alignment, Research',
        tips: [
          'Show research about the company',
          'Align values with personal goals',
          'Share relevant experiences',
          'Ask insightful questions',
        ],
      },
      [QuestionType.ROLE_SPECIFIC]: {
        method: 'EXPERT',
        description: 'Experience, Skills, Performance, Examples, Results, Training',
        tips: [
          'Highlight relevant experience',
          'Demonstrate specific skills',
          'Show measurable impact',
          'Connect to role requirements',
        ],
      },
      [QuestionType.CAREER_GOALS]: {
        method: 'SMART',
        description: 'Specific, Measurable, Achievable, Relevant, Time-bound',
        tips: [
          'Show long-term thinking',
          'Demonstrate growth mindset',
          'Connect goals to the role',
          'Show alignment with company',
        ],
      },
      [QuestionType.SALARY]: {
        method: 'FLEX',
        description: 'Facts, Flexibility, Expansion, eXperience',
        tips: [
          'Know your market value',
          'Be open to negotiation',
          'Consider total compensation',
          'Focus on value provided',
        ],
      },
      [QuestionType.GENERAL]: {
        method: 'SIMPLE',
        description: 'Structured, Interesting, Memorable, Personal, Lasting, Engaging',
        tips: [
          'Be authentic',
          'Show personality',
          'Stay professional',
          'Be memorable',
        ],
      },
    };

    return structures[questionType] || structures[QuestionType.GENERAL];
  }

  /**
   * Gets questions for a specific interview type
   */
  private getQuestionsForType(interviewType: string, jobTitle?: string): GeneratedQuestion[] {
    switch (interviewType) {
      case 'BEHAVIORAL':
        return this.getBehavioralQuestions();
      case 'TECHNICAL':
        return this.getTechnicalQuestions(jobTitle);
      case 'SITUATIONAL':
        return this.getSituationalQuestions();
      case 'CASE_STUDY':
        return this.getCaseStudyQuestions();
      case 'PANEL':
        return this.getPanelInterviewQuestions();
      default:
        return this.getMixedQuestions();
    }
  }

  private getBehavioralQuestions(): GeneratedQuestion[] {
    return [
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Tell me about a time you faced a significant challenge at work. How did you handle it?',
        suggestedAnswer: 'Describe a specific situation using the STAR method. Focus on your actions and the positive outcome.',
        difficulty: Difficulty.MEDIUM,
        tags: ['problem-solving', 'resilience', 'communication'],
      },
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Give me an example of a goal you reached and tell me how you achieved it.',
        suggestedAnswer: 'Set SMART goals and explain your action plan. Highlight measurable results.',
        difficulty: Difficulty.EASY,
        tags: ['goal-setting', 'achievement', 'planning'],
      },
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Describe a time you had a conflict with a coworker. How did you resolve it?',
        suggestedAnswer: 'Focus on professional conflict resolution. Show emotional intelligence and collaboration.',
        difficulty: Difficulty.MEDIUM,
        tags: ['conflict-resolution', 'communication', 'teamwork'],
      },
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Tell me about a time you showed leadership.',
        suggestedAnswer: 'Even without a formal title, demonstrate leadership qualities like initiative and guidance.',
        difficulty: Difficulty.MEDIUM,
        tags: ['leadership', 'initiative', 'influence'],
      },
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Give an example of a time you made a mistake. What did you learn from it?',
        suggestedAnswer: 'Be honest about the mistake. Focus on accountability and growth.',
        difficulty: Difficulty.HARD,
        tags: ['accountability', 'learning', 'growth'],
      },
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Describe a situation where you had to work under pressure or tight deadlines.',
        suggestedAnswer: 'Show time management, prioritization, and maintaining quality under pressure.',
        difficulty: Difficulty.MEDIUM,
        tags: ['time-management', 'stress-management', 'prioritization'],
      },
      {
        type: QuestionType.BEHAVIORAL,
        text: 'Tell me about a time you had to convince someone to see things your way.',
        suggestedAnswer: 'Demonstrate persuasion skills while respecting others\' perspectives.',
        difficulty: Difficulty.MEDIUM,
        tags: ['persuasion', 'communication', 'negotiation'],
      },
    ];
  }

  private getTechnicalQuestions(jobTitle?: string): GeneratedQuestion[] {
    const isSoftwareRole = jobTitle?.toLowerCase().includes('software') ||
                           jobTitle?.toLowerCase().includes('developer') ||
                           jobTitle?.toLowerCase().includes('engineer');

    if (isSoftwareRole) {
      return [
        {
          type: QuestionType.TECHNICAL,
          text: 'Explain the difference between REST and GraphQL APIs.',
          suggestedAnswer: 'Cover key differences in data fetching, over-fetching, under-fetching, and use cases.',
          difficulty: Difficulty.MEDIUM,
          tags: ['API', 'REST', 'GraphQL', 'backend'],
        },
        {
          type: QuestionType.TECHNICAL,
          text: 'How would you design a scalable system for handling millions of requests?',
          suggestedAnswer: 'Discuss load balancing, caching, database sharding, and microservices architecture.',
          difficulty: Difficulty.HARD,
          tags: ['system-design', 'scalability', 'architecture'],
        },
        {
          type: QuestionType.TECHNICAL,
          text: 'Explain the concept of dependency injection and why it\'s useful.',
          suggestedAnswer: 'Cover loose coupling, testability, and design patterns.',
          difficulty: Difficulty.MEDIUM,
          tags: ['design-patterns', 'testing', 'architecture'],
        },
        {
          type: QuestionType.TECHNICAL,
          text: 'How do you optimize a slow database query?',
          suggestedAnswer: 'Discuss indexing, query optimization, caching, and database design.',
          difficulty: Difficulty.MEDIUM,
          tags: ['database', 'performance', 'optimization'],
        },
        {
          type: QuestionType.TECHNICAL,
          text: 'What is the difference between synchronous and asynchronous programming?',
          suggestedAnswer: 'Cover event loops, promises, async/await, and use cases for each.',
          difficulty: Difficulty.EASY,
          tags: ['async', 'programming-paradigm', 'performance'],
        },
      ];
    }

    return [
      {
        type: QuestionType.TECHNICAL,
        text: `What tools and techniques do you use to stay current with industry trends in ${jobTitle || 'your field'}?`,
        suggestedAnswer: 'Show commitment to continuous learning and professional development.',
        difficulty: Difficulty.EASY,
        tags: ['learning', 'professional-development'],
      },
      {
        type: QuestionType.TECHNICAL,
        text: 'Describe a technical project you worked on and the challenges you faced.',
        suggestedAnswer: 'Use the STAR method with technical depth. Explain solutions implemented.',
        difficulty: Difficulty.MEDIUM,
        tags: ['project-experience', 'problem-solving'],
      },
    ];
  }

  private getSituationalQuestions(): GeneratedQuestion[] {
    return [
      {
        type: QuestionType.SITUATIONAL,
        text: 'If you were starting a new project from scratch, what would be your first three steps?',
        suggestedAnswer: 'Show your planning and prioritization approach. Mention research, stakeholders, and planning.',
        difficulty: Difficulty.MEDIUM,
        tags: ['planning', 'project-management', 'strategy'],
      },
      {
        type: QuestionType.SITUATIONAL,
        text: 'How would you handle a situation where you disagreed with your manager\'s decision?',
        suggestedAnswer: 'Show respect for hierarchy while demonstrating professional courage and communication.',
        difficulty: Difficulty.MEDIUM,
        tags: ['communication', 'conflict', 'professionalism'],
      },
      {
        type: QuestionType.SITUATIONAL,
        text: 'What would you do if you noticed a coworker was struggling with their workload?',
        suggestedAnswer: 'Demonstrate teamwork, empathy, and problem-solving.',
        difficulty: Difficulty.EASY,
        tags: ['teamwork', 'support', 'empathy'],
      },
      {
        type: QuestionType.SITUATIONAL,
        text: 'How would you prioritize if you had multiple urgent tasks with conflicting deadlines?',
        suggestedAnswer: 'Show prioritization framework and stakeholder communication.',
        difficulty: Difficulty.MEDIUM,
        tags: ['prioritization', 'time-management', 'communication'],
      },
    ];
  }

  private getCaseStudyQuestions(): GeneratedQuestion[] {
    return [
      {
        type: QuestionType.ROLE_SPECIFIC,
        text: 'How would you improve our product if you joined our team tomorrow?',
        suggestedAnswer: 'Show product thinking. Mention user research, data analysis, and strategic thinking.',
        difficulty: Difficulty.HARD,
        tags: ['product-thinking', 'strategy', 'innovation'],
      },
      {
        type: QuestionType.ROLE_SPECIFIC,
        text: 'How would you increase our market share by 20% in the next quarter?',
        suggestedAnswer: 'Demonstrate business acumen. Cover marketing, product, and operational strategies.',
        difficulty: Difficulty.HARD,
        tags: ['business-strategy', 'growth', 'analytical'],
      },
    ];
  }

  private getPanelInterviewQuestions(): GeneratedQuestion[] {
    return [
      {
        type: QuestionType.COMPANY_CULTURE,
        text: 'Why do you want to work at our company specifically?',
        suggestedAnswer: 'Show research about the company. Connect your values with the company mission.',
        difficulty: Difficulty.EASY,
        tags: ['company-fit', 'motivation', 'research'],
      },
      {
        type: QuestionType.CAREER_GOALS,
        text: 'Where do you see yourself in 5 years?',
        suggestedAnswer: 'Show career progression thinking. Align goals with potential growth at the company.',
        difficulty: Difficulty.EASY,
        tags: ['career-planning', 'growth', 'aspirations'],
      },
      {
        type: QuestionType.GENERAL,
        text: 'What questions do you have for us?',
        suggestedAnswer: 'Prepare thoughtful questions that show depth and genuine interest.',
        difficulty: Difficulty.EASY,
        tags: ['engagement', 'curiosity', 'preparation'],
      },
    ];
  }

  private getMixedQuestions(): GeneratedQuestion[] {
    return [
      ...this.getBehavioralQuestions().slice(0, 3),
      ...this.getSituationalQuestions().slice(0, 2),
    ];
  }
}
