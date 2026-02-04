import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey, SurveyProvider, SurveyStatus } from '../../entities/survey.entity';
import { User } from '../../entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    private readonly configService: ConfigService,
  ) {}

  async createSurvey(
    externalId: string,
    provider: SurveyProvider,
    name: string,
    description?: string,
    surveyUrl?: string,
  ): Promise<Survey> {
    const survey = this.surveyRepository.create({
      externalId,
      provider,
      name,
      description,
      surveyUrl,
      status: SurveyStatus.PENDING,
    });

    return this.surveyRepository.save(survey);
  }

  async sendSurvey(user: User, surveyId: string): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({ where: { id: surveyId } });
    if (!survey) {
      throw new Error('Survey not found');
    }

    survey.user = user;
    survey.sentAt = new Date();
    survey.status = SurveyStatus.PENDING;

    return this.surveyRepository.save(survey);
  }

  async recordResponse(externalId: string, response: any): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({ where: { externalId } });
    if (!survey) {
      throw new Error('Survey not found');
    }

    survey.response = response;
    survey.status = SurveyStatus.COMPLETED;
    survey.completedAt = new Date();

    return this.surveyRepository.save(survey);
  }

  async getSurvey(surveyId: string): Promise<Survey | null> {
    return this.surveyRepository.findOne({ where: { id: surveyId } });
  }

  async getUserSurveys(userId: string): Promise<Survey[]> {
    return this.surveyRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingSurveys(userId: string): Promise<Survey[]> {
    return this.surveyRepository.find({
      where: { user: { id: userId }, status: SurveyStatus.PENDING },
    });
  }

  async getSurveyAnalytics(): Promise<any> {
    const surveys = await this.surveyRepository.find();

    const completed = surveys.filter((s) => s.status === SurveyStatus.COMPLETED);
    const pending = surveys.filter((s) => s.status === SurveyStatus.PENDING);
    const expired = surveys.filter((s) => s.status === SurveyStatus.EXPIRED);

    const byProvider = surveys.reduce((acc, survey) => {
      acc[survey.provider] = (acc[survey.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSurveys: surveys.length,
      completed: completed.length,
      pending: pending.length,
      expired: expired.length,
      completionRate: surveys.length > 0 ? (completed.length / surveys.length) * 100 : 0,
      byProvider,
    };
  }

  async generateSurveyUrl(survey: Survey, user: User): Promise<string> {
    if (survey.provider === SurveyProvider.TYPEFORM) {
      return this.generateTypeformUrl(survey, user);
    } else if (survey.provider === SurveyProvider.SURVEYMONKEY) {
      return this.generateSurveyMonkeyUrl(survey, user);
    }
    return survey.surveyUrl || '';
  }

  private generateTypeformUrl(survey: Survey, user: User): string {
    const baseUrl = this.configService.get('TYPEFORM_BASE_URL') || 'https://form.typeform.com';
    const apiKey = this.configService.get('TYPEFORM_API_KEY');
    
    // In production, you would create a hidden field submission
    return `${baseUrl}/${survey.externalId}?user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
  }

  private generateSurveyMonkeyUrl(survey: Survey, user: User): string {
    const baseUrl = this.configService.get('SURVEYMONKEY_BASE_URL') || 'https://www.surveymonkey.com/r';
    return `${baseUrl}/${survey.externalId}?user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
  }
}
