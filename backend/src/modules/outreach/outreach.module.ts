import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutreachCampaign } from '../../entities/outreach-campaign.entity';
import { OutreachContact } from '../../entities/outreach-contact.entity';
import { OutreachSequence } from '../../entities/outreach-sequence.entity';
import { OutreachTemplate } from '../../entities/outreach-template.entity';
import { OutreachMessage } from '../../entities/outreach-message.entity';
import { RecruiterRelationship } from '../../entities/recruiter-relationship.entity';
import { CompanyInsider } from '../../entities/company-insider.entity';
import { WarmIntroRequest } from '../../entities/warm-intro.entity';
import { NetworkingOpportunity } from '../../entities/networking-opportunity.entity';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { OutreachAnalyticsService } from './outreach-analytics.service';
import { LinkedInService } from './linkedin.service';
import { SequenceAutomationService } from './sequence-automation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutreachCampaign,
      OutreachContact,
      OutreachSequence,
      OutreachTemplate,
      OutreachMessage,
      RecruiterRelationship,
      CompanyInsider,
      WarmIntroRequest,
      NetworkingOpportunity,
    ]),
  ],
  controllers: [OutreachController],
  providers: [
    OutreachService,
    OutreachAnalyticsService,
    LinkedInService,
    SequenceAutomationService,
  ],
  exports: [OutreachService, OutreachAnalyticsService],
})
export class OutreachModule {}
