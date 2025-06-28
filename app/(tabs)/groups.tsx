import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Search,
  Users,
  DollarSign,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { groupsApi } from '@/services/api';
import { formatCurrency, type Currency } from '@/utils/currency';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Member {
  userId: string;
  role: string;
  joinedAt: string;
  _id: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  members: Member[]; // Change this from 'number' to 'Member[]'
  balance: number;
  totalExpenses: number;
  lastActivity: string;
}

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState<Currency>('INR');

  const fetchGroups = async () => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      // Get user's groups
      const response = await groupsApi.getGroups();

      if (!response.data || response.data.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Groups data should already include balance info and stats from the backend
      setGroups(response.data);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserCurrency = async () => {
    try {
      const currency = await AsyncStorage.getItem('userCurrency');
      if (currency && (currency === 'INR' || currency === 'USD' || currency === 'EUR')) {
        setUserCurrency(currency as Currency);
      }
    } catch (error) {
      console.error('Error loading user currency:', error);
    }
  };

  useEffect(() => {
    loadUserCurrency();
    fetchGroups();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOwed = groups.reduce(
    (sum, group) => sum + Math.max(0, -group.balance),
    0
  );
  const totalOwedToYou = groups.reduce(
    (sum, group) => sum + Math.max(0, group.balance),
    0
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create-group')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>-{formatCurrency(totalOwed, userCurrency)}</Text>
          <Text style={styles.summaryLabel}>You owe in total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
            +{formatCurrency(totalOwedToYou, userCurrency)}
          </Text>
          <Text style={styles.summaryLabel}>Owed to you</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredGroups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => {
              console.log(
                'Navigating to group details for group ID:',
                group.id
              );
              router.push(`/group-details?id=${group.id}`);
            }}
          >
            <Image
              source={{
                uri:
                  group.avatarUrl ||
                  'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
              }}
              style={styles.groupAvatar}
            />

            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>
                {group.description || 'No description'}
              </Text>

              <View style={styles.groupMeta}>
                <View style={styles.metaItem}>
                  <Users size={14} color="#9CA3AF" />
                  {/* FIX 2: Use .length to get the count of members */}
                  <Text style={styles.metaText}>
                    {(group.members ?? []).length} members
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <DollarSign size={14} color="#9CA3AF" />
                  <Text style={styles.metaText}>
                    {formatCurrency(group.totalExpenses ?? 0, userCurrency)}
                  </Text>
                </View>
              </View>

              <Text style={styles.lastActivity}>
                Last activity: {group.lastActivity}
              </Text>
            </View>

            <View style={styles.balanceContainer}>
              <Text
                style={[
                  styles.balance,
                  { color: (group.balance ?? 0) >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {(group.balance ?? 0) >= 0 ? '+' : ''}{formatCurrency(Math.abs(group.balance ?? 0), userCurrency)}
              </Text>
              <Text style={styles.balanceLabel}>
                {(group.balance ?? 0) >= 0 ? 'You get back' : 'You owe'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredGroups.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Users size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first group to start splitting expenses'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/create-group')}
              >
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  lastActivity: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
