import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native';
import CustomHeader from '@/components/CustomHeader';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Notifications"
        leftComponent={
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <BellOff size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyDescription}>
            You're all caught up! When you receive expense updates, group
            invitations, or payment notifications, they'll appear here.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Notification Settings</Text>
          <Text style={styles.infoText}>
            • Expense updates and reminders{'\n'}• Group invitations and
            activity{'\n'}• Payment confirmations{'\n'}• Friend requests and
            messages
          </Text>
          <Text style={styles.infoNote}>
            Notification preferences can be managed in your device settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
