import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession, InterviewType, InterviewFormat, InterviewStatus } from '../../entities/interview-session.entity';
import { InterviewQuestion, QuestionType, Difficulty } from '../../entities/interview-question.entity';
import { CompanyResearchService } from './company-research.service';
import { QuestionPreparationService } from './question-preparation.service';
import { InterviewFeedbackService, AnswerFeedback } from './interview-feedback.service';
import { InterviewSchedulingService } from './interview-scheduling.service';

export interface CreateInterviewSessionDto {
  userId: string;
  applicationId?: string;
  interviewType: InterviewType;
  interviewFormat: InterviewFormat;
  companyName?: string;
  jobTitle?: string;
}

export interface InterviewQuestionDto {
  questionType: QuestionType;
  difficulty?: Difficulty;
  count?: number;
}

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(InterviewSession)
    private readonly sessionRepository: Repository<InterviewSession>,
    @InjectRepository(InterviewQuestion)
    private readonly questionRepository: Repository<InterviewQuestion>,
    private readonly companyResearchService: CompanyResearchService,
    private readonly questionPreparationService: QuestionPreparationService,
    private readonly interviewFeedbackService: InterviewFeedbackService,
    private readonly schedulingService: InterviewSchedulingService,
  ) {}

  /**
   * Creates a new interview practice session
   */
  async createSession(dto: CreateInterviewSessionDto): Promise<InterviewSession> {
    const session = this.sessionRepository.create({
      userId: dto.userId,
      applicationId: dto.applicationId,
      interviewType: dto.interviewType,
      interviewFormat: dto.interviewFormat,
      status: InterviewStatus.DRAFT,
      duration: this.getDefaultDuration(dto.interviewType),
    });

    const savedSession = await this.sessionRepository.save(session);

    // Generate company insights if company name provided
    if (dto.companyName) {
      await this.companyResearchService.researchCompany(dto.companyName, savedSession.id);
    }

    // Generate initial questions based on interview type
    const questions = await this.questionPreparationService.generateQuestions(
      dto.interviewType,
      dto.jobTitle,
      5,
    );

    for (const question of questions) {
      const questionEntity = this.questionRepository.create({
        sessionId: savedSession.id,
        questionType: question.type,
        question: question.text,
        suggestedAnswer: question.suggestedAnswer,
        difficulty: question.difficulty,
        tags: question.tags,
      });
      await this.questionRepository.save(questionEntity);
    }

    return this.getSession(savedSession.id);
  }

  /**
   * Gets an interview session by ID
   */
  async getSession(sessionId: string): Promise<InterviewSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['questions', 'company', 'schedules', 'practices'],
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    return session;
  }

  /**
   * Gets all sessions for a user
   */
  async getUserSessions(userId: string): Promise<InterviewSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['questions', 'schedules'],
    });
  }

  /**
   * Starts a mock interview practice session
   */
  async startPractice(
    sessionId: string,
    questionDto: InterviewQuestionDto,
  ): Promise<{ session: InterviewSession; nextQuestion: InterviewQuestion }> {
    const session = await this.getSession(sessionId);
    
    // Update session status
    session.status = InterviewStatus.IN_PROGRESS;
    await this.sessionRepository.save(session);

    // Get or generate next question
    const unansweredQuestions = session.questions.filter(q => !q.isAnswered);
    let nextQuestion: InterviewQuestion | null = null;

    if (unansweredQuestions.length > 0) {
      nextQuestion = unansweredQuestions[0];
    } else {
      // Generate new questions if all answered
      const newQuestions = await this.questionPreparationService.generateQuestions(
        session.interviewType,
        undefined,
        questionDto.count || 3,
      );

      for (const q of newQuestions) {
        const questionEntity = this.questionRepository.create({
          sessionId,
          questionType: q.type,
          question: q.text,
          suggestedAnswer: q.suggestedAnswer,
          difficulty: q.difficulty || Difficulty.MEDIUM,
          tags: q.tags,
        });
        const saved = await this.questionRepository.save(questionEntity);
        if (!nextQuestion) nextQuestion = saved;
      }
    }

    if (!nextQuestion) {
      throw new Error('Failed to generate or retrieve a question');
    }

    return { session, nextQuestion };
  }

  /**
   * Submits an answer and gets AI feedback
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string,
  ): Promise<{ feedback: AnswerFeedback; improvedAnswer?: string }> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId, sessionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Save user's answer
    question.userAnswer = answer;
    question.isAnswered = true;
    await this.questionRepository.save(question);

    // Get AI feedback
    const feedback = await this.interviewFeedbackService.analyzeAnswer(
      question.question,
      answer,
      question.questionType,
      question.suggestedAnswer || undefined,
    );

    return { feedback, improvedAnswer: feedback.suggestedImprovements.join(' ') };
  }

  /**
   * Completes an interview session and generates overall feedback
   */
  async completeSession(sessionId: string): Promise<Record<string, unknown>> {
    const session = await this.getSession(sessionId);
    
    session.status = InterviewStatus.COMPLETED;
    await this.sessionRepository.save(session);

    // Generate overall session feedback
    const overallFeedback = await this.interviewFeedbackService.generateOverallFeedback(sessionId);

    return overallFeedback;
  }

  /**
   * Updates session scheduling
   */
  async scheduleSession(
    sessionId: string,
    interviewDate: Date,
    timezone: string,
  ): Promise<InterviewSession> {
    const session = await this.getSession(sessionId);
    
    session.scheduledAt = interviewDate;
    session.status = InterviewStatus.SCHEDULED;
    await this.sessionRepository.save(session);

    return this.schedulingService.createSchedule(sessionId, interviewDate, timezone);
  }

  /**
   * Gets preparation tips based on interview format
   */
  async getPreparationTips(sessionId: string): Promise<Record<string, unknown>> {
    const session = await this.getSession(sessionId);
    
    return this.schedulingService.getPreparationTips(session.interviewFormat);
  }

  /**
   * Deletes a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    await this.sessionRepository.remove(session);
  }

  private getDefaultDuration(interviewType: InterviewType): number {
    const durations: Record<InterviewType, number> = {
      [InterviewType.PHONE_SCREEN]: 30,
      [InterviewType.BEHAVIORAL]: 45,
      [InterviewType.TECHNICAL]: 60,
      [InterviewType.CASE_STUDY]: 45,
      [InterviewType.PANEL]: 60,
      [InterviewType.FINAL]: 90,
      [InterviewType.ONSITE]: 120,
      [InterviewType.VIDEO]: 45,
      [InterviewType.ASSESSMENT]: 60,
    };
    return durations[interviewType] || 60;
  }
}
