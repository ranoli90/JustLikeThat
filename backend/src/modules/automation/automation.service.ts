import { Injectable } from '@nestjs/common';

@Injectable()
export class AutomationService {
  async getAutomationConfigs(userId: string, query: any) {
    return {
      data: [],
      pagination: {
        page: 1,
        size: 10,
        total: 0,
        pages: 0,
      },
    };
  }

  async getAutomationConfigById(userId: string, id: string) {
    return {};
  }

  async createAutomationConfig(userId: string, createAutomationDto: any) {
    return {};
  }

  async updateAutomationConfig(userId: string, id: string, updateAutomationDto: any) {
    return {};
  }

  async deleteAutomationConfig(userId: string, id: string) {
    return {};
  }

  async toggleAutomationConfig(userId: string, id: string, enabled: boolean) {
    return {};
  }

  async previewAutomationConfig(userId: string, id: string) {
    return {};
  }
}
