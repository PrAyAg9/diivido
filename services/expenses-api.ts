import axios from 'axios';
import { API_URL } from './api';

// Get user groups
export const getUserGroups = async () => {
  return axios.get(`${API_URL}/groups`);
};

// Get group members
export const getGroupMembers = async (groupId: string) => {
  return axios.get(`${API_URL}/groups/${groupId}/members`);
};

// Create expense
export const createExpense = async (expenseData: {
  groupId: string;
  title: string;
  amount: number;
  currency?: string;
  category: string;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: Array<{
    userId: string;
    amount: number;
    percentage?: number;
    shares?: number;
  }>;
  receiptUrl?: string;
  notes?: string;
  date?: string;
}) => {
  return axios.post(`${API_URL}/expenses`, expenseData);
};

// Update expense metadata
export const updateExpenseMetadata = async (expenseId: string, data: {
  title?: string;
  category?: string;
  notes?: string;
}) => {
  return axios.put(`${API_URL}/expenses/${expenseId}`, data);
};

// Mark expense as settled
export const markExpenseSettled = async (expenseId: string) => {
  return axios.put(`${API_URL}/expenses/${expenseId}/settle`);
};

// Get user expenses (all expenses where user is involved)
export const getUserExpenses = async () => {
  return axios.get(`${API_URL}/expenses/user`);
};

// Get expenses for a specific group
export const getGroupExpenses = async (groupId: string) => {
  return axios.get(`${API_URL}/expenses/group/${groupId}`);
};
