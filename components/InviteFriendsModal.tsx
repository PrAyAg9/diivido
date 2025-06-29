import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Mail,
  Send,
  Users,
  Check,
  Plus,
  UserPlus,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendMultipleInvitations, 
  checkEmailExists, 
  type InvitationData 
} from '@/services/invitation-api';

interface InviteFriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [emailStatuses, setEmailStatuses] = useState<{[key: string]: 'checking' | 'exists' | 'available' | 'error'}>({});

  useEffect(() => {
    if (visible) {
      setEmails(['']);
      setCustomMessage(
        `Hi! I'm using Divido to split expenses with friends. It's really convenient for managing group expenses. Join me on Divido!`
      );
    }
  }, [visible]);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const updateEmail = (index: number, email: string) => {
    const newEmails = [...emails];
    newEmails[index] = email;
    setEmails(newEmails);
    
    // Check email availability after a delay
    if (email && isValidEmail(email)) {
      setEmailStatuses(prev => ({ ...prev, [email]: 'checking' }));
      
      // Debounce email checking
      setTimeout(() => {
        checkEmailAvailability(email);
      }, 500);
    } else {
      setEmailStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[email];
        return newStatuses;
      });
    }
  };

  const checkEmailAvailability = async (email: string) => {
    try {
      const result = await checkEmailExists(email);
      setEmailStatuses(prev => ({
        ...prev,
        [email]: result.exists ? 'exists' : 'available'
      }));
    } catch (error) {
      setEmailStatuses(prev => ({
        ...prev,
        [email]: 'error'
      }));
    }
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvites = async () => {
    const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()));
    
    if (validEmails.length === 0) {
      Alert.alert('Invalid Emails', 'Please enter at least one valid email address.');
      return;
    }

    // Check if any emails already exist
    const existingEmails = validEmails.filter(email => emailStatuses[email] === 'exists');
    if (existingEmails.length > 0) {
      Alert.alert(
        'Users Already Exist',
        `The following emails are already registered: ${existingEmails.join(', ')}. Do you want to continue with the remaining emails?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => sendInvitationsToAvailableEmails(validEmails.filter(email => emailStatuses[email] !== 'exists'))
          }
        ]
      );
      return;
    }

    await sendInvitationsToAvailableEmails(validEmails);
  };

  const sendInvitationsToAvailableEmails = async (emailsToInvite: string[]) => {
    if (emailsToInvite.length === 0) {
      Alert.alert('No Valid Emails', 'No valid emails to send invitations to.');
      return;
    }

    setLoading(true);

    try {
      const result = await sendMultipleInvitations(emailsToInvite);
      
      const successfulInvites = result.results.filter(r => r.success);
      const failedInvites = result.results.filter(r => !r.success);
      
      let message = '';
      if (successfulInvites.length > 0) {
        message += `Successfully sent ${successfulInvites.length} invitation${successfulInvites.length > 1 ? 's' : ''}.`;
      }
      
      if (failedInvites.length > 0) {
        message += `\n\nFailed to send ${failedInvites.length} invitation${failedInvites.length > 1 ? 's' : ''}:`;
        failedInvites.forEach(invite => {
          message += `\n• ${invite.email}: ${invite.error}`;
        });
      }
      
      Alert.alert(
        successfulInvites.length > 0 ? 'Invitations Sent!' : 'Send Failed',
        message,
        [{ text: 'OK', onPress: successfulInvites.length > 0 ? onClose : undefined }]
      );
      
      if (successfulInvites.length === emailsToInvite.length) {
        onClose();
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert(
        'Error',
        'Failed to send invitations. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Invite Friends</Text>
          <Text style={styles.subtitle}>
            Invite your friends to join Divido and make expense splitting easier!
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Addresses</Text>
            {emails.map((email, index) => {
              const emailStatus = email ? emailStatuses[email] : undefined;
              
              return (
                <View key={index} style={styles.emailInputContainer}>
                  <View style={styles.emailInputWrapper}>
                    <Mail size={20} color="#6B7280" style={styles.emailIcon} />
                    <TextInput
                      style={styles.emailInput}
                      value={email}
                      onChangeText={(text) => updateEmail(index, text)}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {emailStatus === 'checking' && (
                      <ActivityIndicator size="small" color="#6B7280" style={styles.statusIcon} />
                    )}
                    {emailStatus === 'exists' && (
                      <AlertCircle size={20} color="#EF4444" style={styles.statusIcon} />
                    )}
                    {emailStatus === 'available' && (
                      <Check size={20} color="#10B981" style={styles.statusIcon} />
                    )}
                    {emails.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeEmail(index)}
                        style={styles.removeButton}
                      >
                        <X size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {email && !isValidEmail(email) && (
                    <Text style={styles.errorText}>Please enter a valid email address</Text>
                  )}
                  {emailStatus === 'exists' && (
                    <Text style={styles.warningText}>This user is already registered</Text>
                  )}
                  {emailStatus === 'error' && (
                    <Text style={styles.errorText}>Error checking email availability</Text>
                  )}
                </View>
              );
            })}
            
            <TouchableOpacity onPress={addEmailField} style={styles.addEmailButton}>
              <Plus size={20} color="#10B981" />
              <Text style={styles.addEmailText}>Add another email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Add a personal message to your invitation"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <UserPlus size={20} color="#10B981" />
                <Text style={styles.previewTitle}>Invitation to Divido</Text>
              </View>
              <Text style={styles.previewMessage}>
                {customMessage}
              </Text>
              <Text style={styles.previewFooter}>
                - {user?.fullName || 'Your friend'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendInvites}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={20} color="white" />
                <Text style={styles.sendButtonText}>
                  Send Invitations ({emails.filter(e => e.trim() && isValidEmail(e.trim())).length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emailInputContainer: {
    marginBottom: 12,
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  emailIcon: {
    marginLeft: 12,
  },
  emailInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  removeButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    marginLeft: 4,
  },
  statusIcon: {
    marginRight: 8,
  },
  addEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    marginTop: 8,
  },
  addEmailText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  previewMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewFooter: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InviteFriendsModal;
