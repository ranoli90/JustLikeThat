import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareerConversation } from '../entities/career-coaching.entity';

/**
 * Represents a chat message in a career advisory conversation
 */
export interface ChatMessage {
  role: 'user' | 'advisor' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Context provided to the career advisor for generating personalized responses
 */
export interface AdvisorContext {
  userProfile?: Record<string, unknown>;
  careerGoals?: Array<Record<string, unknown>>;
  currentSkills?: string[];
  recentConversations?: ChatMessage[];
  sentimentHistory?: number[];
  milestones?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Response from the career advisor with recommendations and insights
 */
export interface AdvisorResponse {
  message: string;
  recommendations?: Array<Record<string, unknown>>;
  milestones?: Array<Record<string, unknown>>;
  sentiment?: number;
  contextUpdated?: boolean;
}

/**
 * Service for providing AI-powered career advisory conversations
 */
@Injectable()
export class CareerAdvisorService {
  private readonly logger = new Logger(CareerAdvisorService.name);
  private readonly conversationMemory = 100;
  private readonly personalizationDataPoints = 50;

  /** Knowledge base for career advice organized by topic */
  private readonly careerKnowledge = {
    leadership: [
      'Lead by example and demonstrate the behaviors you want to see in your team',
      'Develop your emotional intelligence to better understand team dynamics',
      'Practice active listening and give constructive feedback regularly',
      'Delegate effectively and trust your team members with autonomy',
    ],
    skills: [
      'Focus on building transferable skills that apply across industries',
      'Continuous learning is essential for career growth',
      'Seek projects that stretch your capabilities without overwhelming you',
      'Build a diverse skill set that combines technical and soft skills',
    ],
    networking: [
      'Build genuine relationships rather than transactional connections',
      'Attend industry events and conferences to expand your network',
      'Offer value to others before asking for favors',
      'Maintain relationships through regular check-ins',
    ],
    interview: [
      'Prepare specific examples using the STAR method',
      'Research the company thoroughly before each interview',
      'Practice answering common behavioral questions',
      'Prepare thoughtful questions to ask the interviewer',
    ],
    advancement: [
      'Document your achievements and quantify results where possible',
      'Seek out mentorship from senior leaders in your field',
      'Express your career ambitions to your manager',
      'Take on stretch assignments that demonstrate readiness for promotion',
    ],
  };

  constructor(
    @InjectRepository(CareerConversation)
    private readonly conversationRepository: Repository<CareerConversation>,
  ) {}

  async chat(userId: string, message: string, context?: AdvisorContext): Promise<AdvisorResponse> {
    this.logger.log(`Processing career advisor chat for user ${userId}`);

    // Retrieve conversation history
    const conversation = await this.getOrCreateConversation(userId);
    const messages = (conversation?.messages as ChatMessage[]) || [];

    // Add user message
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Generate AI response
    const response = await this.generateResponse(message, context, conversation);
    messages.push({
      role: 'advisor',
      content: response.message,
      timestamp: new Date(),
    });

    // Keep only recent messages within memory limit
    const trimmedMessages = messages.slice(-this.conversationMemory);

    // Update conversation with new messages and context
    const updatedContext = this.updateContext(context, message, response);
    const sentiment = this.analyzeSentiment(message);

    await this.saveConversation(userId, trimmedMessages, updatedContext, response, sentiment);

    return response;
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    const conversation = await this.getOrCreateConversation(userId);
    return (conversation?.messages as ChatMessage[]) || [];
  }

  async setGoal(userId: string, goal: any): Promise<any> {
    const conversation = await this.getOrCreateConversation(userId);
    const context = (conversation?.context as AdvisorContext) || {};
    
    const goals = context.careerGoals || [];
    goals.push({
      ...goal,
      createdAt: new Date().toISOString(),
      status: 'active',
    });

    context.careerGoals = goals;

    await this.conversationRepository.update(
      { id: conversation.id },
      { context },
    );

    return { success: true, goal };
  }

  async getMilestones(userId: string): Promise<any[]> {
    const conversation = await this.getOrCreateConversation(userId);
    const context = (conversation?.context as AdvisorContext) || {};
    return context.milestones || [];
  }

  async celebrateMilestone(userId: string, milestoneId: string): Promise<any> {
    const conversation = await this.getOrCreateConversation(userId);
    const context = (conversation?.context as AdvisorContext) || {};
    const milestones = context.milestones || [];

    const milestone = milestones.find((m: any) => m.id === milestoneId);
    if (milestone) {
      milestone.achieved = true;
      milestone.achievedAt = new Date().toISOString();
      context.milestones = milestones;

      await this.conversationRepository.update(
        { id: conversation.id },
        { context, recommendations: this.generateCelebration(milestone) },
      );
    }

    return { celebration: this.generateCelebration(milestone) };
  }

  private async getOrCreateConversation(userId: string): Promise<CareerConversation> {
    let conversation = await this.conversationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        userId,
        messages: [],
        context: {},
        recommendations: [],
        resolvedTopics: [],
        sentiment: 0,
      });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  private async generateResponse(
    message: string,
    context?: AdvisorContext,
    conversation?: CareerConversation,
  ): Promise<AdvisorResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Identify topic and generate appropriate response
    let topic = this.identifyTopic(lowerMessage);
    let response = '';
    let recommendations: any[] = [];
    let milestones: any[] = [];

    if (topic === 'leadership') {
      response = this.generateLeadershipAdvice(lowerMessage, context);
      recommendations = this.generateLeadershipRecommendations(context);
      milestones = this.createLeadershipMilestones(context);
    } else if (topic === 'skills') {
      response = this.generateSkillsAdvice(lowerMessage, context);
      recommendations = this.generateSkillsRecommendations(context);
      milestones = this.createSkillsMilestones(context);
    } else if (topic === 'networking') {
      response = this.generateNetworkingAdvice(lowerMessage, context);
      recommendations = this.generateNetworkingRecommendations(context);
      milestones = this.createNetworkingMilestones(context);
    } else if (topic === 'interview') {
      response = this.generateInterviewAdvice(lowerMessage, context);
      recommendations = this.generateInterviewRecommendations(context);
      milestones = this.createInterviewMilestones(context);
    } else if (topic === 'advancement') {
      response = this.generateAdvancementAdvice(lowerMessage, context);
      recommendations = this.generateAdvancementRecommendations(context);
      milestones = this.createAdvancementMilestones(context);
    } else {
      response = this.generateGeneralAdvice(lowerMessage, context);
      recommendations = this.generateGeneralRecommendations(context);
    }

    return {
      message: response,
      recommendations,
      milestones,
      sentiment: this.analyzeSentiment(message),
    };
  }

  private identifyTopic(message: string): string {
    if (message.match(/lead|manage|team|mentor|delegate/)) return 'leadership';
    if (message.match(/skill|learn|course|certif|training/)) return 'skills';
    if (message.match(/network|connect|relationship|contact/)) return 'networking';
    if (message.match(/interview|prepare|question|answer/)) return 'interview';
    if (message.match(/promot|advanc|progress|career growth/)) return 'advancement';
    return 'general';
  }

  private generateLeadershipAdvice(message: string, context?: AdvisorContext): string {
    const tips = this.careerKnowledge.leadership;
    const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

    return `Great question about leadership! Here are some key insights:

${randomTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

${context?.userProfile ? `Based on your experience as ${context.userProfile.currentRole}, I recommend focusing on:` : 'I recommend starting with building trust within your team before implementing major changes.'}

Remember, effective leadership is about serving your team while keeping the bigger picture in focus.`;
  }

  private generateSkillsAdvice(message: string, context?: AdvisorContext): string {
    const tips = this.careerKnowledge.skills;
    const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

    return `Skills development is crucial for career growth! Here are some recommendations:

${randomTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

${context?.currentSkills ? `Your current skills (${context.currentSkills.join(', ')}) provide a great foundation. Let's identify which additional skills would be most valuable for your target role.` : 'Let me help you assess your current skills and identify gaps for your career goals.'}`;
  }

  private generateNetworkingAdvice(message: string, context?: AdvisorContext): string {
    const tips = this.careerKnowledge.networking;
    const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

    return `Networking is a powerful career tool! Here are effective strategies:

${randomTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

${context?.userProfile ? `As you work on your networking strategy, consider targeting professionals in the ${context.userProfile.targetRole || 'your field'} space.` : 'Start with your existing connections and expand gradually.'}`;
  }

  private generateInterviewAdvice(message: string, context?: AdvisorContext): string {
    const tips = this.careerKnowledge.interview;
    const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

    return `Interview preparation is key to landing your dream job! Here are my top tips:

${randomTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

${context?.userProfile ? `Based on your target role, we should focus on role-specific technical questions as well as behavioral questions related to ${context.userProfile.industry || 'your industry'}.` : 'Would you like to practice with some mock interview questions?'}`;
  }

  private generateAdvancementAdvice(message: string, context?: AdvisorContext): string {
    const tips = this.careerKnowledge.advancement;
    const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

    return `Career advancement requires a strategic approach! Here are proven strategies:

${randomTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

${context?.userProfile ? `For your path from ${context.userProfile.currentRole} to ${context.userProfile.targetRole || 'the next level'}, consider these specific milestones:` : 'Let me help you create a personalized advancement plan based on your goals.'}`;
  }

  private generateGeneralAdvice(message: string, context?: AdvisorContext): string {
    return `I'm here to help with your career questions! I can assist with:

• **Career Planning** - Setting and achieving career goals
• **Skills Development** - Identifying and closing skill gaps
• **Interview Preparation** - Practice and feedback
• **Leadership Growth** - Developing management capabilities
• **Networking Strategies** - Building professional relationships
• **Career Transitions** - Changing industries or roles

What aspect of your career would you like to focus on today?`;
  }

  private generateLeadershipRecommendations(context?: AdvisorContext): any[] {
    return [
      { title: 'Complete Leadership Assessment', priority: 9, timeframe: 'Week 1-2' },
      { title: 'Find a Leadership Mentor', priority: 8, timeframe: 'Month 1' },
      { title: 'Lead a Cross-Functional Project', priority: 7, timeframe: 'Month 2-3' },
      { title: 'Develop Emotional Intelligence', priority: 8, timeframe: 'Ongoing' },
      { title: 'Build Team Development Plan', priority: 6, timeframe: 'Month 3' },
    ];
  }

  private generateSkillsRecommendations(context?: AdvisorContext): any[] {
    return [
      { title: 'Complete Skills Self-Assessment', priority: 9, timeframe: 'Week 1' },
      { title: 'Identify Top 5 Skill Gaps', priority: 10, timeframe: 'Week 2' },
      { title: 'Enroll in Online Course', priority: 8, timeframe: 'Month 1' },
      { title: 'Get Industry Certification', priority: 7, timeframe: 'Month 2-3' },
      { title: 'Apply Skills in Real Project', priority: 8, timeframe: 'Month 2' },
    ];
  }

  private generateNetworkingRecommendations(context?: AdvisorContext): any[] {
    return [
      { title: 'Update LinkedIn Profile', priority: 9, timeframe: 'Week 1' },
      { title: 'Attend Industry Event', priority: 7, timeframe: 'Month 1' },
      { title: 'Schedule 5 Coffee Chats', priority: 8, timeframe: 'Month 1' },
      { title: 'Join Professional Association', priority: 6, timeframe: 'Month 1' },
      { title: 'Contribute to Industry Discussion', priority: 7, timeframe: 'Ongoing' },
    ];
  }

  private generateInterviewRecommendations(context?: AdvisorContext): any[] {
    return [
      { title: 'Research Target Companies', priority: 9, timeframe: 'Week 1' },
      { title: 'Prepare STAR Stories', priority: 10, timeframe: 'Week 1-2' },
      { title: 'Practice Technical Questions', priority: 8, timeframe: 'Week 2' },
      { title: 'Mock Interview with Peer', priority: 7, timeframe: 'Week 2' },
      { title: 'Prepare Questions for Interviewer', priority: 8, timeframe: 'Week 2' },
    ];
  }

  private generateAdvancementRecommendations(context?: AdvisorContext): any[] {
    return [
      { title: 'Document Recent Achievements', priority: 10, timeframe: 'Week 1' },
      { title: 'Identify Promotion Criteria', priority: 9, timeframe: 'Week 1' },
      { title: 'Schedule Career Discussion with Manager', priority: 8, timeframe: 'Week 2' },
      { title: 'Take on Stretch Assignment', priority: 7, timeframe: 'Month 1' },
      { title: 'Build Executive Presence', priority: 6, timeframe: 'Month 2-3' },
    ];
  }

  private generateGeneralRecommendations(context?: AdvisorContext): any[] {
    return [
      { title: 'Set Clear Career Goals', priority: 10, timeframe: 'Week 1' },
      { title: 'Create Professional Development Plan', priority: 9, timeframe: 'Week 2' },
      { title: 'Review and Update Resume', priority: 8, timeframe: 'Month 1' },
      { title: 'Build Online Presence', priority: 7, timeframe: 'Ongoing' },
      { title: 'Seek Regular Feedback', priority: 8, timeframe: 'Monthly' },
    ];
  }

  private createLeadershipMilestones(context?: AdvisorContext): any[] {
    return [
      { id: 'm1', title: 'Complete Leadership Assessment', status: 'pending', timeline: 'Week 1-2' },
      { id: 'm2', title: 'Find and Meet with Mentor', status: 'pending', timeline: 'Month 1' },
      { id: 'm3', title: 'Lead First Cross-Functional Project', status: 'pending', timeline: 'Month 2-3' },
      { id: 'm4', title: 'Receive Positive Team Feedback', status: 'pending', timeline: 'Month 3' },
    ];
  }

  private createSkillsMilestones(context?: AdvisorContext): any[] {
    return [
      { id: 'm1', title: 'Complete Skills Assessment', status: 'pending', timeline: 'Week 1' },
      { id: 'm2', title: 'Enroll in Course', status: 'pending', timeline: 'Week 2' },
      { id: 'm3', title: 'Complete Course Modules', status: 'pending', timeline: 'Month 1' },
      { id: 'm4', title: 'Apply Skill in Project', status: 'pending', timeline: 'Month 2' },
    ];
  }

  private createNetworkingMilestones(context?: AdvisorContext): any[] {
    return [
      { id: 'm1', title: 'Optimize LinkedIn Profile', status: 'pending', timeline: 'Week 1' },
      { id: 'm2', title: 'Attend First Networking Event', status: 'pending', timeline: 'Month 1' },
      { id: 'm3', title: 'Schedule 5 Informational Interviews', status: 'pending', timeline: 'Month 1' },
      { id: 'm4', title: 'Receive Warm Introduction', status: 'pending', timeline: 'Month 2' },
    ];
  }

  private createInterviewMilestones(context?: AdvisorContext): any[] {
    return [
      { id: 'm1', title: 'Research Companies', status: 'pending', timeline: 'Week 1' },
      { id: 'm2', title: 'Prepare 10 STAR Stories', status: 'pending', timeline: 'Week 2' },
      { id: 'm3', title: 'Complete Mock Interview', status: 'pending', timeline: 'Week 2' },
      { id: 'm4', title: 'Land First Interview', status: 'pending', timeline: 'Month 1' },
    ];
  }

  private createAdvancementMilestones(context?: AdvisorContext): any[] {
    return [
      { id: 'm1', title: 'Document Achievements', status: 'pending', timeline: 'Week 1' },
      { id: 'm2', title: 'Meet with Manager', status: 'pending', timeline: 'Week 2' },
      { id: 'm3', title: 'Take Stretch Assignment', status: 'pending', timeline: 'Month 1' },
      { id: 'm4', title: 'Get Promotion', status: 'pending', timeline: 'Month 6' },
    ];
  }

  private updateContext(
    context: AdvisorContext | undefined,
    message: string,
    response: AdvisorResponse,
  ): AdvisorContext {
    const sentimentHistory = context?.sentimentHistory || [];
    sentimentHistory.push(response.sentiment || 0);
    
    return {
      ...context,
      recentConversations: [
        ...(context?.recentConversations || []).slice(-10),
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'advisor', content: response.message, timestamp: new Date() },
      ],
      sentimentHistory: sentimentHistory.slice(-20),
    };
  }

  private analyzeSentiment(message: string): number {
    const positiveWords = ['great', 'excited', 'happy', 'love', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['frustrated', 'disappointed', 'sad', 'difficult', 'struggling', 'worried', 'anxious', 'failed'];

    const lowerMessage = message.toLowerCase();
    let score = 0.5;

    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 0.1;
    });

    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 0.1;
    });

    return Math.max(0, Math.min(1, score));
  }

  private generateCelebration(milestone: any): any {
    return {
      type: 'milestone_achieved',
      message: `🎉 Congratulations on completing "${milestone?.title || 'this milestone'}"!`,
      badges: ['achiever', 'growth-mindset'],
      points: 100,
      encouragement: 'Keep up the excellent work! Your dedication to growth is inspiring.',
    };
  }

  private async saveConversation(
    userId: string,
    messages: ChatMessage[],
    context: AdvisorContext,
    response: AdvisorResponse,
    sentiment: number,
  ): Promise<void> {
    const conversation = await this.getOrCreateConversation(userId);
    
    await this.conversationRepository.update(
      { id: conversation.id },
      {
        messages,
        context,
        recommendations: response.recommendations,
        sentiment,
      },
    );
  }
}
