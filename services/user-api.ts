import axios from 'axios';
import { API_URL } from './api';

// Get all users
export const getAllUsers = async () => {
  return axios.get(`${API_URL}/users/all`);
};

// Search users
export const searchUsers = async (query: string) => {
  return axios.get(`${API_URL}/users/search`, { params: { query } });
};
