import axios from 'axios';
import { API_URL } from './api';

// Get user groups
export const getUserGroups = async () => {
  return axios.get(`${API_URL}/groups`);
};

// Get group member count
export const getGroupMemberCount = async (groupId: string) => {
  return axios.get(`${API_URL}/groups/${groupId}/members/count`);
};

// Get user splits for a group
export const getUserSplitsForGroup = async (groupId: string) => {
  return axios.get(`${API_URL}/expenses/splits/user`, {
    params: { groupId }
  });
};

// Get user expenses for a group
export const getUserExpensesForGroup = async (groupId: string) => {
  return axios.get(`${API_URL}/expenses/user`, {
    params: { groupId }
  });
};

// Get last activity for a group
export const getGroupLastActivity = async (groupId: string) => {
  return axios.get(`${API_URL}/groups/${groupId}/activity/latest`);
};

// Create a new group
export const createGroup = async (groupData: {
  name: string;
  description?: string;
  avatarUrl?: string;
  members?: string[];
}) => {
  return axios.post(`${API_URL}/groups`, groupData);
};

// Add member to group
export const addGroupMember = async (groupId: string, email: string) => {
  return axios.post(`${API_URL}/groups/${groupId}/members`, { email });
};
