import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Check,
  X,
  Users,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { friendsApi } from '@/services/friends-api';
import CustomHeader from '@/components/CustomHeader';

interface Friend {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: 'accepted' | 'pending_sent' | 'pending_received';
}

export default function ManageFriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsApi.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
      // Fallback to mock data for development
      setFriends([
        {
          id: '1',
          fullName: 'John Doe',
          email: 'john@example.com',
          avatarUrl:
            'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
          status: 'accepted',
        },
        {
          id: '2',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          avatarUrl: null,
          status: 'pending_sent',
        },
        {
          id: '3',
          fullName: 'Bob Wilson',
          email: 'bob@example.com',
          avatarUrl: null,
          status: 'pending_received',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    try {
      await friendsApi.acceptFriendRequest(friendId);

      setFriends((prev) =>
        prev.map((friend) =>
          friend.id === friendId
            ? { ...friend, status: 'accepted' as const }
            : friend
        )
      );

      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (friendId: string) => {
    try {
      await friendsApi.rejectFriendRequest(friendId);

      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));

      Alert.alert('Success', 'Friend request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsApi.removeFriend(friendId);

              setFriends((prev) =>
                prev.filter((friend) => friend.id !== friendId)
              );

              Alert.alert('Success', 'Friend removed');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const pendingReceived = friends.filter(
    (f) => f.status === 'pending_received'
  );
  const pendingSent = friends.filter((f) => f.status === 'pending_sent');

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Manage Friends"
          leftComponent={
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#000000" />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Manage Friends"
        leftComponent={
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Friend Requests */}
        {pendingReceived.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            {pendingReceived.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <Image
                    source={{
                      uri:
                        friend.avatarUrl ||
                        'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friend.fullName}</Text>
                    <Text style={styles.friendEmail}>{friend.email}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(friend.id)}
                  >
                    <Check size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(friend.id)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {pendingSent.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <Image
                    source={{
                      uri:
                        friend.avatarUrl ||
                        'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friend.fullName}</Text>
                    <Text style={styles.friendEmail}>{friend.email}</Text>
                  </View>
                </View>
                <View style={styles.statusContainer}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Friends */}
        {acceptedFriends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Friends ({acceptedFriends.length})
            </Text>
            {acceptedFriends.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <Image
                    source={{
                      uri:
                        friend.avatarUrl ||
                        'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friend.fullName}</Text>
                    <Text style={styles.friendEmail}>{friend.email}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFriend(friend.id, friend.fullName)}
                >
                  <UserMinus size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {friends.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyDescription}>
              Start by inviting friends to join Divido
            </Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => router.push('/invite-friends')}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 32,
    height: 32,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
  },
  pendingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
