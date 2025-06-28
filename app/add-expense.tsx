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
  Dimensions,
  ActivityIndicator,
  Platform, // Make sure Platform is imported
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getUserCurrency, type Currency } from '@/utils/currency';
import { createExpense } from '@/services/expenses-api';
import { getUserGroups } from '@/services/groups-api';
import { API_URL } from '@/services/api';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'food', name: 'Food', icon: '🍽️', color: '#F59E0B' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { id: 'entertainment', name: 'Fun', icon: '🎬', color: '#8B5CF6' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { id: 'utilities', name: 'Bills', icon: '💡', color: '#10B981' },
  { id: 'health', name: 'Health', icon: '🏥', color: '#EF4444' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#06B6D4' },
  { id: 'other', name: 'Other', icon: '📝', color: '#6B7280' },
];

const splitTypes = [
  {
    id: 'equal',
    name: 'Equal Split',
    description: 'Split equally among all members',
  },
  {
    id: 'exact',
    name: 'Exact Amounts',
    description: 'Enter exact amounts for each person',
  },
  {
    id: 'percentage',
    name: 'By Percentage',
    description: 'Split by custom percentages',
  },
  { id: 'shares', name: 'By Shares', description: 'Split by number of shares' },
  {
    id: 'loser-pays-all',
    name: 'Loser Pays All',
    description: 'One random person pays the entire amount',
  },
];

interface Group {
  id: string;
  name: string;
  avatarUrl: string | null;
  members: GroupMember[];
}

interface GroupMember {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  isYou?: boolean;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState('equal');
  const [paidBy, setPaidBy] = useState<string>('');
  const [date, setDate] = useState(new Date());
  const [userCurrency, setUserCurrency] = useState<Currency>('INR');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      setError(null);
      const groupsResponse = await getUserGroups();
      const userGroups = groupsResponse.data;
      if (!userGroups || userGroups.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }
      const groupsWithMembers = await Promise.all(
        userGroups.map(async (group: any) => {
          if (!group.id) {
            console.error('Group is missing ID:', group);
            return null;
          }
          try {
            const groupResponse = await axios.get(
              `${API_URL}/groups/${group.id}`
            );
            const groupData = groupResponse.data;
            const members = groupData.members || [];
            const groupMembers: GroupMember[] = members.map((member: any) => ({
              id: member.id,
              fullName: member.fullName,
              avatarUrl: member.avatarUrl,
              isYou: member.id === user.id,
            }));
            return {
              id: group.id,
              name: group.name,
              avatarUrl: group.avatarUrl,
              members: groupMembers,
            };
          } catch (error) {
            console.error(
              `Error fetching details for group ${group.id}:`,
              error
            );
            return null;
          }
        })
      );
      const validGroups = groupsWithMembers.filter(
        (group) => group !== null
      ) as Group[];
      setGroups(validGroups);
      if (validGroups.length > 0) {
        const firstGroup = validGroups[0];
        setSelectedGroup(firstGroup.id);
        setSelectedMembers(firstGroup.members.map((m: GroupMember) => m.id));
        setPaidBy(user.id);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserCurrency = async () => {
      try {
        const currency = await getUserCurrency();
        setUserCurrency(currency);
      } catch (error) {
        console.error('Error loading user currency:', error);
      }
    };
    
    loadUserCurrency();
    fetchGroups();
  }, [user]);

  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    if (parts.length > 2) {
      return;
    }
    setAmount(cleanedText);
  };

  const handleSave = async () => {
    if (
      !amount ||
      parseFloat(amount) <= 0 ||
      !description ||
      !selectedGroup ||
      selectedMembers.length === 0
    ) {
      Alert.alert(
        'Invalid Input',
        'Please fill in all required fields and select at least one member.'
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const totalAmount = parseFloat(amount);
      let splits;
      let actualSplitType = splitType;

      if (splitType === 'loser-pays-all') {
        // Select a random person from selected members to pay the full amount
        const randomIndex = Math.floor(Math.random() * selectedMembers.length);
        const unluckyPerson = selectedMembers[randomIndex];

        splits = selectedMembers.map((memberId) => ({
          userId: memberId,
          amount: memberId === unluckyPerson ? totalAmount : 0,
          percentage: memberId === unluckyPerson ? 100 : 0,
          shares: memberId === unluckyPerson ? 1 : 0,
        }));

        actualSplitType = 'exact'; // Backend will handle it as exact amounts

        // Show who was selected to pay
        const unluckyMember = getCurrentGroupMembers().find(
          (m) => m.id === unluckyPerson
        );
        const memberName = unluckyMember?.isYou
          ? 'You'
          : unluckyMember?.fullName || 'Unknown';
        Alert.alert(
          'Random Selection',
          `${memberName} was randomly selected to pay the full amount!`
        );
      } else {
        // Regular equal split
        splits = selectedMembers.map((memberId) => {
          const splitAmount = totalAmount / selectedMembers.length;
          return {
            userId: memberId,
            amount: splitAmount,
            percentage: 100 / selectedMembers.length,
            shares: 1,
          };
        });
      }

      await createExpense({
        groupId: selectedGroup,
        title: description,
        amount: totalAmount,
        currency: 'INR',
        category: selectedCategory,
        splitType: actualSplitType as
          | 'equal'
          | 'exact'
          | 'percentage'
          | 'shares',
        splits: splits,
        notes:
          splitType === 'loser-pays-all'
            ? 'Random selection - loser pays all'
            : '',
        date: date.toISOString().split('T')[0],
      });

      // Direct redirect without alert for smoother UX
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(
        err.response?.data?.error || err.message || 'Failed to save expense'
      );
      Alert.alert(
        'Error',
        'Failed to save expense: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    const member = getCurrentGroupMembers().find((m) => m.id === memberId);
    if (member?.isYou) return;
    const isSelected = selectedMembers.includes(memberId);
    if (isSelected) {
      if (paidBy === memberId) {
        setPaidBy(user?.id || '');
      }
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const getCurrentGroupMembers = (): GroupMember[] => {
    const group = groups.find((g) => g.id === selectedGroup);
    return group?.members || [];
  };

  const getSelectedMembersData = (): GroupMember[] => {
    return getCurrentGroupMembers().filter((member) =>
      selectedMembers.includes(member.id)
    );
  };

  const calculateSplit = () => {
    if (!amount || selectedMembers.length === 0 || parseFloat(amount) <= 0)
      return 0;

    if (splitType === 'loser-pays-all') {
      return parseFloat(amount); // Show full amount for preview
    }

    return parseFloat(amount) / selectedMembers.length;
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setSelectedMembers(group.members.map((m: GroupMember) => m.id));
      setPaidBy(user?.id || '');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Groups Found</Text>
          <Text style={styles.emptyText}>
            You need to be a member of at least one group to add expenses.
          </Text>
          <TouchableOpacity
            style={styles.createGroupButton}
            onPress={() => router.push('/create-group')}
          >
            <Text style={styles.createGroupButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!amount || !description || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!amount || !description || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                (!amount || !description) && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#D1D5DB"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this expense for?"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id &&
                    styles.selectedCategoryCard,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory === category.id &&
                      styles.selectedCategoryName,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity style={styles.dateContainer}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group</Text>
          <View style={styles.groupsContainer}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupCard,
                  selectedGroup === group.id && styles.selectedGroupCard,
                ]}
                onPress={() => handleGroupChange(group.id)}
              >
                <Image
                  source={{
                    uri:
                      group.avatarUrl ||
                      'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
                  }}
                  style={styles.groupAvatar}
                />
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMembers}>
                    {(group.members ?? []).length} members
                  </Text>
                </View>
                {selectedGroup === group.id && (
                  <Check size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split with</Text>
          <View style={styles.membersGrid}>
            {getCurrentGroupMembers().map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberCard,
                  selectedMembers.includes(member.id) &&
                    styles.selectedMemberCard,
                  member.isYou && styles.youMemberCard,
                ]}
                onPress={() => toggleMemberSelection(member.id)}
                disabled={member.isYou}
              >
                <Image
                  source={{
                    uri:
                      member.avatarUrl ||
                      'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
                  }}
                  style={styles.memberAvatar}
                />
                <Text style={styles.memberName}>
                  {member.isYou ? 'You' : member.fullName || 'Unknown'}
                </Text>
                {selectedMembers.includes(member.id) && (
                  <View style={styles.checkIcon}>
                    <Check size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paid by</Text>
          <View style={styles.paidByContainer}>
            {getSelectedMembersData().map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.paidByCard,
                  paidBy === member.id && styles.selectedPaidByCard,
                ]}
                onPress={() => setPaidBy(member.id)}
              >
                <Image
                  source={{
                    uri:
                      member.avatarUrl ||
                      'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
                  }}
                  style={styles.paidByAvatar}
                />
                <Text style={styles.paidByName}>
                  {member.isYou ? 'You' : member.fullName || 'Unknown'}
                </Text>
                {paidBy === member.id && <Check size={16} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split type</Text>
          <View style={styles.splitTypesContainer}>
            {splitTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.splitTypeCard,
                  splitType === type.id && styles.selectedSplitTypeCard,
                ]}
                onPress={() => setSplitType(type.id)}
              >
                <View style={styles.splitTypeInfo}>
                  <Text style={styles.splitTypeName}>{type.name}</Text>
                  <Text style={styles.splitTypeDescription}>
                    {type.description}
                  </Text>
                </View>
                {splitType === type.id && <Check size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {amount && selectedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Split Preview</Text>
            <View style={styles.splitPreviewCard}>
              {splitType === 'loser-pays-all' ? (
                <View style={styles.loserPaysAllPreview}>
                  <Text style={styles.loserPaysAllText}>
                    🎲 One random person will pay the full amount: {formatCurrency(parseFloat(amount || '0'), userCurrency)}
                  </Text>
                  <Text style={styles.loserPaysAllSubtext}>
                    Selected from {selectedMembers.length} participant
                    {selectedMembers.length > 1 ? 's' : ''}
                  </Text>
                </View>
              ) : (
                getSelectedMembersData().map((member) => (
                  <View key={member.id} style={styles.splitPreviewItem}>
                    <Image
                      source={{
                        uri:
                          member.avatarUrl ||
                          'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
                      }}
                      style={styles.splitPreviewAvatar}
                    />
                    <Text style={styles.splitPreviewName}>
                      {member.isYou ? 'You' : member.fullName || 'Unknown'}
                    </Text>
                    <Text style={styles.splitPreviewAmount}>
                      {formatCurrency(calculateSplit() || 0, userCurrency)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.photoButton}>
            <Camera size={24} color="#6B7280" />
            <Text style={styles.photoButtonText}>Add Receipt Photo</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createGroupButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createGroupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  headerSpacer: {
    width: 40,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '90%',
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
    width: '90%',
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
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    width: '100%',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  categoryCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 64) / 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedCategoryCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: '#10B981',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  groupsContainer: {
    width: '100%',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    width: '100%',
  },
  selectedGroupCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 14,
    color: '#6B7280',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  memberCard: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: (width - 64) / 4,
    position: 'relative',
    marginBottom: 8,
  },
  selectedMemberCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  youMemberCard: {
    backgroundColor: '#E0F2F1',
    borderColor: '#10B981',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidByContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  paidByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  selectedPaidByCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  paidByAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  paidByName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 8,
  },
  splitTypesContainer: {
    width: '100%',
  },
  splitTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    width: '100%',
  },
  selectedSplitTypeCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  splitTypeInfo: {
    flex: 1,
  },
  splitTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  splitTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  splitPreviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  splitPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
  },
  splitPreviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
  },
  splitPreviewName: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  splitPreviewAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    width: '100%',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  loserPaysAllPreview: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  loserPaysAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 4,
  },
  loserPaysAllSubtext: {
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
});
