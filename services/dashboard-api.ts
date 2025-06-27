import axios from 'axios';
import { API_URL } from './api';

// Get user balances
export const getUserBalances = async () => {
  return axios.get(`${API_URL}/users/balances`);
};

// Get user activity
export const getUserActivity = async () => {
  return axios.get(`${API_URL}/users/activity`);
};

// Get expense details
export const getExpenseDetails = async (expenseId: string) => {
  return axios.get(`${API_URL}/expenses/${expenseId}`);
};

// Get user groups for dashboard
export const getUserGroupsForDashboard = async () => {
  return axios.get(`${API_URL}/groups/dashboard`);
};

// Get summary statistics
export const getUserSummary = async () => {
  return axios.get(`${API_URL}/users/summary`);
};
