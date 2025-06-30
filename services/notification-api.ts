// services/notification-api.ts

// Temporarily disabled expo-notifications due to Android compatibility issues in SDK 53
// This is a stub implementation that prevents errors while maintaining the API interface
// TODO: Re-enable when using development build instead of Expo Go

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: {
    type: 'quickdraw' | 'nudge' | 'expense' | 'reminder';
    gameId?: string;
    expenseId?: string;
    groupId?: string;
    [key: string]: any;
  };
}

// Check if we're in Expo Go
const isExpoGo = () => {
  return Constants.appOwnership === 'expo';
};

export const notificationApi = {
  // Request notification permissions (stub)
  requestPermissions: async (): Promise<boolean> => {
    console.log('Notifications temporarily disabled - use development build for push notifications');
    return false;
  },

  // Check if permission was previously denied (stub)
  isPermissionDenied: async (): Promise<boolean> => {
    return false;
  },

  // Get push notification token (stub)
  getPushToken: async (): Promise<string | null> => {
    console.log('Push tokens temporarily disabled - use development build for push notifications');
    return null;
  },

  // Register device for push notifications (stub)
  registerDevice: async (): Promise<void> => {
    console.log('Device registration temporarily disabled - use development build for push notifications');
  },

  // Send a Quick Draw notification to group members
  sendQuickDrawNotification: async (gameId: string, groupId: string): Promise<void> => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/notifications/quickdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, groupId }),
      });
    } catch (error) {
      console.error('Error sending Quick Draw notification:', error);
    }
  },

  // Listen for notification interactions (stub)
  addNotificationListener: (handler: (notification: any) => void) => {
    console.log('Notification listeners temporarily disabled');
    return { remove: () => {} };
  },

  // Listen for notification response (stub)
  addNotificationResponseListener: (handler: (response: any) => void) => {
    console.log('Notification response listeners temporarily disabled');
    return { remove: () => {} };
  },

  // Schedule a local notification (stub)
  scheduleLocalNotification: async (notificationData: PushNotificationData): Promise<void> => {
    console.log('Local notifications temporarily disabled:', notificationData.title);
  },
};
