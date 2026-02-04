import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSchedule } from '../../entities/interview-schedule.entity';
import { InterviewFormat } from '../../entities/interview-session.entity';

export interface CreateScheduleDto {
  sessionId: string;
  interviewDate: Date;
  timezone: string;
  location?: string;
  meetingLink?: string;
  attendees?: { name: string; role: string }[];
  dressCode?: string;
}

export interface PreparationTips {
  general: string[];
  technical: string[];
  behavioral: string[];
  dressCode: string[];
  logistics: string[];
  mental: string[];
}

@Injectable()
export class InterviewSchedulingService {
  constructor(
    @InjectRepository(InterviewSchedule)
    private readonly scheduleRepository: Repository<InterviewSchedule>,
  ) {}

  /**
   * Creates an interview schedule
   */
  async createSchedule(
    sessionId: string,
    interviewDate: Date,
    timezone: string,
  ): Promise<InterviewSchedule> {
    const schedule = this.scheduleRepository.create({
      sessionId,
      interviewDate,
      timezone,
      reminders: this.generateReminders(interviewDate),
      preparationChecklist: this.getDefaultChecklist(),
    });

    return this.scheduleRepository.save(schedule);
  }

  /**
   * Gets schedule by session ID
   */
  async getSchedule(sessionId: string): Promise<InterviewSchedule | null> {
    return this.scheduleRepository.findOne({
      where: { sessionId },
    });
  }

  /**
   * Updates schedule details
   */
  async updateSchedule(
    sessionId: string,
    updates: Partial<CreateScheduleDto>,
  ): Promise<InterviewSchedule> {
    const schedule = await this.getSchedule(sessionId);
    
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    Object.assign(schedule, updates);
    return this.scheduleRepository.save(schedule);
  }

  /**
   * Gets preparation tips based on interview format
   */
  getPreparationTips(format: InterviewFormat): PreparationTips {
    const tips: Record<InterviewFormat, PreparationTips> = {
      [InterviewFormat.VIRTUAL]: {
        general: [
          'Test your internet connection and speed',
          'Ensure your camera and microphone work properly',
          'Close all unnecessary tabs and applications',
          'Have a backup device or phone number ready',
          'Install and test the video conferencing software',
        ],
        technical: [
          'Prepare your coding environment if applicable',
          'Have a clean desktop with only necessary tools',
          'Test screen sharing if you\'ll be presenting',
          'Prepare documents to share digitally',
        ],
        behavioral: [
          'Practice looking at the camera when speaking',
          'Prepare notes nearby but out of frame',
          'Test how your background looks on camera',
        ],
        dressCode: [
          'Dress professionally from head to toe',
          'Choose solid colors that show well on camera',
          'Avoid excessive jewelry or shiny fabrics',
        ],
        logistics: [
          'Find a quiet, private space',
          'Inform household members of your interview',
          'Block calendar and notifications',
          'Have water glass nearby',
        ],
        mental: [
          'Do a 5-minute breathing exercise beforehand',
          'Review your key talking points',
          'Have questions for the interviewer ready',
        ],
      },
      [InterviewFormat.ONSITE]: {
        general: [
          'Plan your route and check traffic',
          'Aim to arrive 10-15 minutes early',
          'Bring a copy of your resume',
          'Prepare identification if required',
        ],
        technical: [
          'Review the job requirements again',
          'Prepare portfolio or work samples',
          'Research interviewers on LinkedIn if possible',
        ],
        behavioral: [
          'Review common interview questions',
          'Prepare your STAR stories',
          'Research company news and values',
        ],
        dressCode: [
          'Research company dress code beforehand',
          'When in doubt, dress slightly more formal',
          'Ensure clothes are clean and pressed',
          'Comfortable shoes for potential walking',
        ],
        logistics: [
          'Pack essentials: phone, charger, ID, documents',
          'Have cash for parking or transit',
          'Know where to check in at reception',
        ],
        mental: [
          'Get a good night\'s sleep',
          'Eat a healthy meal beforehand',
          'Practice power poses in the bathroom',
        ],
      },
      [InterviewFormat.PHONE]: {
        general: [
          'Ensure phone is fully charged',
          'Have a backup phone number ready',
          'Use a landline if possible for better quality',
          'Find a quiet location',
        ],
        technical: [
          'Have your resume and notes nearby',
          'Prepare any data or metrics to share',
          'Ready to take notes during the call',
        ],
        behavioral: [
          'Smile while speaking - it changes your tone',
          'Stand or sit up straight',
          'Have water within reach',
        ],
        dressCode: [
          'Dress professionally even at home',
          'It boosts your confidence',
        ],
        logistics: [
          'Block calendar and notifications',
          'Silence all devices except interview phone',
          'Have pen and paper ready',
        ],
        mental: [
          'Prepare an opening and closing statement',
          'Practice your elevator pitch',
        ],
      },
      [InterviewFormat.ASYNC_VIDEO]: {
        general: [
          'Record in a quiet, well-lit space',
          'Test recording equipment beforehand',
          'Keep videos under 2-3 minutes each',
        ],
        technical: [
          'Prepare talking points',
          'Practice your delivery multiple times',
          'Have good lighting facing you',
        ],
        behavioral: [
          'Show enthusiasm through voice and expression',
          'Make eye contact with the camera',
          'Keep energy levels high throughout',
        ],
        dressCode: [
          'Professional attire from waist up',
          'Solid colors work best on video',
        ],
        logistics: [
          'Check video and audio quality',
          'Have a clean background',
          'Close unnecessary applications',
        ],
        mental: [
          'Rehearse but don\'t over-rehearse',
          'Be yourself and stay natural',
        ],
      },
    };

    return tips[format] || tips[InterviewFormat.VIRTUAL];
  }

  /**
   * Gets the default preparation checklist
   */
  getDefaultChecklist(): string[] {
    return [
      'Research the company thoroughly',
      'Review the job description and requirements',
      'Prepare answers to common interview questions',
      'Practice the STAR method for behavioral questions',
      'Prepare specific examples from your experience',
      'Review your resume and know it inside out',
      'Prepare questions to ask the interviewer',
      'Research the interviewers on LinkedIn',
      'Plan your outfit the night before',
      'Test technology (if virtual)',
      'Plan your route and timing (if onsite)',
      'Get a good night\'s sleep',
      'Eat a healthy meal before the interview',
      'Arrive early or log in 5 minutes early',
    ];
  }

  /**
   * Generates reminders for an interview
   */
  private generateReminders(interviewDate: Date): { type: string; time: string }[] {
    const reminders = [
      { type: 'day-before', time: '24 hours before' },
      { type: 'morning-of', time: 'Morning of interview' },
      { type: 'hour-before', time: '1 hour before' },
      { type: 'minutes-before', time: '15 minutes before' },
    ];

    return reminders;
  }

  /**
   * Updates dress code recommendation
   */
  async updateDressCode(sessionId: string, dressCode: string): Promise<InterviewSchedule> {
    const schedule = await this.getSchedule(sessionId);
    
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    schedule.dressCode = dressCode;
    return this.scheduleRepository.save(schedule);
  }

  /**
   * Gets dress code guidance based on company type
   */
  getDressCodeGuidance(companyType: string): Record<string, string> {
    const guidance: Record<string, string> = {
      'tech-startup': 'Business casual - smart jeans and a nice shirt or blouse',
      'finance': 'Formal business attire - suit and tie or professional dress',
      'consulting': 'Formal business attire - dark suit, conservative colors',
      'creative': 'Smart casual - express personality within professional bounds',
      'general': 'Business casual - clean, pressed, professional',
      'startup': 'Casual - neat jeans and a polo or button-down',
    };

    return {
      recommendation: guidance[companyType.toLowerCase()] || guidance['general'],
      tips: [
        'When in doubt, err on the side of being more formal',
        'Ensure clothes are clean, pressed, and fit well',
        'Avoid strong fragrances',
        'Keep jewelry minimal and professional',
        'Ensure comfortable shoes (you may be walking or standing)',
      ],
    };
  }

  /**
   * Deletes a schedule
   */
  async deleteSchedule(sessionId: string): Promise<void> {
    const schedule = await this.getSchedule(sessionId);
    if (schedule) {
      await this.scheduleRepository.remove(schedule);
    }
  }
}
