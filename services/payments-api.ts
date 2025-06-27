import axios from 'axios';
import { API_URL } from './api';

// Get user payments (all payments where user is involved)
export const getUserPayments = async () => {
  return axios.get(`${API_URL}/payments/user`);
};

// Create a payment
export const createPayment = async (paymentData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  groupId?: string;
  description?: string;
}) => {
  return axios.post(`${API_URL}/payments`, paymentData);
};

// Get payments for a specific group
export const getGroupPayments = async (groupId: string) => {
  return axios.get(`${API_URL}/payments/group/${groupId}`);
};

// Mark payment as confirmed
export const confirmPayment = async (paymentId: string) => {
  return axios.put(`${API_URL}/payments/${paymentId}/confirm`);
};
