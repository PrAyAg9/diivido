import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBaseUrl = () => {
  // Use environment variable if available, otherwise fallback to Render URL
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    'https://backend-divido.onrender.com/api';
  return apiUrl;
};

export const API_BASE_URL = getBaseUrl();

// Function to test connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('API connection test failed:', error);
    return false;
  }
};

// Debug function to log current API URL
export const logApiUrl = () => {
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('🌐 Platform:', Platform.OS);
  console.log('🌐 Dev mode:', __DEV__);
};
