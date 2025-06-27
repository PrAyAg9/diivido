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
import { Search, Filter, Calendar, DollarSign, Users, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserExpenses } from '@/services/expenses-api';
import { getUserPayments } from '@/services/payments-api';
import { convertAndFormatAmount } from '@/utils/currency';

interface Activity {
  id: string;
  type: 'expense' | 'payment';
  title: string;
  group: string;
  groupId: string;
  amount: number;
  formattedAmount?: string;
  paidBy: string;
  paidById: string;
  date: string;
  time: string;
  avatar: string;
  participants: number;
  yourShare: number;
  formattedYourShare?: string;
  category: string;
  createdAt: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'expense':
      return { icon: ArrowUpRight, color: '#EF4444', bgColor: '#FEE2E2' };
    case 'payment':
      return { icon: ArrowDownLeft, color: '#10B981', bgColor: '#DCFCE7' };
    default:
      return { icon: DollarSign, color: '#6B7280', bgColor: '#F3F4F6' };
  }
};

const getActivityDescription = (activity: any) => {
  switch (activity.type) {
    case 'expense':
      return `${activity.paidBy} paid • Your share: $${activity.yourShare.toFixed(2)}`;
    case 'payment':
      return `You received payment`;
    case 'settlement':
      return `You settled up`;
    default:
      return activity.paidBy;
  }
};

const groupActivitiesByDate = (activities: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  
  activities.forEach(activity => {
    const date = activity.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(activity);
  });
  
  return grouped;
};

const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export default function ActivityScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch expenses and payments in parallel
      const [expensesResponse, paymentsResponse] = await Promise.all([
        getUserExpenses().catch(() => ({ data: [] })),
        getUserPayments().catch(() => ({ data: [] }))
      ]);

      const expenses = expensesResponse.data || [];
      const payments = paymentsResponse.data || [];

      // Transform expenses to activities
      const expenseActivities: Activity[] = expenses.map((expense: any) => ({
        id: `expense_${expense.id}`,
        type: 'expense' as const,
        title: expense.title || 'Untitled Expense',
        group: expense.group?.name || 'Unknown Group',
        groupId: expense.groupId || expense.group?.id || '',
        amount: expense.amount || 0,
        paidBy: expense.paidBy?.fullName || expense.paidByName || 'Unknown',
        paidById: expense.paidBy?.id || expense.paidById || '',
        date: expense.createdAt ? new Date(expense.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: getTimeAgo(expense.createdAt),
        avatar: expense.paidBy?.avatarUrl || expense.paidByAvatar || 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        participants: expense.participants?.length || expense.participantCount || 1,
        yourShare: expense.yourShare || 0,
        category: expense.category || 'Other',
        createdAt: expense.createdAt || new Date().toISOString(),
      }));

      // Transform payments to activities
      const paymentActivities: Activity[] = payments.map((payment: any) => ({
        id: `payment_${payment.id}`,
        type: 'payment' as const,
        title: `Payment ${payment.fromUserId === user.id ? 'to' : 'from'} ${payment.fromUserId === user.id ? payment.toUser?.fullName : payment.fromUser?.fullName}`,
        group: payment.group?.name || 'Direct Payment',
        groupId: payment.groupId || '',
        amount: payment.amount || 0,
        paidBy: payment.fromUserId === user.id ? 'You' : (payment.fromUser?.fullName || 'Unknown'),
        paidById: payment.fromUserId || '',
        date: payment.createdAt ? new Date(payment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: getTimeAgo(payment.createdAt),
        avatar: payment.fromUserId === user.id ? (payment.toUser?.avatarUrl || '') : (payment.fromUser?.avatarUrl || ''),
        participants: 2,
        yourShare: payment.fromUserId === user.id ? -payment.amount : payment.amount,
        category: 'Payment',
        createdAt: payment.createdAt || new Date().toISOString(),
      }));

      // Combine and sort by date
      const allActivities = [...expenseActivities, ...paymentActivities]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [user]);

  // Helper function to get time ago
  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.group.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || activity.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  const filters = [
    { key: 'all', label: 'All', count: activities.length },
    { key: 'expense', label: 'Expenses', count: activities.filter(a => a.type === 'expense').length },
    { key: 'payment', label: 'Payments', count: activities.filter(a => a.type === 'payment').length },
  ];

  const totalExpenses = activities.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.yourShare, 0);
  const totalReceived = activities.filter(a => a.type === 'payment' && a.yourShare > 0).reduce((sum, a) => sum + a.yourShare, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Track all your transactions</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <TrendingUp size={20} color="#10B981" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryAmount}>+${totalReceived.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Received</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <TrendingDown size={20} color="#EF4444" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>-${totalExpenses.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Your share</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.key && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
              <View style={[
                styles.filterCount,
                selectedFilter === filter.key && styles.activeFilterCount
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === filter.key && styles.activeFilterCountText
                ]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.keys(groupedActivities).length > 0 ? (
          Object.keys(groupedActivities)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((date) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
                {groupedActivities[date].map((activity) => {
                  const activityStyle = getActivityIcon(activity.type);
                  const IconComponent = activityStyle.icon;
                  
                  return (
                    <TouchableOpacity key={activity.id} style={styles.activityCard}>
                      <View style={[styles.activityIconContainer, { backgroundColor: activityStyle.bgColor }]}>
                        <IconComponent size={20} color={activityStyle.color} />
                      </View>
                      
                      <Image source={{ uri: activity.avatar }} style={styles.activityAvatar} />
                      
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
                        <Text style={styles.activityGroup}>{activity.group}</Text>
                        <Text style={styles.activityDescription}>
                          {getActivityDescription(activity)}
                        </Text>
                        <View style={styles.activityMeta}>
                          <Text style={styles.activityCategory}>{activity.category}</Text>
                          {activity.participants > 1 && (
                            <>
                              <Text style={styles.metaDivider}>•</Text>
                              <Users size={12} color="#9CA3AF" />
                              <Text style={styles.activityParticipants}>{activity.participants}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.activityAmountContainer}>
                        <Text style={[
                          styles.amount,
                          { color: activity.type === 'payment' ? '#10B981' : '#111827' }
                        ]} numberOfLines={1} ellipsizeMode='tail'>
                          {activity.type === 'payment' ? '+' : ''}${activity.amount.toFixed(2)}
                        </Text>
                        {activity.type === 'expense' && (
                          <Text style={styles.yourShare}>
                            You: ${activity.yourShare.toFixed(2)}
                          </Text>
                        )}
                        <Text style={styles.activityTime}>{activity.time}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <DollarSign size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No activities found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Your transaction history will appear here'
              }
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  // FIX: Wrapper for the filters scrollview to control its height
  filtersWrapper: {
    height: 45, // Set a fixed height for the filter area
    marginBottom: 24,
  },
  filtersContainer: {
    paddingHorizontal: 24,
  },
  // FIX: Made filter tabs more compact
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterTab: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginRight: 6,
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
    marginRight: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  activityGroup: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  metaDivider: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  activityParticipants: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  // FIX: Wrapper to contain the amount text
  activityAmountContainer: {
    alignItems: 'flex-end',
    flexShrink: 1, // Allow this container to shrink
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  yourShare: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});
