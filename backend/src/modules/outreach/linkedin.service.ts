import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutreachContact, Channel } from '../../entities/outreach-contact.entity';
import { OutreachMessage, MessageType, MessageStatus } from '../../entities/outreach-message.entity';

@Injectable()
export class LinkedInService {
  constructor(
    @InjectRepository(OutreachContact)
    private contactRepo: Repository<OutreachContact>,
    @InjectRepository(OutreachMessage)
    private messageRepo: Repository<OutreachMessage>,
  ) {}

  async sendConnectionRequest(
    contact: OutreachContact,
    message?: string,
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      const connectionId = `li_${Date.now()}`;
      
      await this.messageRepo.save({
        contactId: contact.id,
        type: MessageType.LINKEDIN_CONNECTION,
        status: MessageStatus.SENT,
        body: message || `Hi ${contact.firstName}, I'd like to connect with you.`,
        sentAt: new Date(),
      });

      return { success: true, connectionId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendLinkedInMessage(
    contact: OutreachContact,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageId = `li_msg_${Date.now()}`;

      await this.messageRepo.save({
        contactId: contact.id,
        type: MessageType.LINKEDIN_MESSAGE,
        status: MessageStatus.SENT,
        body: message,
        sentAt: new Date(),
      });

      return { success: true, messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async personalizeConnectionRequest(
    contact: OutreachContact,
    userProfile: any,
  ): Promise<string> {
    let message = `Hi ${contact.firstName},`;

    if (contact.personalization?.commonConnections?.length) {
      message += ` I noticed we have some mutual connections.`;
    }

    if (contact.personalization?.recentPosts?.length) {
      message += ` I saw your recent post about ${contact.personalization.recentPosts[0]}.`;
    }

    message += ` I'd love to connect and learn more about your experience at ${contact.company}.`;
    
    return message;
  }

  async automateConnectionSequence(
    contacts: OutreachContact[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const message = await this.personalizeConnectionRequest(contact, {});
        const result = await this.sendConnectionRequest(contact, message);

        if (result.success) {
          sent++;
          contact.status = 'contacted' as any;
          contact.primaryChannel = Channel.LINKEDIN;
          contact.outreachAttempts += 1;
          await this.contactRepo.save(contact);
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { sent, failed };
  }
}
