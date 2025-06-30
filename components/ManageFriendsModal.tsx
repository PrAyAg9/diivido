import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import {
  X,
  Users,
  Search,
  UserMinus,
  Mail,
  MessageCircle,
  MoreVertical,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Avatar from '@/components/Avatar';
import {
  getUserSentInvitations,
  getUserFriends,
  resendInvitation,
  getInvitationStats,
  type SentInvitation,
  type Friend,
} from '@/services/invitation-api';

interface CombinedContact {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'pending' | 'declined';
  addedAt: string;
  totalExpenses?: number;
  lastActive?: string;
  type: 'friend' | 'invitation';
}

interface ManageFriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ManageFriendsModal: React.FC<ManageFriendsModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<CombinedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'pending'>(
    'all'
  );
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    declined: 0,
  });

  useEffect(() => {
    if (visible) {
      loadContactsAndInvitations();
    }
  }, [visible]);

  const loadContactsAndInvitations = async () => {
    setLoading(true);
    try {
      const [friends, sentInvitations, invitationStats] = await Promise.all([
        getUserFriends(),
        getUserSentInvitations(),
        getInvitationStats(),
      ]);

      // Combine friends and invitations into one list
      const combinedContacts: CombinedContact[] = [
        // Add friends
        ...friends.map((friend) => ({
          id: friend.id,
          name: friend.fullName,
          email: friend.email,
          avatarUrl: friend.avatarUrl,
          status: 'active' as const,
          addedAt: friend.addedAt,
          type: 'friend' as const,
        })),
        // Add pending invitations
        ...sentInvitations
          .filter((inv) => inv.status === 'pending')
          .map((inv) => ({
            id: inv.id,
            name: inv.email.split('@')[0], // Use email prefix as name
            email: inv.email,
            status: 'pending' as const,
            addedAt: inv.createdAt,
            type: 'invitation' as const,
          })),
      ];

      setContacts(combinedContacts);
      setStats({
        total: combinedContacts.length,
        active: friends.length,
        pending: sentInvitations.filter((inv) => inv.status === 'pending')
          .length,
        declined: sentInvitations.filter((inv) => inv.status === 'declined')
          .length,
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = selectedTab === 'all' || contact.status === selectedTab;

    return matchesSearch && matchesTab;
  });

  const handleRemoveContact = (contact: CombinedContact) => {
    const actionText =
      contact.type === 'friend' ? 'remove' : 'cancel invitation for';
    Alert.alert(
      contact.type === 'friend' ? 'Remove Friend' : 'Cancel Invitation',
      `Are you sure you want to ${actionText} ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: contact.type === 'friend' ? 'Remove' : 'Cancel Invitation',
          style: 'destructive',
          onPress: async () => {
            try {
              // For friends, you'd call a remove friend API
              // For invitations, you'd call a cancel invitation API
              // For now, just remove from local state
              setContacts(contacts.filter((c) => c.id !== contact.id));

              const successMessage =
                contact.type === 'friend'
                  ? `${contact.name} has been removed from your friends list.`
                  : `Invitation to ${contact.name} has been cancelled.`;

              Alert.alert('Success', successMessage);
            } catch (error) {
              console.error('Error removing contact:', error);
              Alert.alert(
                'Error',
                'Failed to remove contact. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleResendInvite = async (contact: CombinedContact) => {
    try {
      const result = await resendInvitation({
        email: contact.email,
      });

      if (result.success) {
        Alert.alert('Invitation Sent', `Invitation resent to ${contact.name}.`);
      } else {
        Alert.alert('Error', result.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invite:', error);
      Alert.alert('Error', 'Failed to resend invitation. Please try again.');
    }
  };

  const getStatusBadge = (status: CombinedContact['status']) => {
    switch (status) {
      case 'active':
        return { text: 'Active', color: '#10B981', bgColor: '#ECFDF5' };
      case 'pending':
        return { text: 'Pending', color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'declined':
        return { text: 'Declined', color: '#6B7280', bgColor: '#F3F4F6' };
      default:
        return { text: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Friends</Text>
          <Text style={styles.subtitle}>
            {stats.total} contact{stats.total !== 1 ? 's' : ''} • {stats.active}{' '}
            active
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.declined}</Text>
            <Text style={styles.statLabel}>Declined</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search friends..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { key: 'all', label: 'All' },
            { key: 'confirmed', label: 'Active' },
            { key: 'pending', label: 'Pending' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Friends List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Invite friends to start splitting expenses together!'}
              </Text>
            </View>
          ) : (
            filteredContacts.map((contact) => {
              const statusBadge = getStatusBadge(contact.status);
              return (
                <View key={contact.id} style={styles.friendCard}>
                  <Avatar
                    imageUrl={contact.avatarUrl}
                    name={contact.name}
                    size={50}
                  />

                  <View style={styles.friendInfo}>
                    <View style={styles.friendHeader}>
                      <Text style={styles.friendName}>{contact.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusBadge.bgColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusBadge.color },
                          ]}
                        >
                          {statusBadge.text}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.friendEmail}>{contact.email}</Text>

                    <View style={styles.friendMeta}>
                      <Text style={styles.metaText}>
                        Added {formatDate(contact.addedAt)}
                      </Text>
                      {contact.totalExpenses && contact.totalExpenses > 0 && (
                        <Text style={styles.metaText}>
                          • ${contact.totalExpenses.toFixed(2)} shared
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.friendActions}>
                    {contact.status === 'active' && (
                      <>
                        <TouchableOpacity
                          style={styles.chatButton}
                          onPress={() => {
                            onClose();
                            router.push({
                              pathname: '/chat',
                              params: {
                                friendId: contact.id,
                                friendName: contact.name,
                              },
                            });
                          }}
                        >
                          <MessageCircle size={16} color="#10B981" />
                          <Text style={styles.chatButtonText}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.requestMoneyButton}
                          onPress={() => {
                            onClose();
                            router.push({
                              pathname: '/chat',
                              params: {
                                friendId: contact.id,
                                friendName: contact.name,
                                action: 'request-money',
                              },
                            });
                          }}
                        >
                          <DollarSign size={16} color="#F59E0B" />
                          <Text style={styles.requestMoneyButtonText}>
                            Request
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        const actions = [];

                        if (contact.status === 'active') {
                          actions.push({
                            text: 'Message',
                            onPress: () => {
                              onClose();
                              router.push({
                                pathname: '/chat',
                                params: {
                                  friendId: contact.id,
                                  friendName: contact.name,
                                },
                              });
                            },
                          });
                        }

                        if (contact.status === 'pending') {
                          actions.push({
                            text: 'Resend Invite',
                            onPress: () => handleResendInvite(contact),
                          });
                        }

                        actions.push({
                          text:
                            contact.type === 'friend'
                              ? 'Remove Friend'
                              : 'Cancel Invitation',
                          style: 'destructive' as const,
                          onPress: () => handleRemoveContact(contact),
                        });

                        actions.push({
                          text: 'Cancel',
                          style: 'cancel' as const,
                        });

                        Alert.alert(
                          'Contact Actions',
                          `What would you like to do with ${contact.name}?`,
                          actions
                        );
                      }}
                    >
                      <MoreVertical size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  friendEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  chatButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  requestMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  requestMoneyButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ManageFriendsModal;
