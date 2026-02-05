import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OutreachCampaign,
  CampaignType,
  CampaignStatus,
  TargetType,
} from '../../entities/outreach-campaign.entity';
import {
  OutreachContact,
  ContactStatus,
  ContactType,
  Channel,
} from '../../entities/outreach-contact.entity';
import { OutreachSequence, SequenceType, SequenceStatus } from '../../entities/outreach-sequence.entity';
import { OutreachTemplate, TemplateCategory } from '../../entities/outreach-template.entity';
import { OutreachMessage, MessageStatus, MessageType } from '../../entities/outreach-message.entity';
import { RecruiterRelationship, RecruiterRelationshipStatus } from '../../entities/recruiter-relationship.entity';
import { CompanyInsider, InsiderRelationship, InsiderStatus } from '../../entities/company-insider.entity';
import { WarmIntroRequest, IntroStatus, IntroRequestType } from '../../entities/warm-intro.entity';
import { NetworkingOpportunity, OpportunityType, OpportunityStatus } from '../../entities/networking-opportunity.entity';

/**
 * Service for managing outreach campaigns, contacts, sequences, and networking opportunities
 */
@Injectable()
export class OutreachService {
  /**
   * Creates a new OutreachService instance
   * @param campaignRepo - Repository for outreach campaigns
   * @param contactRepo - Repository for outreach contacts
   * @param sequenceRepo - Repository for outreach sequences
   * @param templateRepo - Repository for outreach templates
   * @param messageRepo - Repository for outreach messages
   * @param recruiterRepo - Repository for recruiter relationships
   * @param insiderRepo - Repository for company insiders
   * @param introRepo - Repository for warm intro requests
   * @param opportunityRepo - Repository for networking opportunities
   */
  constructor(
    @InjectRepository(OutreachCampaign)
    private campaignRepo: Repository<OutreachCampaign>,
    @InjectRepository(OutreachContact)
    private contactRepo: Repository<OutreachContact>,
    @InjectRepository(OutreachSequence)
    private sequenceRepo: Repository<OutreachSequence>,
    @InjectRepository(OutreachTemplate)
    private templateRepo: Repository<OutreachTemplate>,
    @InjectRepository(OutreachMessage)
    private messageRepo: Repository<OutreachMessage>,
    @InjectRepository(RecruiterRelationship)
    private recruiterRepo: Repository<RecruiterRelationship>,
    @InjectRepository(CompanyInsider)
    private insiderRepo: Repository<CompanyInsider>,
    @InjectRepository(WarmIntroRequest)
    private introRepo: Repository<WarmIntroRequest>,
    @InjectRepository(NetworkingOpportunity)
    private opportunityRepo: Repository<NetworkingOpportunity>,
  ) {}

  // Campaign Management

  /**
   * Creates a new outreach campaign
   * @param data - Campaign data
   * @param userId - The user ID who owns this campaign
   * @returns The created campaign
   */
  async createCampaign(data: Partial<OutreachCampaign>, userId: string): Promise<OutreachCampaign> {
    const campaign = this.campaignRepo.create({
      ...data,
      userId,
      status: CampaignStatus.DRAFT,
    });
    return this.campaignRepo.save(campaign);
  }

  /**
   * Retrieves all campaigns for a user
   * @param userId - The user ID
   * @returns Array of campaigns
   */
  async getCampaigns(userId: string): Promise<OutreachCampaign[]> {
    return this.campaignRepo.find({
      where: { userId },
      relations: ['contacts', 'sequences'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves a specific campaign by ID
   * @param id - The campaign ID
   * @param userId - The user ID for authorization
   * @returns The campaign
   * @throws NotFoundException if campaign not found
   */
  async getCampaign(id: string, userId: string): Promise<OutreachCampaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id, userId },
      relations: ['contacts', 'sequences'],
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  /**
   * Updates an existing campaign
   * @param id - The campaign ID
   * @param data - The update data
   * @param userId - The user ID for authorization
   * @returns The updated campaign
   */
  async updateCampaign(id: string, data: Partial<OutreachCampaign>, userId: string): Promise<OutreachCampaign> {
    await this.getCampaign(id, userId);
    await this.campaignRepo.update({ id, userId }, data);
    return this.getCampaign(id, userId);
  }

  /**
   * Launches a campaign, setting it to active status
   * @param id - The campaign ID
   * @param userId - The user ID for authorization
   * @returns The launched campaign
   */
  async launchCampaign(id: string, userId: string): Promise<OutreachCampaign> {
    const campaign = await this.getCampaign(id, userId);
    campaign.status = CampaignStatus.ACTIVE;
    campaign.scheduledAt = new Date();
    return this.campaignRepo.save(campaign);
  }

  // Contact Management

  /**
   * Adds a new contact to the outreach system
   * @param data - Contact data
   * @param userId - The user ID who owns this contact
   * @returns The created contact
   */
  async addContact(data: Partial<OutreachContact>, userId: string): Promise<OutreachContact> {
    const contact = this.contactRepo.create({
      ...data,
      userId,
      status: ContactStatus.PENDING,
    });
    return this.contactRepo.save(contact);
  }

  /**
   * Retrieves contacts for a user, optionally filtered by campaign
   * @param userId - The user ID
   * @param campaignId - Optional campaign ID to filter by
   * @returns Array of contacts
   */
  async getContacts(userId: string, campaignId?: string): Promise<OutreachContact[]> {
    const where = campaignId ? { userId, campaignId } : { userId };
    return this.contactRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateContactStatus(id: string, status: ContactStatus, userId: string): Promise<OutreachContact> {
    const contact = await this.contactRepo.findOne({ where: { id, userId } });
    if (!contact) throw new NotFoundException('Contact not found');
    contact.status = status;
    if (status === ContactStatus.RESPONDED) contact.respondedAt = new Date();
    if (status === ContactStatus.CONNECTED) contact.connectedAt = new Date();
    return this.contactRepo.save(contact);
  }

  // Template Management
  async createTemplate(data: Partial<OutreachTemplate>, userId: string): Promise<OutreachTemplate> {
    const template = this.templateRepo.create({ ...data, userId });
    return this.templateRepo.save(template);
  }

  async getTemplates(userId: string, category?: TemplateCategory): Promise<OutreachTemplate[]> {
    const where = category ? { userId, category } : { userId };
    return this.templateRepo.find({ where, order: { usageCount: 'DESC' } });
  }

  async getDefaultTemplates(): Promise<OutreachTemplate[]> {
    return this.templateRepo.find({ where: { isDefault: true, isActive: true } });
  }

  async useTemplate(id: string): Promise<OutreachTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (template) {
      template.usageCount += 1;
      return this.templateRepo.save(template);
    }
    throw new NotFoundException('Template not found');
  }

  // Sequence Management
  async createSequence(data: Partial<OutreachSequence>, userId: string): Promise<OutreachSequence> {
    const sequence = this.sequenceRepo.create({ ...data, userId });
    return this.sequenceRepo.save(sequence);
  }

  async getSequences(userId: string, campaignId?: string): Promise<OutreachSequence[]> {
    const where = campaignId ? { userId, campaignId } : { userId };
    return this.sequenceRepo.find({ where, order: { order: 'ASC' } });
  }

  // Message Management
  async sendMessage(data: Partial<OutreachMessage>, userId: string): Promise<OutreachMessage> {
    const message = this.messageRepo.create({
      ...data,
      userId,
      status: MessageStatus.SENT,
      sentAt: new Date(),
    });
    return this.messageRepo.save(message);
  }

  async updateMessageStatus(id: string, status: MessageStatus, userId: string): Promise<OutreachMessage> {
    const message = await this.messageRepo.findOne({ where: { id, userId } });
    if (!message) throw new NotFoundException('Message not found');
    message.status = status;
    if (status === MessageStatus.OPENED) message.openedAt = new Date();
    if (status === MessageStatus.CLICKED) message.clickedAt = new Date();
    if (status === MessageStatus.REPLIED) message.repliedAt = new Date();
    return this.messageRepo.save(message);
  }

  async getMessages(userId: string, contactId?: string): Promise<OutreachMessage[]> {
    const where = contactId ? { userId, contactId } : { userId };
    return this.messageRepo.find({ where, order: { sentAt: 'DESC' } });
  }

  // Recruiter Relationship Management
  async addRecruiter(data: Partial<RecruiterRelationship>, userId: string): Promise<RecruiterRelationship> {
    const recruiter = this.recruiterRepo.create({ ...data, userId });
    return this.recruiterRepo.save(recruiter);
  }

  async getRecruiters(userId: string): Promise<RecruiterRelationship[]> {
    return this.recruiterRepo.find({ where: { userId }, order: { lastContactedAt: 'DESC' } });
  }

  async updateRecruiterRelationship(id: string, data: Partial<RecruiterRelationship>, userId: string): Promise<RecruiterRelationship> {
    await this.recruiterRepo.update({ id, userId }, data);
    return this.recruiterRepo.findOne({ where: { id, userId } });
  }

  // Company Insider Management
  async addInsider(data: Partial<CompanyInsider>, userId: string): Promise<CompanyInsider> {
    const insider = this.insiderRepo.create({ ...data, userId });
    return this.insiderRepo.save(insider);
  }

  async getInsiders(userId: string): Promise<CompanyInsider[]> {
    return this.insiderRepo.find({ where: { userId, isActive: true } });
  }

  // Warm Introduction Management
  async requestIntro(data: Partial<WarmIntroRequest>, userId: string): Promise<WarmIntroRequest> {
    const intro = this.introRepo.create({ ...data, userId, status: IntroStatus.PENDING });
    return this.introRepo.save(intro);
  }

  async getIntroRequests(userId: string): Promise<WarmIntroRequest[]> {
    return this.introRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async updateIntroStatus(id: string, status: IntroStatus, userId: string): Promise<WarmIntroRequest> {
    const intro = await this.introRepo.findOne({ where: { id, userId } });
    if (!intro) throw new NotFoundException('Intro request not found');
    intro.status = status;
    if (status === IntroStatus.SENT) intro.sentAt = new Date();
    if (status === IntroStatus.RESPONDED || status === IntroStatus.ACCEPTED || status === IntroStatus.DECLINED) {
      intro.respondedAt = new Date();
    }
    return this.introRepo.save(intro);
  }

  // Networking Opportunity Management
  async createOpportunity(data: Partial<NetworkingOpportunity>, userId: string): Promise<NetworkingOpportunity> {
    const opportunity = this.opportunityRepo.create({ ...data, userId });
    return this.opportunityRepo.save(opportunity);
  }

  async getOpportunities(userId: string, status?: OpportunityStatus): Promise<NetworkingOpportunity[]> {
    const where = status ? { userId, status } : { userId, isActive: true };
    return this.opportunityRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async detectOpportunities(userId: string): Promise<NetworkingOpportunity[]> {
    // Implementation for detecting networking opportunities
    return [];
  }

  // Personalization
  async personalizeTemplate(
    template: OutreachTemplate,
    contact: OutreachContact,
    userProfile: any,
  ): { subjectLine: string; body: string } {
    let subjectLine = template.subjectLine || '';
    let body = template.body;

    const variables: Record<string, string> = {
      '{{firstName}}': contact.firstName,
      '{{lastName}}': contact.lastName,
      '{{fullName}}': `${contact.firstName} ${contact.lastName}`,
      '{{company}}': contact.company || '',
      '{{jobTitle}}': contact.jobTitle || '',
      '{{email}}': contact.email,
      '{{userName}}': userProfile.name || '',
      '{{userTitle}}': userProfile.title || '',
      '{{userCompany}}': userProfile.company || '',
    };

    if (contact.personalization) {
      variables['{{icebreaker}}'] = contact.personalization.icebreaker || '';
      variables['{{commonConnections}}'] = (contact.personalization.commonConnections || []).join(', ');
    }

    Object.entries(variables).forEach(([key, value]) => {
      subjectLine = subjectLine.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    });

    return { subjectLine, body };
  }

  // Bulk Operations
  async addBulkContacts(contacts: Partial<OutreachContact>[], userId: string, campaignId?: string): Promise<OutreachContact[]> {
    const entities = contacts.map((contact) =>
      this.contactRepo.create({ ...contact, userId, campaignId }),
    );
    return this.contactRepo.save(entities);
  }

  async launchBulkOutreach(campaignId: string, userId: string): Promise<{ sent: number; failed: number }> {
    const campaign = await this.getCampaign(campaignId, userId);
    const contacts = await this.getContacts(userId, campaignId);
    
    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const template = campaign.templateId
          ? await this.templateRepo.findOne({ where: { id: campaign.templateId } })
          : null;
        
        if (template) {
          await this.sendMessage(
            {
              contactId: contact.id,
              campaignId,
              type: MessageType.EMAIL,
              body: template.body,
              subjectLine: template.subjectLine,
            },
            userId,
          );
        }

        contact.status = ContactStatus.CONTACTED;
        contact.lastContactedAt = new Date();
        contact.outreachAttempts += 1;
        await this.contactRepo.save(contact);
        sent++;
      } catch (error) {
        contact.status = ContactStatus.BOUNCED;
        await this.contactRepo.save(contact);
        failed++;
      }
    }

    campaign.sentCount = sent;
    campaign.targetCount = contacts.length;
    await this.campaignRepo.save(campaign);

    return { sent, failed };
  }
}
