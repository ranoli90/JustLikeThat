// ============ SCHEDULING SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalendlyService } from './scheduling/calendly.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendlyService: CalendlyService,
  ) {}

  /**
   * Schedule an interview
   */
  async scheduleInterview(
    provider: string,
    candidateEmail: string,
    interviewerEmail: string,
    duration: number,
    timezone: string,
    notes?: string,
  ) {
    this.logger.log(`Scheduling interview via ${provider}`);

    switch (provider.toUpperCase()) {
      case 'CALENDLY':
        return this.calendlyService.createSchedulingLink({
          candidateEmail,
          interviewerEmail,
          duration,
          timezone,
        });
      default:
        throw new NotFoundException(`Unknown scheduling provider: ${provider}`);
    }
  }

  /**
   * Get availability
   */
  async getAvailability(provider: string, interviewerEmail: string, startDate: Date, endDate: Date) {
    switch (provider.toUpperCase()) {
      case 'CALENDLY':
        return this.calendlyService.getAvailability(interviewerEmail, startDate, endDate);
      default:
        return { slots: [] };
    }
  }

  /**
   * Cancel interview
   */
  async cancelInterview(provider: string, interviewId: string) {
    switch (provider.toUpperCase()) {
      case 'CALENDLY':
        return this.calendlyService.cancelEvent(interviewId);
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }

  /**
   * Store scheduling record
   */
  async storeSchedule(data: {
    userId: string;
    configId: string;
    externalId?: string;
    interviewType: string;
    scheduledAt: Date;
    duration: number;
    timezone: string;
    location?: string;
    meetingUrl?: string;
  }) {
    return this.prisma.interviewSchedule.create({
      data: {
        userId: data.userId,
        configId: data.configId,
        externalId: data.externalId,
        interviewType: data.interviewType,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        timezone: data.timezone,
        location: data.location,
        meetingUrl: data.meetingUrl,
        status: 'scheduled',
      },
    });
  }
}
