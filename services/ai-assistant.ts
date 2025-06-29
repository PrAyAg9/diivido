import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceCommand {
  id: string;
  text: string;
  confidence: number;
  timestamp: Date;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
  action?: {
    type: 'remind' | 'split' | 'pay' | 'balance' | 'create_group' | 'add_expense';
    data?: any;
  };
  suggestions?: string[];
}

export interface ReminderRequest {
  targetUserId: string;
  targetUserName: string;
  amount?: number;
  reason?: string;
  groupId?: string;
}

export const aiAssistantApi = {
  // Process voice command and get AI response
  processVoiceCommand: async (voiceText: string): Promise<AIResponse> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/ai/process-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: voiceText,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      return response.json();
    } catch (error) {
      console.error('Error processing voice command:', error);
      throw error;
    }
  },

  // Send humorous reminder notification
  sendHumorousReminder: async (reminderData: ReminderRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/ai/send-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      return response.json();
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  },

  // Get AI suggestions for expense splitting
  getSplitSuggestions: async (context: {
    amount: number;
    participants: string[];
    description?: string;
  }): Promise<{ suggestions: Array<{ type: string; description: string; data: any }> }> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/ai/split-suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to get split suggestions');
      }

      return response.json();
    } catch (error) {
      console.error('Error getting split suggestions:', error);
      throw error;
    }
  },

  // Generate witty expense descriptions
  generateExpenseDescription: async (context: {
    amount: number;
    category: string;
    participants?: string[];
  }): Promise<{ description: string; emoji: string }> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      return response.json();
    } catch (error) {
      console.error('Error generating description:', error);
      throw error;
    }
  },

  // Get audio for text-to-speech
  getTextToSpeech: async (text: string, voiceId?: string): Promise<{ audioUrl: string }> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/ai/text-to-speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          voiceId: voiceId || 'default' // Will use a default friendly voice
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      return response.json();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  // Get conversation context for better AI responses
  getConversationContext: async (): Promise<{
    recentExpenses: any[];
    pendingDebts: any[];
    userPreferences: any;
  }> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/ai/context`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get context');
      }

      return response.json();
    } catch (error) {
      console.error('Error getting context:', error);
      throw error;
    }
  },
};
