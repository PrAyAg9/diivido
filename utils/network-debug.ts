/**
 * Network Debug Utility
 * 
 * To find your computer's IP address for Android development:
 * 
 * METHOD 1 - Command Line (Windows):
 * Open Command Prompt and run: ipconfig
 * Look for "IPv4 Address" under your active network adapter
 * 
 * METHOD 2 - Command Line (Mac/Linux):
 * Open Terminal and run: ifconfig
 * Look for inet address under your active network interface
 * 
 * METHOD 3 - Expo CLI:
 * When you run "expo start", it shows your IP address in the output
 * 
 * COMMON IP RANGES:
 * - 192.168.1.x (most home routers)
 * - 192.168.0.x (alternative home routers)
 * - 10.0.0.x (some routers)
 * - 10.0.2.2 (Android emulator host)
 * 
 * UPDATE THE IP IN: utils/network.ts
 * Change the fallback IP from 192.168.1.100 to your actual IP
 */

export const DEBUG_INFO = {
  currentApiUrl: process.env.EXPO_PUBLIC_API_URL || 'Auto-detected',
  platform: require('react-native').Platform.OS,
  isExpoGo: require('expo-constants').default.appOwnership === 'expo',
};

export const logNetworkInfo = () => {
  console.log('=== NETWORK DEBUG INFO ===');
  console.log('Platform:', DEBUG_INFO.platform);
  console.log('Is Expo Go:', DEBUG_INFO.isExpoGo);
  console.log('API URL:', DEBUG_INFO.currentApiUrl);
  console.log('========================');
};
