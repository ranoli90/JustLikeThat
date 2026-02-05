import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeGenerationService } from './services/resume-generation.service';
import { CoverLetterGenerationService } from './services/cover-letter-generation.service';
import { JobDescriptionGenerationService } from './services/job-description-generation.service';
import { CareerPathService } from './services/career-path.service';
import { SalaryNegotiationService } from './services/salary-negotiation.service';
import { InterviewCoachService } from './services/interview-coach.service';
import { EnterpriseAiController } from './enterprise-ai.controller';
import { EnterpriseAiService } from './enterprise-ai.service';
import { GeneratedResume } from './entities/generated-resume.entity';
import { CoverLetter } from './entities/cover-letter.entity';
import { JobDescription } from './entities/job-description.entity';
import { CareerPath } from './entities/career-path.entity';
import { NegotiationSession } from './entities/negotiation-session.entity';
import { InterviewSession } from './entities/interview-session.entity';
import { ResumeTemplate } from './entities/resume-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneratedResume,
      CoverLetter,
      JobDescription,
      CareerPath,
      NegotiationSession,
      InterviewSession,
      ResumeTemplate,
    ]),
  ],
  controllers: [EnterpriseAiController],
  providers: [
    EnterpriseAiService,
    ResumeGenerationService,
    CoverLetterGenerationService,
    JobDescriptionGenerationService,
    CareerPathService,
    SalaryNegotiationService,
    InterviewCoachService,
  ],
  exports: [
    EnterpriseAiService,
    ResumeGenerationService,
    CoverLetterGenerationService,
    JobDescriptionGenerationService,
    CareerPathService,
    SalaryNegotiationService,
    InterviewCoachService,
  ],
})
export class EnterpriseAiModule {}
