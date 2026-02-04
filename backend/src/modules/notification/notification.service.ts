import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async getNotifications(userId: string, query: any) {
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

  async getNotificationById(userId: string, id: string) {
    return {};
  }

  async markAsRead(userId: string, id: string) {
    return {};
  }

  async markAllAsRead(userId: string) {
    return {};
  }

  async deleteNotification(userId: string, id: string) {
    return {};
  }

  async clearNotifications(userId: string, readOnly?: boolean) {
    return {};
  }

  async getUnreadCount(userId: string) {
    return { count: 0 };
  }
}
