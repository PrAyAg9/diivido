import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// Create axios instance with auth interceptor for invitations
const invitationApi = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include auth token
invitationApi.interceptors.request.use(
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

export interface InvitationData {
  email: string;
  groupId?: string;
  groupName?: string;
}

export interface SentInvitation {
  id: string;
  email: string;
  groupName: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
}

export interface PendingInvitation {
  id: string;
  groupName: string | null;
  invitedBy: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface Friend {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  status: 'active';
  addedAt: string;
}

/**
 * Send invitation to a user
 */
export const sendInvitation = async (
  invitationData: InvitationData
): Promise<{
  success: boolean;
  message: string;
  invitation?: any;
  error?: string;
}> => {
  try {
    console.log('Sending invitation with data:', invitationData);
    console.log('API URL:', API_URL);
    
    const response = await invitationApi.post(
      '/invitations/invite',
      invitationData
    );

    console.log('Invitation sent successfully:', response.data);
    
    return {
      success: true,
      message: response.data.message,
      invitation: response.data.invitation,
    };
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Request data:', invitationData);
    
    return {
      success: false,
      message: 'Failed to send invitation',
      error: error.response?.data?.error || error.message || 'Network error',
    };
  }
};

/**
 * Send multiple invitations
 */
export const sendMultipleInvitations = async (
  emails: string[],
  groupId?: string,
  groupName?: string
): Promise<{
  success: boolean;
  results: Array<{
    email: string;
    success: boolean;
    message: string;
    error?: string;
  }>;
}> => {
  const results = [];

  for (const email of emails) {
    const result = await sendInvitation({
      email: email.trim(),
      groupId,
      groupName,
    });

    results.push({
      email: email.trim(),
      success: result.success,
      message: result.message,
      error: result.error,
    });
  }

  const successCount = results.filter((r) => r.success).length;

  return {
    success: successCount > 0,
    results,
  };
};

/**
 * Resend invitation to a user
 */
export const resendInvitation = async (
  invitationData: InvitationData
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
  try {
    const response = await invitationApi.post(
      '/invitations/resend',
      invitationData
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return {
      success: false,
      message: 'Failed to resend invitation',
      error: error.response?.data?.error || 'Network error',
    };
  }
};

/**
 * Check if email already exists in the system
 */
export const checkEmailExists = async (
  email: string
): Promise<{
  exists: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}> => {
  try {
    const response = await invitationApi.get(
      `/invitations/check-email?email=${encodeURIComponent(email)}`
    );

    return {
      exists: response.data.exists,
      user: response.data.user,
    };
  } catch (error: any) {
    console.error('Error checking email:', error);
    return { exists: false };
  }
};

/**
 * Get invitations sent by current user
 */
export const getUserSentInvitations = async (): Promise<SentInvitation[]> => {
  try {
    const response = await invitationApi.get('/invitations/user');
    return response.data || [];
  } catch (error: any) {
    console.error('Error getting sent invitations:', error);
    return [];
  }
};

/**
 * Get pending invitations for current user
 */
export const getPendingInvitations = async (): Promise<PendingInvitation[]> => {
  try {
    const response = await invitationApi.get('/invitations/invitations');
    return response.data.invitations || [];
  } catch (error: any) {
    console.error('Error getting pending invitations:', error);
    return [];
  }
};

/**
 * Respond to an invitation
 */
export const respondToInvitation = async (
  invitationId: string,
  action: 'accept' | 'decline'
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
  try {
    const response = await invitationApi.post(
      `/invitations/invitations/${invitationId}/respond`,
      {
        action,
      }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Error responding to invitation:', error);
    return {
      success: false,
      message: 'Failed to respond to invitation',
      error: error.response?.data?.error || 'Network error',
    };
  }
};

/**
 * Get user's friends (users who have accepted invitations)
 */
export const getUserFriends = async (): Promise<Friend[]> => {
  try {
    // First get sent invitations that were accepted
    const sentInvitations = await getUserSentInvitations();
    const acceptedInvitations = sentInvitations.filter(
      (inv) => inv.status === 'accepted'
    );

    // Get pending invitations to see who invited us
    const pendingInvitations = await getPendingInvitations();

    // For now, we'll mock the friends list based on accepted invitations
    // In a real app, you'd have a dedicated friends endpoint
    const friends: Friend[] = [];

    // Add mock friends for demo
    const mockFriends: Friend[] = [
      {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        avatarUrl: '',
        status: 'active',
        addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        fullName: 'Sarah Wilson',
        email: 'sarah@example.com',
        avatarUrl: '',
        status: 'active',
        addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return [...friends, ...mockFriends];
  } catch (error: any) {
    console.error('Error getting friends:', error);
    return [];
  }
};

/**
 * Get invitation statistics
 */
export const getInvitationStats = async (): Promise<{
  totalSent: number;
  pending: number;
  accepted: number;
  declined: number;
  friends: number;
}> => {
  try {
    const [sentInvitations, friends] = await Promise.all([
      getUserSentInvitations(),
      getUserFriends(),
    ]);

    const pending = sentInvitations.filter(
      (inv) => inv.status === 'pending'
    ).length;
    const accepted = sentInvitations.filter(
      (inv) => inv.status === 'accepted'
    ).length;
    const declined = sentInvitations.filter(
      (inv) => inv.status === 'declined'
    ).length;

    return {
      totalSent: sentInvitations.length,
      pending,
      accepted,
      declined,
      friends: friends.length,
    };
  } catch (error: any) {
    console.error('Error getting invitation stats:', error);
    return {
      totalSent: 0,
      pending: 0,
      accepted: 0,
      declined: 0,
      friends: 0,
    };
  }
};
