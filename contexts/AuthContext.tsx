import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { authApi } from '@/services/api';

// Define user type
interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  session: boolean; // Added session prop to match usage in app/index.tsx
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  // signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(false);

  // Set up axios with the auth token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setSession(true);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setSession(false);
    }
  }, [token]);

  // Load user data from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          axios.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${storedToken}`;
          setSession(true);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    try {
      console.log('Registering user:', { email, fullName });

      const response = await authApi.register({
        email,
        password,
        fullName,
        phone,
      });
      const { user: newUser, token: newToken } = response.data;

      console.log('Registration successful:', newUser);

      // Save to state
      setUser(newUser);
      setToken(newToken);
      setSession(true);

      // Save to storage
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      return { error: null };
    } catch (error: any) {
      console.error(
        'Registration error:',
        error.response?.data || error.message
      );
      return {
        error: error.response?.data?.error || 'Error creating account',
      };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Logging in user:', email);

      const response = await authApi.login({ email, password });
      const { user: loggedInUser, token: newToken } = response.data;

      console.log('Login successful:', loggedInUser);

      // Save to state
      setUser(loggedInUser);
      setToken(newToken);
      setSession(true);

      // Save to storage
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        error: error.response?.data?.error || 'Invalid credentials',
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Clear state
      setUser(null);
      setToken(null);
      setSession(false);

      // Clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      return { error: null };
    } catch (error: any) {
      return { error: 'Error signing out' };
    }
  };

  // Create the auth context value
  const value = {
    user,
    token,
    loading,
    session,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
