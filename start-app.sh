#!/bin/bash

# Divido App Runner

# Set default IP if not provided as an argument
IP_ADDRESS="localhost"
if [ ! -z "$1" ]; then
  IP_ADDRESS="$1"
fi

echo "Setting up the app to use IP: $IP_ADDRESS"

# Create a temporary file with the updated API URL
cat << EOF > services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL set by the startup script
export const API_URL = 'http://$IP_ADDRESS:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Set up request interceptor to add auth token
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API service
export const authApi = {
  register: (userData: { email: string; password: string; fullName: string; phone?: string }) => 
    axios.post('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) => 
    axios.post('/auth/login', credentials),
};

// Groups API service
export const groupsApi = {
  createGroup: (groupData: { name: string; description?: string; avatarUrl?: string }) => 
    axios.post('/groups', groupData),
  
  getGroups: () => 
    axios.get('/groups'),
  
  getGroupById: (groupId: string) => 
    axios.get(\`/groups/\${groupId}\`),
  
  addMember: (groupId: string, userId: string) => 
    axios.post(\`/groups/\${groupId}/members\`, { userId }),
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
    axios.get(\`/expenses/group/\${groupId}\`),
  
  updateExpense: (expenseId: string, updateData: any) => 
    axios.put(\`/expenses/\${expenseId}\`, updateData),
  
  markSplitAsPaid: (expenseId: string) => 
    axios.post(\`/expenses/\${expenseId}/mark-paid\`),
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
  
  updatePaymentStatus: (paymentId: string, status: 'pending' | 'completed' | 'failed') => 
    axios.put(\`/payments/\${paymentId}/status\`, { status }),
};
EOF

echo "API configured to use $IP_ADDRESS"

# Start the backend and frontend in separate terminals
echo "Starting backend server..."
gnome-terminal -- bash -c "cd backend && npm run dev; read -p 'Press Enter to close...'"
sleep 5

echo "Starting Expo development server..."
gnome-terminal -- bash -c "npx expo start; read -p 'Press Enter to close...'"

echo
echo "Divido app is now running!"
echo
echo "Backend: http://$IP_ADDRESS:5000"
echo "Frontend: Check the Expo window for connection options"
echo
echo "To connect from a real device, scan the QR code in the Expo window."
echo
echo "Press Ctrl+C in individual terminal windows to stop the servers."
