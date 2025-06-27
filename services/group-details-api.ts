// API service for group-details.tsx
import axios from 'axios';
import { API_URL } from './api';

// Get group details
export const getGroupDetails = async (groupId: string) => {
  if (!groupId || groupId === 'undefined') {
    throw new Error('No valid group ID provided');
  }
  console.log('API call - Getting details for group:', groupId);
  return axios.get(`${API_URL}/groups/${groupId}`);
};

// Get group expenses
export const getGroupExpenses = async (groupId: string) => {
  if (!groupId || groupId === 'undefined') {
    throw new Error('No valid group ID provided');
  }
  console.log('API call - Getting expenses for group:', groupId);
  return axios.get(`${API_URL}/expenses/group/${groupId}`);
};

// Mark expense split as paid
export const markSplitAsPaid = async (expenseId: string) => {
  return axios.post(`${API_URL}/expenses/${expenseId}/mark-paid`);
};

// Create payment
export const createPayment = async (paymentData: {
  toUser: string;
  groupId: string;
  amount: number;
  notes?: string;
}) => {
  return axios.post(`${API_URL}/payments`, paymentData);
};

// Get payments for a group
export const getGroupPayments = async (groupId: string) => {
  return axios.get(`${API_URL}/payments`, { params: { groupId } });
};
