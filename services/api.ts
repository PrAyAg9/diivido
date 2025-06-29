



 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL set by the startup script
export const API_URL = 'http://localhost:5000/api';

// Define API base URL - change this to your actual server URL
// In development, you might need to use your computer's IP address instead of localhost
// For example: 'http://192.168.1.100:5000/api'

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Set up request interceptor to add auth token
axios.interceptors.request.use(
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

// Auth API service
export const authApi = {
  register: (userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => axios.post('/auth/register', userData),

  login: (credentials: { email: string; password: string }) =>
    axios.post('/auth/login', credentials),
};

// Groups API service
export const groupsApi = {
  createGroup: (groupData: {
    name: string;
    description?: string;
    avatarUrl?: string;
  }) => axios.post('/groups', groupData),

  getGroups: () => axios.get('/groups'),

  getGroupById: (groupId: string) => axios.get(`/groups/${groupId}`),

  addMember: (groupId: string, userId: string) =>
    axios.post(`/groups/${groupId}/members`, { userId }),
};

// Expenses API service
export const expensesApi = {
  createExpense: (expenseData: {
    groupId: string;
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    category: string;
    splitType?: 'equal' | 'exact' | 'percentage' | 'shares';
    splits: Array<{
      userId: string;
      amount: number;
      percentage?: number;
      shares?: number;
    }>;
    receiptUrl?: string;
    date?: Date;
  }) => axios.post('/expenses', expenseData),

  getGroupExpenses: (groupId: string) =>
    axios.get(`/expenses/group/${groupId}`),

  updateExpense: (expenseId: string, updateData: any) =>
    axios.put(`/expenses/${expenseId}`, updateData),

  markSplitAsPaid: (expenseId: string) =>
    axios.post(`/expenses/${expenseId}/mark-paid`),
};

// Payments API service
export const paymentsApi = {
  createPayment: (paymentData: {
    fromUser: string;
    toUser: string;
    groupId?: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    notes?: string;
  }) => axios.post('/payments', paymentData),

  getPayments: (filters?: { groupId?: string }) =>
    axios.get('/payments', { params: filters }),

  updatePaymentStatus: (
    paymentId: string,
    status: 'pending' | 'completed' | 'failed'
  ) => axios.put(`/payments/${paymentId}/status`, { status }),
};
