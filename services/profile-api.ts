import axios from 'axios';
import { API_URL } from './api';

// Get user profile
export const getUserProfile = async (userId: string) => {
  return axios.get(`${API_URL}/users/${userId}/profile`);
};

// Update user profile
export const updateUserProfile = async (userData: {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}) => {
  return axios.put(`${API_URL}/users/profile`, userData);
};

// Change password
export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  return axios.put(`${API_URL}/auth/change-password`, data);
};

// Upload avatar
export const uploadAvatar = async (formData: FormData) => {
  return axios.post(`${API_URL}/users/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
