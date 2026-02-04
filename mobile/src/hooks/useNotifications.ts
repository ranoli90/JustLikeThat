import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import config from '../config';
import { logger } from '../utils';

interface UseNotificationsReturn {
  isLoading: boolean;
  expoPushToken: string | null;
  notifications: Notification[];
  unreadCount: number;
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  scheduleLocalNotification: (title: string, body: string, data?: Record<string, string>, seconds?: number) => Promise<string>;
  cancelScheduledNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationSetup = (): { isLoading: boolean; setupNotifications: () => Promise<void> } => {
  const [isLoading, setIsLoading] = useState(true);
  const { updateUser } = useAuthStore();

  const setupNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Notifications require a physical device');
        setIsLoading(false);
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        setIsLoading(false);
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: config.expoProjectId || 'YOUR_PROJECT_ID',
      });
      
      const token = tokenData.data;
      await AsyncStorage.setItem('expo_push_token', token);
      
      // Update user preferences with push token
      updateUser({
        preferences: {
          notifications: { pushEnabled: true } as any,
          jobSearch: {} as any,
          privacy: {} as any,
        },
      });

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setIsLoading(false);
    }
  };

  return { isLoading, setupNotifications };
};

export const useNotifications = (): UseNotificationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    loadNotifications();
    registerForPushNotifications();
  }, [user]);

  const registerForPushNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('expo_push_token');
      if (token) {
        setExpoPushToken(token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, string>,
    seconds: number = 0
  ): Promise<string> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: seconds > 0 ? { seconds } : null,
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return '';
    }
  };

  const cancelScheduledNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    isLoading,
    expoPushToken,
    notifications,
    unreadCount,
    requestPermission,
    markAsRead,
    markAllAsRead,
    scheduleLocalNotification,
    cancelScheduledNotification,
  };
};
