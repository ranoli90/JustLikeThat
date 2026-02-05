import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../entities/interview-session.entity';

export interface InterviewInput {
  userId: string;
  jobId?: string;
  jobDetails: { title: string; company: string; requiredSkills: string[] };
}

@Injectable()
export class InterviewCoachService {
  private readonly logger = new Logger(InterviewCoachService.name);

  constructor(
    @InjectRepository(InterviewSession)
    private readonly interviewRepository: Repository<InterviewSession>,
  ) {}

  async startInterview(input: InterviewInput): Promise<any> {
    this.logger.log(`Starting interview for user ${input.userId}`);

    const questionBank = {
      behavioral: [
        { id: 'b1', question: 'Tell me about a time you led a team.', category: 'Leadership' },
        { id: 'b2', question: 'Describe a difficult decision you made.', category: 'Decision Making' },
      ],
      technical: input.jobDetails.requiredSkills.map((skill, i) => ({
        id: `t${i}`,
        question: `How would you handle ${skill} in a production issue?`,
        category: skill,
      })),
    };

    const session = this.interviewRepository.create({
      userId: input.userId,
      jobId: input.jobId,
      questionBank,
      answers: {},
      overallScore: 0,
    });

    const saved = await this.interviewRepository.save(session);
    return {
      id: saved.id,
      questionBank: saved.questionBank,
      currentQuestion: questionBank.behavioral[0],
      progress: { totalQuestions: 3, answered: 0 },
    };
  }

  async submitAnswer(sessionId: string, questionId: string, answer: string): Promise<any> {
    const session = await this.interviewRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    const answers = session.answers as Record<string, any> || {};
    answers[questionId] = {
      answer,
      evaluation: { score: 80, feedback: 'Good answer!' },
      timestamp: new Date().toISOString(),
    };

    session.answers = answers;
    session.overallScore = 80;
    await this.interviewRepository.save(session);

    return { feedback: answers[questionId].evaluation, nextQuestion: null };
  }

  async getFeedback(sessionId: string): Promise<any> {
    const session = await this.interviewRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');
    return { overallScore: session.overallScore, answers: session.answers };
  }

  async getProgress(sessionId: string): Promise<any> {
    const session = await this.interviewRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');
    return { overallScore: session.overallScore, answeredCount: Object.keys(session.answers || {}).length };
  }
}
