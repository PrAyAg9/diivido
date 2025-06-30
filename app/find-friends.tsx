import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  UserPlus,
  User,
  Check,
  X,
  Mail,
} from 'lucide-react-native';
import CustomHeader from '@/components/CustomHeader';
import { useAuth } from '@/contexts/AuthContext';
import { friendsApi } from '@/services/friends-api';

interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  isFriend: boolean;
  friendRequestSent: boolean;
  friendRequestReceived: boolean;
}

export default function FindFriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty Search', 'Please enter an email address to search.');
      return;
    }

    if (!searchQuery.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      // Use the actual friends API to search for users
      const response = await friendsApi.searchUsers(searchQuery.trim());

      // Transform API response to match our interface
      const results: UserSearchResult[] = response.data.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        isFriend: false, // TODO: Get actual friend status from API
        friendRequestSent: false, // TODO: Get actual request status from API
        friendRequestReceived: false, // TODO: Get actual request status from API
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for users. Please try again.'
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      // Use the actual friends API to send a friend request
      await friendsApi.sendFriendRequest(userId);

      // Update the search results to reflect the sent request
      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, friendRequestSent: true } : user
        )
      );

      Alert.alert('Success', 'Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

  const renderUserResult = (user: UserSearchResult) => (
    <View key={user.id} style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {user.avatarUrl ? (
            <Text style={styles.avatarText}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <User size={24} color="#6B7280" />
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {user.isFriend ? (
          <View style={styles.friendBadge}>
            <Check size={16} color="#10B981" />
            <Text style={styles.friendText}>Friends</Text>
          </View>
        ) : user.friendRequestSent ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Request Sent</Text>
          </View>
        ) : user.friendRequestReceived ? (
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => sendFriendRequest(user.id)}
          >
            <UserPlus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Find Friends"
        leftComponent={
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchSection}>
          <Text style={styles.title}>Find Friends by Email</Text>
          <Text style={styles.subtitle}>
            Search for friends using their email address to connect and split
            expenses together.
          </Text>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Mail size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter email address (e.g., john@example.com)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                searching && styles.searchButtonDisabled,
              ]}
              onPress={searchUsers}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Search size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.resultsSection}
          showsVerticalScrollIndicator={false}
        >
          {searching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Searching for users...</Text>
            </View>
          )}

          {!searching && hasSearched && searchResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <User size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>
                No user found with the email "{searchQuery}".{'\n'}
                Make sure they have signed up for the app.
              </Text>
            </View>
          )}

          {!searching && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              {searchResults.map(renderUserResult)}
            </View>
          )}

          {!hasSearched && !searching && (
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Enter the email address of the person you want to find
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  Tap search to find them in our user database
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Send a friend request to connect and split expenses
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  resultsSection: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
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
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionContainer: {
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  friendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  acceptButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    paddingTop: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});
