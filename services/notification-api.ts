// services/notification-api.ts

import * as Notifications from 'expo-notifications';
import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

export const notificationApi = {
  // Request notification permissions
  requestPermissions: async (): Promise<boolean> => {
    try {
      // Check if we've already asked and been denied
      const permissionAsked = await AsyncStorage.getItem('notificationPermissionAsked');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Only ask if we haven't asked before or if permission was granted
      if (existingStatus !== 'granted' && !permissionAsked) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        
        // Mark that we've asked for permission
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');
        
        if (status === 'denied') {
          await AsyncStorage.setItem('notificationPermissionDenied', 'true');
        }
      }
      
      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  // Check if permission was previously denied
  isPermissionDenied: async (): Promise<boolean> => {
    const denied = await AsyncStorage.getItem('notificationPermissionDenied');
    return denied === 'true';
  },

  // Get push notification token
  getPushToken: async (): Promise<string | null> => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  // Register device for push notifications
  registerDevice: async (): Promise<void> => {
    try {
      // Check if permission was previously denied
      const permissionDenied = await notificationApi.isPermissionDenied();
      if (permissionDenied) {
        // Don't spam the user with permission requests
        return;
      }

      const hasPermission = await notificationApi.requestPermissions();
      if (!hasPermission) {
        // Permission not granted, but don't log error - user choice
        return;
      }

      const pushToken = await notificationApi.getPushToken();
      if (!pushToken) {
        console.log('Failed to get push token');
        return;
      }

      const authToken = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken }),
      });

      console.log('Device registered for push notifications');
    } catch (error) {
      console.error('Error registering device for notifications:', error);
    }
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

  // Listen for notification interactions
  addNotificationListener: (handler: (notification: any) => void) => {
    return Notifications.addNotificationReceivedListener(handler);
  },

  // Listen for notification response (when user taps notification)
  addNotificationResponseListener: (handler: (response: any) => void) => {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  // Schedule a local notification (for testing)
  scheduleLocalNotification: async (notificationData: PushNotificationData): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  },
};
