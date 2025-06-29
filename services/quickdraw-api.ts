import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuickDrawGameData {
  groupId: string;
  expenseData: {
    title: string;
    amount: number;
    currency?: string;
    category?: string;
  };
}

export interface QuickDrawParticipant {
  userName: string;
  isReady: boolean;
  hasPlayed: boolean;
  reactionTime?: number;
}

export interface QuickDrawResults {
  winner: string;
  loser: string;
  allTimes: Array<{
    userName: string;
    reactionTime: number;
  }>;
}

export const quickDrawApi = {
  // Start a new Quick Draw game
  startGame: async (gameData: QuickDrawGameData): Promise<{ 
    success: boolean; 
    gameId: string; 
    message: string; 
    participants: QuickDrawParticipant[] 
  }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/quickdraw/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });

    if (!response.ok) {
      throw new Error('Failed to start Quick Draw game');
    }

    return response.json();
  },

  // Join a Quick Draw game
  joinGame: async (gameId: string): Promise<{
    success: boolean;
    gameState: string;
    participants: QuickDrawParticipant[];
    allReady: boolean;
  }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/quickdraw/join/${gameId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to join game');
    }

    return response.json();
  },

  // Record a tap (reaction time)
  recordTap: async (gameId: string, tapTime: number): Promise<{
    success: boolean;
    reactionTime: number;
    gameState: string;
    results?: QuickDrawResults;
  }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/quickdraw/tap/${gameId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tapTime }),
    });

    if (!response.ok) {
      throw new Error('Failed to record tap');
    }

    return response.json();
  },

  // Get game status
  getGameStatus: async (gameId: string): Promise<{
    gameId: string;
    gameState: string;
    expenseTitle: string;
    participants: QuickDrawParticipant[];
    results?: QuickDrawResults;
  }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/quickdraw/status/${gameId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get game status');
    }

    return response.json();
  },

  // Clean up old games (admin function)
  cleanupOldGames: async (): Promise<{ message: string }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/quickdraw/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cleanup games');
    }

    return response.json();
  },
};
