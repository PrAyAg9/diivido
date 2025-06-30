import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { logNetworkInfo } from '@/utils/network-debug';

export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    // Log network info for debugging
    logNetworkInfo();

    if (!loading) {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    }
  }, [session, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.loadingText}>Loading Divido...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 16,
  },
});
