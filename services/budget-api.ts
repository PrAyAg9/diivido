// services/budget-api.ts

import { API_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CategoryBudget {
  category: string;
  name: string;
  icon: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  color: string;
}

export interface BudgetSuggestion {
  name: string;
  amount: number;
  reason: string;
  categories: CategoryBudget[];
  duration?: number; // days
  location?: string;
}

export interface BudgetStatus {
  totalBudget: number;
  currency: string;
  description?: string;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: 'good' | 'halfway' | 'warning' | 'exceeded';
  categories: CategoryBudget[];
  location?: string;
  duration?: number;
}

export interface AIBudgetRequest {
  destination?: string;
  duration?: number; // days
  tripType?: 'budget' | 'comfortable' | 'luxury';
  groupSize?: number;
  specialRequirements?: string;
}

export const budgetAPI = {
  // Get AI budget suggestions with category breakdown
  getBudgetSuggestions: async (request: AIBudgetRequest, groupId: string): Promise<{ suggestions: BudgetSuggestion[] }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/budget/ai-suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, groupId }),
    });

    if (!response.ok) {
      throw new Error('Failed to get budget suggestions');
    }

    return response.json();
  },

  // Get smart budget suggestions based on simple input
  getSmartBudgetSuggestions: async (description: string, groupId: string): Promise<{ suggestions: BudgetSuggestion[] }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/budget/smart-suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, groupId }),
    });

    if (!response.ok) {
      throw new Error('Failed to get smart budget suggestions');
    }

    return response.json();
  },

  // Set group budget with category breakdown
  setGroupBudget: async (
    groupId: string, 
    amount: number, 
    currency: string = 'INR', 
    description?: string,
    categories?: CategoryBudget[],
    location?: string,
    duration?: number
  ) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/budget/groups/${groupId}/budget`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount, 
        currency, 
        description, 
        categories,
        location,
        duration 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to set group budget');
    }

    return response.json();
  },

  // Get group budget status
  getGroupBudgetStatus: async (groupId: string): Promise<{ budgetStatus: BudgetStatus | null; groupName: string }> => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/budget/groups/${groupId}/budget-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get budget status');
    }

    return response.json();
  },

  // Remove group budget
  removeGroupBudget: async (groupId: string) => {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/budget/groups/${groupId}/budget`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove group budget');
    }

    return response.json();
  },
};