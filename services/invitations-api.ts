import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Configure axios instance for invitations
const invitationAxios = axios.create({
  baseURL: API_URL,
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
    console.error('Invitation error:', error.response?.data || error.message);
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
    console.error(
      'Resend invitation error:',
      error.response?.data || error.message
    );
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
  } catch (error) {
    throw error;
  }
};

// Get pending invitations for a user (sent by user)
export const getPendingInvitations = async () => {
  try {
    const response = await invitationAxios.get('/invitations/user');
    return response;
  } catch (error) {
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
