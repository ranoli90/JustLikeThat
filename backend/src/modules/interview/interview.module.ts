import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { CompanyResearchService } from './company-research.service';
import { QuestionPreparationService } from './question-preparation.service';
import { InterviewFeedbackService } from './interview-feedback.service';
import { InterviewSchedulingService } from './interview-scheduling.service';
import { SalaryNegotiationService } from './salary-negotiation.service';
import { PostInterviewService } from './post-interview.service';
import { InterviewSession } from '../../entities/interview-session.entity';
import { InterviewQuestion } from '../../entities/interview-question.entity';
import { CompanyInsight } from '../../entities/company-insight.entity';
import { InterviewPractice } from '../../entities/interview-practice.entity';
import { InterviewSchedule } from '../../entities/interview-schedule.entity';
import { SalaryNegotiation } from '../../entities/salary-negotiation.entity';
import { PostInterviewAction } from '../../entities/post-interview-action.entity';
import { Application } from '../../entities/application.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InterviewSession,
      InterviewQuestion,
      CompanyInsight,
      InterviewPractice,
      InterviewSchedule,
      SalaryNegotiation,
      PostInterviewAction,
      Application,
      JobPosting,
      User,
      Tenant,
    ]),
  ],
  providers: [
    InterviewService,
    CompanyResearchService,
    QuestionPreparationService,
    InterviewFeedbackService,
    InterviewSchedulingService,
    SalaryNegotiationService,
    PostInterviewService,
  ],
  controllers: [InterviewController],
  exports: [InterviewService],
})
export class InterviewModule {}
