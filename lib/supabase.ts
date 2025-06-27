// This file has been migrated to services/api.ts
// It's kept for compatibility during the migration process
import axios from 'axios';
import { API_URL } from '../services/api';

// Mock supabase client with our new API service to maintain compatibility
// during the migration process. This helps avoid having to update all files at once.
export const supabase = {
  auth: {
    signUp: async ({ email, password, options }: { email: string, password: string, options?: any }) => {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email,
          password,
          fullName: options?.data?.full_name || '',
        });
        return { data: response.data, error: null };
      } catch (error: any) {
        return { 
          data: null, 
          error: { 
            message: error.response?.data?.error || 'Error creating account'
          }
        };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        return { data: response.data, error: null };
      } catch (error: any) {
        return { 
          data: null, 
          error: { 
            message: error.response?.data?.error || 'Invalid credentials'
          }
        };
      }
    },
    signOut: async () => {
      try {
        // Our new API doesn't need a signout endpoint, we just clear local storage
        return { error: null };
      } catch (error: any) {
        return { error: { message: 'Error signing out' } };
      }
    },
    onAuthStateChange: () => {
      // Return a mock subscription object
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => {
      // Return empty session data
      return { data: { session: null } };
    }
  },
  from: (table: string) => {
    return {
      select: (fields?: string) => {
        return {
          eq: (field: string, value: any) => {
            return {
              single: async () => {
                try {
                  const response = await axios.get(`${API_URL}/${table}/${value}`);
                  return { data: response.data, error: null };
                } catch (error: any) {
                  return { 
                    data: null, 
                    error: { 
                      message: error.response?.data?.error || `Error fetching ${table}`
                    }
                  };
                }
              },
              order: () => {
                return {
                  limit: async () => {
                    try {
                      const response = await axios.get(`${API_URL}/${table}?${field}=${value}`);
                      return { data: response.data, error: null };
                    } catch (error: any) {
                      return { 
                        data: null, 
                        error: { 
                          message: error.response?.data?.error || `Error fetching ${table}`
                        }
                      };
                    }
                  }
                };
              }
            };
          }
        };
      },
      insert: (data: any) => {
        return {
          select: async () => {
            try {
              const response = await axios.post(`${API_URL}/${table}`, data);
              return { data: response.data, error: null };
            } catch (error: any) {
              return { 
                data: null, 
                error: { 
                  message: error.response?.data?.error || `Error inserting into ${table}`
                }
              };
            }
          }
        };
      },
      update: (data: any) => {
        return {
          eq: async (field: string, value: any) => {
            try {
              const response = await axios.put(`${API_URL}/${table}/${value}`, data);
              return { data: response.data, error: null };
            } catch (error: any) {
              return { 
                data: null, 
                error: { 
                  message: error.response?.data?.error || `Error updating ${table}`
                }
              };
            }
          }
        };
      },
      delete: () => {
        return {
          eq: async (field: string, value: any) => {
            try {
              const response = await axios.delete(`${API_URL}/${table}/${value}`);
              return { data: response.data, error: null };
            } catch (error: any) {
              return { 
                data: null, 
                error: { 
                  message: error.response?.data?.error || `Error deleting from ${table}`
                }
              };
            }
          }
        };
      }
    };
  }
};