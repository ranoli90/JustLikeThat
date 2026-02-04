import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PostInterviewAction, FollowUpType, ActionStatus } from '../../entities/post-interview-action.entity';

export interface CreatePostInterviewDto {
  userId: string;
  applicationId: string;
  interviewDate: Date;
  followUpType: FollowUpType;
  dueDate?: Date;
  message?: string;
}

export interface ThankYouNote {
  subject: string;
  body: string;
  tips: string[];
}

@Injectable()
export class PostInterviewService {
  constructor(
    @InjectRepository(PostInterviewAction)
    private readonly actionRepository: Repository<PostInterviewAction>,
  ) {}

  /**
   * Creates a new post-interview action
   */
  async createAction(dto: CreatePostInterviewDto): Promise<PostInterviewAction> {
    const dueDate = dto.dueDate || this.calculateDueDate(dto.interviewDate, dto.followUpType);

    const action = this.actionRepository.create({
      userId: dto.userId,
      applicationId: dto.applicationId,
      interviewDate: dto.interviewDate,
      followUpType: dto.followUpType,
      dueDate,
      message: dto.message,
      status: ActionStatus.PENDING,
    });

    return this.actionRepository.save(action);
  }

  /**
   * Gets all actions for a user
   */
  async getUserActions(userId: string): Promise<PostInterviewAction[]> {
    return this.actionRepository.find({
      where: { userId },
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Gets pending actions
   */
  async getPendingActions(userId: string): Promise<PostInterviewAction[]> {
    return this.actionRepository.find({
      where: { userId, status: ActionStatus.PENDING },
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Gets actions for a specific application
   */
  async getApplicationActions(applicationId: string): Promise<PostInterviewAction[]> {
    return this.actionRepository.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates action status
   */
  async updateActionStatus(
    actionId: string,
    status: ActionStatus,
    message?: string,
  ): Promise<PostInterviewAction> {
    const action = await this.actionRepository.findOne({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    action.status = status;
    if (status === ActionStatus.SENT && !action.sentAt) {
      action.sentAt = new Date();
    }
    if (message) {
      action.message = message;
    }

    return this.actionRepository.save(action);
  }

  /**
   * Generates a thank you note template
   */
  generateThankYouNote(params: {
    interviewerName?: string;
    companyName: string;
    position: string;
    keyTopics: string[];
    interviewDate: Date;
  }): ThankYouNote {
    const dateStr = params.interviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Thank you - ${params.position} interview on ${dateStr}`;

    const topicsHtml = params.keyTopics
      .map((topic, i) => `<li>Our discussion about ${topic.toLowerCase()}</li>`)
      .join('\n');

    const body = `
Dear ${params.interviewerName || 'Hiring Manager'},

Thank you so much for taking the time to meet with me on ${dateStr} to discuss the ${params.position} position at ${params.companyName}. I truly enjoyed our conversation and learning more about the team.

I'm even more excited about this opportunity after learning about the team's goals and challenges. Our discussion about the key priorities really resonated with me, and I believe my experience in ${params.keyTopics[0] || 'the relevant areas'} would allow me to contribute quickly.

I was particularly intrigued by:
<ul>
${topicsHtml}
</ul>

I want to reiterate my strong interest in this role and ${params.companyName}. I believe my skills and experience align well with what you're looking for, and I'm confident I could make a meaningful impact on the team.

Please don't hesitate to reach out if you need any additional information from me. I look forward to hearing from you about the next steps.

Best regards,
[Your Name]

---
Sent from my interview follow-up assistant
    `.trim();

    return {
      subject,
      body,
      tips: [
        'Send within 24 hours of the interview',
        'Personalize with specific discussion points',
        'Keep it concise (200-300 words)',
        'Proofread carefully before sending',
        'Include a specific call to action or question',
        'Send from a professional email address',
      ],
    };
  }

  /**
   * Generates a follow-up note template
   */
  generateFollowUpNote(params: {
    companyName: string;
    position: string;
    lastContactDate: Date;
    status: string;
  }): { subject: string; body: string } {
    const daysSince = Math.floor(
      (new Date().getTime() - params.lastContactDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const subject = `Follow-up: ${params.position} at ${params.companyName}`;

    const body = `
Dear Hiring Manager,

I wanted to follow up on my interview for the ${params.position} position on ${params.lastContactDate.toLocaleDateString()}. I understand that the hiring process takes time, and I appreciate your patience.

I'm still very interested in this opportunity and would love to provide any additional information that might help with your decision.

Please let me know if there's anything else I can share or if there have been any updates regarding the timeline.

Thank you again for considering my application.

Best regards,
[Your Name]
    `.trim();

    return { subject, body };
  }

  /**
   * Gets post-interview guidance
   */
  getPostInterviewGuidance(): Record<string, unknown> {
    return {
      timeline: {
        'same-day': 'Send thank you email within hours',
        'day-after': 'Complete all follow-up communications',
        '3-5-days': 'Appropriate time for first follow-up if no response',
        '1-week': 'Send polite follow-up if no response',
        '2-weeks': 'Decision timeline typically ends here',
      },
      whatToDo: [
        'Reflect on the interview and note key points discussed',
        'Send personalized thank you notes within 24 hours',
        'Research the company more deeply',
        'Prepare for potential second interviews',
        'Update your application materials with new insights',
        'Connect with interviewers on LinkedIn (if appropriate)',
        'Keep applying to other opportunities',
      ],
      whatNotToDo: [
        'Don\'t spam the recruiter with multiple follow-ups',
        'Don\'t badmouth competitors or other offers',
        'Don\'t reveal your salary expectations unnecessarily',
        'Don\'t panic if you don\'t hear back immediately',
        'Don\'t accept the first offer without negotiation',
        'Don\'t burn bridges, even if the interview went poorly',
      ],
      signsOfInterest: [
        'Interviewer mentioned specific next steps',
        'You met with multiple team members',
        'Discussion focused on your start date',
        'They asked about your availability',
        'Interview ran longer than scheduled',
        'Enthusiastic responses to your questions',
        'Personal questions about your life outside work',
      ],
      redFlags: [
        'Vague answers about the role or team',
        'Interviewer seemed distracted or rushed',
        'No discussion of next steps',
        'Negative comments about current team members',
        'Unrealistic expectations for the role',
        'Reluctance to answer questions about the company',
      ],
    };
  }

  /**
   * Calculates due date based on follow-up type
   */
  private calculateDueDate(interviewDate: Date, followUpType: FollowUpType): Date {
    const date = new Date(interviewDate);
    
    switch (followUpType) {
      case FollowUpType.THANK_YOU:
        date.setDate(date.getDate() + 1);
        break;
      case FollowUpType.SECONDARY_FOLLOW_UP:
        date.setDate(date.getDate() + 7);
        break;
      case FollowUpType.DECISION_REQUEST:
        date.setDate(date.getDate() + 14);
        break;
      case FollowUpType.OFFER_NEGOTIATION:
        date.setDate(date.getDate() + 3);
        break;
      case FollowUpType.WITHDRAWAL:
        date.setDate(date.getDate() + 1);
        break;
    }
    
    return date;
  }

  /**
   * Deletes an action
   */
  async deleteAction(actionId: string): Promise<void> {
    const action = await this.actionRepository.findOne({
      where: { id: actionId },
    });
    if (action) {
      await this.actionRepository.remove(action);
    }
  }
}
