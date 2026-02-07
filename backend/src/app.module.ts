import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProfileModule } from './modules/profile/profile.module';
import { JobIngestionModule } from './modules/job-ingestion/job-ingestion.module';
import { ApplicationModule } from './modules/application/application.module';
import { AutomationModule } from './modules/automation/automation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { IntakeModule } from './modules/intake/intake.module';
import { MatchingModule } from './modules/matching/matching.module';
import { TailoringModule } from './modules/tailoring/tailoring.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CareerModule } from './modules/career/career.module';
import { User } from './entities/user.entity';
import { CandidateProfile } from './entities/candidate-profile.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { Resume } from './entities/resume.entity';
import { Persona } from './entities/persona.entity';
import { JobPosting } from './entities/job-posting.entity';
import { Application } from './entities/application.entity';
import { JobSource } from './entities/job-source.entity';
import { IngestionLog } from './entities/ingestion-log.entity';
import { Feedback } from './entities/feedback.entity';
import { OrchestratorTask } from './modules/orchestrator/entities/orchestrator-task.entity';
import { Metric } from './modules/monitoring/entities/metric.entity';
import { Alert } from './modules/monitoring/entities/alert.entity';
import { CostControl } from './modules/monitoring/entities/cost-control.entity';
import { LogEntry } from './modules/monitoring/entities/log-entry.entity';
import { CareerPath } from './entities/career-path.entity';
import { SkillGap } from './entities/skill-gap.entity';
import { CareerMilestone, MilestoneTemplate } from './entities/career-milestone.entity';
import { CareerGoal } from './entities/career-goal.entity';
import { Certification, CertificationTemplate } from './entities/certification.entity';
import { LearningResource, LearningResourceTemplate } from './entities/learning-resource.entity';
import { MentorshipRelationship, MentorProfile } from './entities/mentorship.entity';
import { SalaryProjection, SalaryHistory } from './entities/salary-projection.entity';
import { IndustryTrend, SkillPrediction } from './entities/industry-trend.entity';
import { OutreachCampaign } from './entities/outreach-campaign.entity';
import { OutreachContact } from './entities/outreach-contact.entity';
import { OutreachSequence } from './entities/outreach-sequence.entity';
import { OutreachTemplate } from './entities/outreach-template.entity';
import { OutreachMessage } from './entities/outreach-message.entity';
import { RecruiterRelationship } from './entities/recruiter-relationship.entity';
import { CompanyInsider } from './entities/company-insider.entity';
import { WarmIntroRequest } from './entities/warm-intro.entity';
import { NetworkingOpportunity } from './entities/networking-opportunity.entity';
import { OutreachModule } from './modules/outreach/outreach.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { SecurityModule } from './modules/security/security.module';
import { EnterpriseAiModule } from './modules/enterprise-ai/enterprise-ai.module';
import { GeneratedResume } from './modules/enterprise-ai/entities/generated-resume.entity';
import { CoverLetter } from './modules/enterprise-ai/entities/cover-letter.entity';
import { JobDescription } from './modules/enterprise-ai/entities/job-description.entity';
import { NegotiationSession } from './modules/enterprise-ai/entities/negotiation-session.entity';
import { InterviewSession } from './modules/enterprise-ai/entities/interview-session.entity';
import { ResumeTemplate } from './modules/enterprise-ai/entities/resume-template.entity';
import { CareerCoachingModule } from './modules/career-coaching/career-coaching.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          CandidateProfile,
          UserPreferences,
          Resume,
          Persona,
          JobPosting,
          Application,
          JobSource,
          IngestionLog,
          Feedback,
          OrchestratorTask,
          Metric,
          Alert,
          CostControl,
          LogEntry,
          CareerPath,
          SkillGap,
          CareerMilestone,
          MilestoneTemplate,
          CareerGoal,
          Certification,
          CertificationTemplate,
          LearningResource,
          LearningResourceTemplate,
          MentorshipRelationship,
          MentorProfile,
          SalaryProjection,
          SalaryHistory,
          IndustryTrend,
          SkillPrediction,
          OutreachCampaign,
          OutreachContact,
          OutreachSequence,
          OutreachTemplate,
          OutreachMessage,
          RecruiterRelationship,
          CompanyInsider,
          WarmIntroRequest,
          NetworkingOpportunity,
          GeneratedResume,
          CoverLetter,
          JobDescription,
          CareerPath,
          NegotiationSession,
          InterviewSession,
          ResumeTemplate,
          CareerCoachingModule,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ProfileModule,
    JobIngestionModule,
    ApplicationModule,
    AutomationModule,
    NotificationModule,
    IntakeModule,
    MatchingModule,
    TailoringModule,
    OrchestratorModule,
    MonitoringModule,
    FeedbackModule,
    CareerModule,
    OutreachModule,
    PerformanceModule,
    SecurityModule,
    EnterpriseAiModule,
    CareerCoachingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
