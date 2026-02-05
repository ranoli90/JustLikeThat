// ============ TEAM CHAT SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SlackService } from './team-chat/slack.service';
import { TeamsService } from './team-chat/teams.service';

@Injectable()
export class TeamChatService {
  private readonly logger = new Logger(TeamChatService.name);

  constructor(
    private readonly slackService: SlackService,
    private readonly teamsService: TeamsService,
  ) {}

  /**
   * Send notification to channel
   */
  async sendNotification(
    provider: string,
    channel: string,
    message: string,
    blocks?: any[],
  ) {
    this.logger.log(`Sending ${provider} notification to ${channel}`);

    switch (provider.toUpperCase()) {
      case 'SLACK':
        return this.slackService.postMessage(channel, message, blocks);
      case 'TEAMS':
        return this.teamsService.sendMessage(channel, message);
      default:
        throw new NotFoundException(`Unknown team chat provider: ${provider}`);
    }
  }

  /**
   * Send direct message
   */
  async sendDirectMessage(provider: string, userId: string, message: string) {
    switch (provider.toUpperCase()) {
      case 'SLACK':
        return this.slackService.sendDirectMessage(userId, message);
      case 'TEAMS':
        return this.teamsService.sendDirectMessage(userId, message);
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }

  /**
   * Create channel
   */
  async createChannel(provider: string, name: string, isPrivate = false) {
    switch (provider.toUpperCase()) {
      case 'SLACK':
        return this.slackService.createChannel(name, isPrivate);
      case 'TEAMS':
        return this.teamsService.createTeam(name);
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(provider: string, event: any) {
    switch (provider.toUpperCase()) {
      case 'SLACK':
        return this.slackService.handleEvent(event);
      case 'TEAMS':
        return this.teamsService.handleEvent(event);
      default:
        return { processed: false };
    }
  }
}
