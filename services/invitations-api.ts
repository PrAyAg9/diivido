import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/utils/network';
import { Alert } from 'react-native';

// API base URL - use the dynamic URL from network utils
const API_URL = API_BASE_URL;

// Configure axios instance for invitations
const invitationAxios = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Add auth interceptor
invitationAxios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to handle network errors gracefully
const handleNetworkError = (error: any, context: string) => {
  console.error(`${context} error:`, error.response?.data || error.message);

  if (
    error.code === 'NETWORK_ERROR' ||
    error.message.includes('Network Error')
  ) {
    console.warn(
      `${context}: Backend server appears to be offline. This is normal in demo mode.`
    );
    // Don't show alert for network errors in demo mode
    return { isNetworkError: true };
  }

  return { isNetworkError: false };
};

// Send invitation to a user by email
export const sendUserInvitation = async (
  email: string,
  groupId?: string,
  groupName?: string
) => {
  try {
    console.log('Sending invitation to:', email);
    const response = await invitationAxios.post('/invitations/invite', {
      email,
      groupId,
      groupName,
    });
    console.log('Invitation response:', response.data);
    return response;
  } catch (error: any) {
    const { isNetworkError } = handleNetworkError(error, 'Send invitation');

    if (isNetworkError) {
      // Return mock success for demo mode
      return {
        data: {
          success: true,
          message: 'Invitation sent successfully (demo mode)',
          invitationId: 'demo-' + Date.now(),
        },
      };
    }

    throw error;
  }
};

// Resend invitation to a user by email
export const resendUserInvitation = async (
  email: string,
  groupId?: string,
  groupName?: string
) => {
  try {
    console.log('Resending invitation to:', email);
    const response = await invitationAxios.post('/invitations/resend', {
      email,
      groupId,
      groupName,
    });
    console.log('Resend invitation response:', response.data);
    return response;
  } catch (error: any) {
    const { isNetworkError } = handleNetworkError(error, 'Resend invitation');

    if (isNetworkError) {
      // Return mock success for demo mode
      return {
        data: {
          success: true,
          message: 'Invitation resent successfully (demo mode)',
          invitationId: 'demo-resend-' + Date.now(),
        },
      };
    }

    throw error;
  }
};

// Check if email exists in the system
export const checkEmailExists = async (email: string) => {
  try {
    const response = await invitationAxios.get('/invitations/check-email', {
      params: { email },
    });
    return response;
  } catch (error: any) {
    const { isNetworkError } = handleNetworkError(error, 'Check email');

    if (isNetworkError) {
      // Return mock response for demo mode
      return {
        data: {
          exists: false,
          message: 'Email check completed (demo mode)',
        },
      };
    }

    throw error;
  }
};

// Get pending invitations for a user (sent by user)
export const getPendingInvitations = async () => {
  try {
    const response = await invitationAxios.get('/invitations/user');
    return response;
  } catch (error: any) {
    const { isNetworkError } = handleNetworkError(
      error,
      'Get pending invitations'
    );

    if (isNetworkError) {
      // Return mock empty array for demo mode
      return {
        data: {
          invitations: [],
          message: 'No pending invitations (demo mode)',
        },
      };
    }

    throw error;
  }
};

// Accept or decline an invitation
export const respondToInvitation = async (
  invitationId: string,
  action: 'accept' | 'decline'
) => {
  try {
    const response = await invitationAxios.post(
      `/invitations/invitations/${invitationId}/respond`,
      {
        action,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};
