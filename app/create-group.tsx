import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Users, Mail, Plus, X } from 'lucide-react-native';
import { groupsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers } from '@/services/user-api';
import { createGroup } from '@/services/groups-api';
import {
  sendUserInvitation,
  checkEmailExists,
} from '@/services/invitations-api';

const mockContacts = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@email.com',
    avatar:
      'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    avatar:
      'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
  },
  {
    id: 3,
    name: 'Mike Wilson',
    email: 'mike@email.com',
    avatar:
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@email.com',
    avatar:
      'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david@email.com',
    avatar:
      'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
  },
];

// Define types for user data
interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
}

// Default avatar for users without one
const DEFAULT_AVATAR = 'https://via.placeholder.com/50';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const [invitingEmail, setInvitingEmail] = useState(false);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await getAllUsers();
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleAddByEmail = async () => {
    if (!emailInput.trim()) return;

    const email = emailInput.trim().toLowerCase();

    // Check if email is already in pending invites
    if (pendingInvites.includes(email)) {
      Alert.alert('Already Invited', 'This user has already been invited.');
      return;
    }

    setInvitingEmail(true);

    try {
      // First check if user already exists in our system
      const userWithEmail = users.find(
        (user) => user.email.toLowerCase() === email
      );

      if (userWithEmail) {
        // If user exists, add them directly to selected members
        if (!selectedMembers.includes(userWithEmail.id)) {
          setSelectedMembers([...selectedMembers, userWithEmail.id]);
          Alert.alert(
            'Success',
            `${userWithEmail.fullName} has been added to the group.`
          );
        } else {
          Alert.alert('Already Added', 'This user is already in the group.');
        }
        setEmailInput('');
      } else {
        // User doesn't exist - send an invitation
        try {
          await sendUserInvitation(email, undefined, groupName || 'New Group');
          setPendingInvites([...pendingInvites, email]);
          Alert.alert(
            'Invitation Sent',
            `An invitation has been sent to ${email}. They will be added to the group once they accept and join the app.`
          );
          setEmailInput('');
        } catch (error) {
          console.error('Error sending invitation:', error);
          Alert.alert(
            'Error',
            'Failed to send invitation. Please check the email address and try again.'
          );
        }
      }
    } catch (error) {
      console.error('Error in handleAddByEmail:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setInvitingEmail(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setIsLoading(true);

      // Create group with selected members
      const groupData = {
        name: groupName,
        description: groupDescription,
        members: selectedMembers,
      };

      console.log('Creating group with data:', groupData);

      const response = await createGroup(groupData);

      if (response.data) {
        console.log('Group created successfully:', response.data);
        Alert.alert('Success', 'Group created successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/groups') },
        ]);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <TouchableOpacity
          style={[
            styles.createButtonSmall,
            (!groupName.trim() || isLoading || selectedMembers.length === 0) &&
              styles.disabledButton,
          ]}
          onPress={handleCreateGroup}
          disabled={
            !groupName.trim() || isLoading || selectedMembers.length === 0
          }
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Group Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoButton}>
            <Camera size={32} color="#9CA3AF" />
            <Text style={styles.photoButtonText}>Add Group Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Group Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.textInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="What's this group for?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected Members ({selectedMembers.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectedMembersScroll}
            >
              {selectedMembers.map((memberId) => {
                const member = users.find((u) => u.id === memberId);
                if (!member) return null;

                return (
                  <View key={memberId} style={styles.selectedMemberCard}>
                    <Image
                      source={{ uri: member.avatarUrl || DEFAULT_AVATAR }}
                      style={styles.selectedMemberAvatar}
                    />
                    <TouchableOpacity
                      style={styles.removeMemberButton}
                      onPress={() => handleAddMember(memberId)}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.selectedMemberName}>
                      {member.fullName.split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Invitations ({pendingInvites.length})
            </Text>
            <View style={styles.pendingInvitesList}>
              {pendingInvites.map((email, index) => (
                <View key={email} style={styles.pendingInviteItem}>
                  <View style={styles.pendingInviteInfo}>
                    <Mail size={16} color="#6B7280" />
                    <Text style={styles.pendingInviteEmail}>{email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelInviteButton}
                    onPress={() =>
                      setPendingInvites(
                        pendingInvites.filter((e) => e !== email)
                      )
                    }
                  >
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Members</Text>

          {/* Invite by Email */}
          <View style={styles.emailInviteSection}>
            <View style={styles.emailInputContainer}>
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.inviteButton,
                  (!emailInput.trim() || invitingEmail) &&
                    styles.disabledButton,
                ]}
                onPress={handleAddByEmail}
                disabled={!emailInput.trim() || invitingEmail}
              >
                {invitingEmail ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.inviteButtonText,
                      (!emailInput.trim() || invitingEmail) &&
                        styles.disabledButtonText,
                    ]}
                  >
                    Invite
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Friends Button */}
          <TouchableOpacity
            style={styles.addFriendsButton}
            onPress={() => router.push('/find-friends')}
          >
            <Users size={20} color="#3B82F6" />
            <Text style={styles.addFriendsText}>Search & Add Friends</Text>
          </TouchableOpacity>

          {/* Search Contacts */}
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Contact List */}
          <View style={styles.contactsList}>
            {loadingUsers ? (
              <ActivityIndicator
                size="large"
                color="#10B981"
                style={{ marginTop: 20 }}
              />
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.noResultsText}>No users found</Text>
            ) : (
              filteredUsers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.contactCard}
                  onPress={() => handleAddMember(user.id)}
                >
                  <Image
                    source={{ uri: user.avatarUrl || DEFAULT_AVATAR }}
                    style={styles.contactAvatar}
                  />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{user.fullName}</Text>
                    <Text style={styles.contactEmail}>{user.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkBox,
                      selectedMembers.includes(user.id) && styles.checkedBox,
                    ]}
                  >
                    {selectedMembers.includes(user.id) && (
                      <Plus
                        size={16}
                        color="#FFFFFF"
                        style={{ transform: [{ rotate: '45deg' }] }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
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
    alignItems: 'center',
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
    width: '100%',
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
  createButtonSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  photoSection: {
    width: '90%',
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
    marginTop: 12,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    width: '100%',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectedMembersScroll: {
    marginBottom: 16,
  },
  selectedMemberCard: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    width: 60,
  },
  selectedMemberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  removeMemberButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMemberName: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  emailInviteSection: {
    marginBottom: 16,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  inviteButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  contactsList: {
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  bottomActions: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '90%',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  pendingInvitesList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  pendingInviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingInviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingInviteEmail: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  cancelInviteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  addFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addFriendsText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
});
