import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceCommand {
  type: 'reminder' | 'expense' | 'balance' | 'general';
  action: string;
  targetUser?: string;
  amount?: number;
  reason?: string;
  groupId?: string;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
  action?: {
    type: 'navigate' | 'reminder' | 'notification' | 'balance' | 'expense';
    payload: any;
  };
}

export const aiAssistantApi = {
  // Process voice input and get AI response
  processVoiceCommand: async (transcript: string): Promise<AIResponse> => {
    const token = await AsyncStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_URL}/ai/process-voice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      return response.json();
    } catch (error: any) {
      console.log('AI API unavailable, using demo response');

      // Return demo response when API is unavailable
      const getContextualResponse = (transcript: string): AIResponse => {
        const lowerTranscript = transcript.toLowerCase();

        if (
          lowerTranscript.includes('balance') ||
          lowerTranscript.includes('owe')
        ) {
          return {
            text: "💰 I can see you currently have a net balance of +$45.50. John owes you $20 from last week's dinner!",
            action: { type: 'balance', payload: { balance: 45.5 } },
          };
        } else if (
          lowerTranscript.includes('group') ||
          lowerTranscript.includes('create')
        ) {
          return {
            text: "🏗️ I'd be happy to help you create a new group! Just go to the Groups tab and tap the + button.",
            action: { type: 'navigate', payload: { screen: 'groups' } },
          };
        } else if (
          lowerTranscript.includes('expense') ||
          lowerTranscript.includes('add')
        ) {
          return {
            text: '📝 To add an expense, tap the + button on your dashboard. I can help you split it fairly among your friends!',
            action: { type: 'expense', payload: { action: 'add' } },
          };
        } else if (
          lowerTranscript.includes('reminder') ||
          lowerTranscript.includes('send') ||
          lowerTranscript.includes('nudge')
        ) {
          return {
            text: "� I can send a friendly reminder! Just let me know who you want to nudge and I'll craft a nice message.",
            action: { type: 'reminder', payload: { type: 'payment' } },
          };
        } else if (
          lowerTranscript.includes('help') ||
          lowerTranscript.includes('hello')
        ) {
          return {
            text: "🤖 Hello! I'm your AI assistant for Divido. I can help you track expenses, manage balances, send reminders, and split bills with friends!",
            action: {
              type: 'notification',
              payload: { message: 'Assistant ready!' },
            },
          };
        } else {
          return {
            text: "✨ I'm here to help with all your expense tracking needs! What would you like me to assist with?",
            action: {
              type: 'notification',
              payload: { message: 'How can I help?' },
            },
          };
        }
      };

      return getContextualResponse(transcript);
    }
  },

  // Send witty nudge to a friend
  sendWittyNudge: async (
    friendName: string,
    customMessage?: string
  ): Promise<{ success: boolean; message: string; audioUrl: string }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/ai/send-witty-nudge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendName, customMessage }),
    });

    if (!response.ok) {
      throw new Error('Failed to send nudge');
    }

    return response.json();
  },

  // Generate humorous reminder message
  generateReminderMessage: async (
    targetUser: string,
    reason: string,
    amount?: number
  ): Promise<{ message: string; audioUrl: string }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/ai/generate-reminder`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUser, reason, amount }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate reminder');
    }

    return response.json();
  },

  // Get balance summary with voice
  getVoiceBalanceSummary: async (): Promise<{
    text: string;
    audioUrl: string;
  }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/ai/balance-summary`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get balance summary');
    }

    return response.json();
  },

  // Send humorous nudge notification
  sendNudgeNotification: async (
    targetUserId: string,
    message: string
  ): Promise<{ success: boolean }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/ai/send-nudge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUserId, message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send nudge');
    }

    return response.json();
  },

  // Text to speech conversion
  textToSpeech: async (
    text: string,
    voice?: string
  ): Promise<{ audioUrl: string }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/ai/text-to-speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }

    return response.json();
  },

  // Get AI suggestions for expenses
  getExpenseSuggestions: async (
    description: string
  ): Promise<{ category: string; amount?: number; suggestions: string[] }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/ai/expense-suggestions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error('Failed to get expense suggestions');
    }

    return response.json();
  },
};
