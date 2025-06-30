import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBaseUrl = () => {
  // For web, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // For development on physical device or emulator
  if (__DEV__) {
    // Try to get the debug server host from Expo
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    
    if (debuggerHost) {
      return `http://${debuggerHost}:5000/api`;
    }
    
    // Fallback IP addresses for common scenarios
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://10.0.2.2:5000/api';
    }
    
    // For iOS simulator and physical devices, try common local IP
    return 'http://192.168.1.100:5000/api'; // Replace with your actual IP
  }
  
  // Production URL (replace with your actual production API URL)
  return 'https://your-production-api.com/api';
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
