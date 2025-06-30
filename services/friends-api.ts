import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Friend {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: 'accepted' | 'pending_sent' | 'pending_received';
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  fromUser: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  toUser: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const friendsApi = {
  // Get user's friends and friend requests
  getFriends: async (): Promise<{ data: Friend[] }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/friends`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friends');
    }

    return response.json();
  },

  // Send friend request
  sendFriendRequest: async (
    email: string
  ): Promise<{ data: FriendRequest }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/friends/request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send friend request');
    }

    return response.json();
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string): Promise<{ data: Friend }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/friends/request/${requestId}/accept`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to accept friend request');
    }

    return response.json();
  },

  // Reject friend request
  rejectFriendRequest: async (
    requestId: string
  ): Promise<{ success: boolean }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/friends/request/${requestId}/reject`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reject friend request');
    }

    return response.json();
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<{ success: boolean }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/friends/${friendId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove friend');
    }

    return response.json();
  },

  // Search users by email for friend requests
  searchUsers: async (
    email: string
  ): Promise<{
    data: Array<{
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    }>;
  }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/users/search?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search users');
    }

    return response.json();
  },
};
