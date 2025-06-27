import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Mail, Users, Clock, Check, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { sendUserInvitation, checkEmailExists, getPendingInvitations, resendUserInvitation } from '@/services/invitations-api';

interface PendingInvitation {
  id: string;
  email: string;
  groupName?: string;
  groupId?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function InviteFriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const loadPendingInvitations = async () => {
    try {
      const response = await getPendingInvitations();
      // Ensure we always have an array
      const invitations = Array.isArray(response.data) ? response.data : [];
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      setPendingInvitations([]); // Set empty array on error
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Check if email already exists
      const existsResponse = await checkEmailExists(email.trim());
      if (existsResponse.data.exists) {
        Alert.alert('Info', 'This user is already registered on Divido!');
        setLoading(false);
        return;
      }

      // Send invitation
      await sendUserInvitation(email.trim());
      
      Alert.alert(
        'Invitation Sent!', 
        `An invitation has been sent to ${email.trim()}. They'll receive an email with instructions to join Divido.`,
        [{ text: 'OK', onPress: () => {
          setEmail('');
          loadPendingInvitations(); // Refresh the list
        }}]
      );
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (email: string, groupId?: string, groupName?: string) => {
    try {
      await resendUserInvitation(email, groupId, groupName);
      Alert.alert(
        'Invitation Resent!', 
        `A new invitation has been sent to ${email}.`,
        [{ text: 'OK', onPress: () => loadPendingInvitations() }]
      );
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to resend invitation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Invite Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite by Email</Text>
          <Text style={styles.sectionDescription}>
            Invite friends to join Divido and start splitting expenses together!
          </Text>
          
          <View style={styles.inviteContainer}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" />
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter friend's email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
              onPress={handleSendInvitation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.inviteButtonText}>Send Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Invitations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Invitations</Text>
          
          {loadingInvitations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading invitations...</Text>
            </View>
          ) : pendingInvitations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Pending Invitations</Text>
              <Text style={styles.emptyText}>
                Invitations you send will appear here until they're accepted or expired.
              </Text>
            </View>
          ) : (
            <View style={styles.invitationsList}>
              {pendingInvitations.map((invitation) => (
                <View key={invitation.id} style={styles.invitationCard}>
                  <View style={styles.invitationInfo}>
                    <View style={styles.avatarContainer}>
                      <Mail size={20} color="#6B7280" />
                    </View>
                    <View style={styles.invitationDetails}>
                      <Text style={styles.invitationEmail}>{invitation.email}</Text>
                      {invitation.groupName && (
                        <Text style={styles.invitationGroup}>Group: {invitation.groupName}</Text>
                      )}
                      <Text style={styles.invitationDate}>
                        Sent {formatDate(invitation.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.invitationStatus}>
                    {isExpired(invitation.expiresAt) ? (
                      <>
                        <View style={[styles.statusBadge, styles.expiredBadge]}>
                          <X size={14} color="#EF4444" />
                          <Text style={[styles.statusText, styles.expiredText]}>Expired</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.resendButton}
                          onPress={() => handleResendInvitation(invitation.email, invitation.groupId, invitation.groupName)}
                        >
                          <Text style={styles.resendButtonText}>Resend</Text>
                        </TouchableOpacity>
                      </>
                    ) : invitation.status === 'accepted' ? (
                      <View style={[styles.statusBadge, styles.acceptedBadge]}>
                        <Check size={14} color="#10B981" />
                        <Text style={[styles.statusText, styles.acceptedText]}>Accepted</Text>
                      </View>
                    ) : (
                      <>
                        <View style={[styles.statusBadge, styles.pendingBadge]}>
                          <Clock size={14} color="#F59E0B" />
                          <Text style={[styles.statusText, styles.pendingText]}>Pending</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.resendButton}
                          onPress={() => handleResendInvitation(invitation.email, invitation.groupId, invitation.groupName)}
                        >
                          <Text style={styles.resendButtonText}>Resend</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>1</Text>
              </View>
              <Text style={styles.infoText}>Enter your friend's email address</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>2</Text>
              </View>
              <Text style={styles.infoText}>They'll receive an email invitation</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>3</Text>
              </View>
              <Text style={styles.infoText}>Once they join, you can add them to groups</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inviteContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  invitationsList: {
    gap: 12,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  invitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitationDetails: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  invitationGroup: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  invitationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  acceptedBadge: {
    backgroundColor: '#ECFDF5',
  },
  expiredBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingText: {
    color: '#92400E',
  },
  acceptedText: {
    color: '#065F46',
  },
  expiredText: {
    color: '#991B1B',
  },
  resendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
});
