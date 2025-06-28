import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  TrendingUp,
  Bell,
  Search,
  ChevronRight,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserBalances } from '@/services/dashboard-api';
import { getUserExpenses } from '@/services/expenses-api';
import { getUserPayments } from '@/services/payments-api';
import {
  convertAndFormatAmount,
  getUserCurrency,
  formatCurrency,
  type Currency,
} from '@/utils/currency';

const { width } = Dimensions.get('window');

interface BalanceData {
  netBalance: number;
  totalOwed: number;
  totalOwedToYou: number;
  usersYouOwe: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    amount: number;
    formattedAmount?: string;
  }>;
  usersWhoOweYou: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    amount: number;
    formattedAmount?: string;
  }>;
}

interface RecentActivity {
  id: string;
  title: string;
  group: string;
  amount: number;
  youOwe: number;
  formattedYouOwe?: string;
  date: string;
  avatar: string;
  category: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState<Currency>('INR');
  const [formattedAmounts, setFormattedAmounts] = useState({
    netBalance: '₹0.00',
    totalOwed: '₹0.00',
    totalOwedToYou: '₹0.00',
  });

  const updateFormattedAmounts = async (balances: BalanceData) => {
    try {
      const netBalanceFormatted = await convertAndFormatAmount(
        Math.abs(balances.netBalance)
      );
      const totalOwedFormatted = await convertAndFormatAmount(
        balances.totalOwed
      );
      const totalOwedToYouFormatted = await convertAndFormatAmount(
        balances.totalOwedToYou
      );

      setFormattedAmounts({
        netBalance: netBalanceFormatted,
        totalOwed: totalOwedFormatted,
        totalOwedToYou: totalOwedToYouFormatted,
      });

      // Format user amounts
      const formattedUsersYouOwe = await Promise.all(
        balances.usersYouOwe.map(async (user) => ({
          ...user,
          formattedAmount: await convertAndFormatAmount(user.amount),
        }))
      );

      const formattedUsersWhoOweYou = await Promise.all(
        balances.usersWhoOweYou.map(async (user) => ({
          ...user,
          formattedAmount: await convertAndFormatAmount(user.amount),
        }))
      );

      // Update balance data with formatted amounts
      setBalanceData({
        ...balances,
        usersYouOwe: formattedUsersYouOwe,
        usersWhoOweYou: formattedUsersWhoOweYou,
      });
    } catch (error) {
      console.error('Error formatting amounts:', error);
    }
  };

  const loadUserCurrency = async () => {
    try {
      const currency = await getUserCurrency();
      setUserCurrency(currency);
    } catch (error) {
      console.error('Error loading user currency:', error);
    }
  };

  const loadData = async () => {
    try {
      setError(null);

      // Fetch user balances
      const balancesResponse = await getUserBalances();

      // Fetch user activities using same logic as activities page
      const [expensesResponse, paymentsResponse] = await Promise.all([
        getUserExpenses().catch(() => ({ data: [] })),
        getUserPayments().catch(() => ({ data: [] })),
      ]);

      const expenses = expensesResponse.data || [];
      const payments = paymentsResponse.data || [];

      // Transform expenses to activities
      const expenseActivities = expenses.map((expense: any) => ({
        id: `expense_${expense.id}`,
        title: expense.title || 'Untitled Expense',
        group: expense.group?.name || 'Unknown Group',
        amount: expense.amount || 0,
        youOwe: expense.yourShare || 0,
        date: getTimeAgo(expense.createdAt),
        avatar:
          expense.paidBy?.avatarUrl ||
          expense.paidByAvatar ||
          'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        category: expense.category || 'Other',
        createdAt: expense.createdAt || new Date().toISOString(),
      }));

      // Transform payments to activities
      const paymentActivities = payments.map((payment: any) => ({
        id: `payment_${payment.id}`,
        title: `Payment ${payment.fromUserId === user?.id ? 'to' : 'from'} ${
          payment.fromUserId === user?.id
            ? payment.toUser?.fullName
            : payment.fromUser?.fullName
        }`,
        group: payment.group?.name || 'Direct Payment',
        amount: payment.amount || 0,
        youOwe:
          payment.fromUserId === user?.id ? -payment.amount : payment.amount,
        date: getTimeAgo(payment.createdAt),
        avatar:
          payment.fromUserId === user?.id
            ? payment.toUser?.avatarUrl || ''
            : payment.fromUser?.avatarUrl || '',
        category: 'Payment',
        createdAt: payment.createdAt || new Date().toISOString(),
      }));

      // Combine, sort by date, and take the 5 most recent
      const allActivities = [...expenseActivities, ...paymentActivities]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      // Format amounts for activities
      const formattedActivities = await Promise.all(
        allActivities.map(async (activity) => ({
          ...activity,
          formattedYouOwe: await formatActivityAmount(activity.youOwe),
        }))
      );

      // Map API responses to our state format
      const balancesData = balancesResponse.data;
      setRecentActivity(formattedActivities);

      // Update formatted amounts (this will also update balanceData)
      updateFormattedAmounts(balancesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get time ago (same as activities page)
  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const formatActivityAmount = async (amount: number): Promise<string> => {
    const formattedAmount = await convertAndFormatAmount(Math.abs(amount));
    return `${amount > 0 ? '-' : '+'}${formattedAmount}`;
  };

  useEffect(() => {
    if (user) {
      loadUserCurrency();
      loadData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Search size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Bell size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-expense')}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Summary Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Your Net Balance</Text>
            <View style={styles.balanceTrend}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.trendText}>Updated</Text>
            </View>
          </View>
          <Text
            style={[
              styles.totalBalance,
              {
                color:
                  (balanceData?.netBalance || 0) >= 0 ? '#10B981' : '#EF4444',
              },
            ]}
          >
            {(balanceData?.netBalance || 0) >= 0 ? '+' : ''}
            {formattedAmounts.netBalance}
          </Text>
          <Text style={styles.balanceSubtitle}>
            {(balanceData?.netBalance || 0) >= 0
              ? 'You are owed overall'
              : 'You owe overall'}
          </Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIcon}>
                <ArrowUpRight size={16} color="#EF4444" />
              </View>
              <View style={styles.balanceDetails}>
                <Text style={styles.balanceAmount}>
                  {formattedAmounts.totalOwed}
                </Text>
                <Text style={styles.balanceLabel}>You owe</Text>
              </View>
            </View>

            <View style={styles.balanceItem}>
              <View
                style={[styles.balanceIcon, { backgroundColor: '#DCFCE7' }]}
              >
                <ArrowDownLeft size={16} color="#10B981" />
              </View>
              <View style={styles.balanceDetails}>
                <Text style={styles.balanceAmount}>
                  {formattedAmounts.totalOwedToYou}
                </Text>
                <Text style={styles.balanceLabel}>Owed to you</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Users You Owe */}
        {balanceData && balanceData.usersYouOwe.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>You Owe</Text>
              <Text style={styles.sectionCount}>
                {balanceData.usersYouOwe.length}
              </Text>
            </View>

            {balanceData.usersYouOwe.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri:
                      user.avatarUrl ||
                      'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
                  }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userNameText}>{user.name}</Text>
                  <Text style={styles.userSubtext}>Tap to settle up</Text>
                </View>
                <View style={styles.userAmount}>
                  <Text style={styles.amountOwed}>
                    -{user.formattedAmount || formatCurrency(user.amount, userCurrency)}
                  </Text>
                  <ArrowUpRight size={16} color="#EF4444" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Users Who Owe You */}
        {balanceData && balanceData.usersWhoOweYou.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Owes You</Text>
              <Text style={styles.sectionCount}>
                {balanceData.usersWhoOweYou.length}
              </Text>
            </View>

            {balanceData.usersWhoOweYou.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri:
                      user.avatarUrl ||
                      'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
                  }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userNameText}>{user.name}</Text>
                  <Text style={styles.userSubtext}>Tap to remind</Text>
                </View>
                <View style={styles.userAmount}>
                  <Text style={styles.amountOwed}>
                    +{user.formattedAmount || formatCurrency(user.amount, userCurrency)}
                  </Text>
                  <ArrowDownLeft size={16} color="#10B981" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/(tabs)/activity')}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {recentActivity.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: activity.avatar }}
                  style={styles.activityAvatar}
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtext}>
                    {activity.group} • {activity.date}
                  </Text>
                </View>
                <View style={styles.activityAmount}>
                  <Text
                    style={[
                      styles.activityAmountText,
                      { color: activity.youOwe > 0 ? '#EF4444' : '#10B981' },
                    ]}
                  >
                    {activity.formattedYouOwe ||
                      `${activity.youOwe > 0 ? '-' : '+'}${formatCurrency(Math.abs(activity.youOwe), userCurrency)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Group Button */}
        <TouchableOpacity
          style={styles.createGroupButton}
          activeOpacity={0.8}
          onPress={() => router.push('/create-group')}
        >
          <View style={styles.createGroupIcon}>
            <Users size={20} color="#10B981" />
          </View>
          <View style={styles.createGroupContent}>
            <Text style={styles.createGroupTitle}>Start a New Group</Text>
            <Text style={styles.createGroupText}>
              Create a group to split expenses
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addButton: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  balanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  totalBalance: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceDetails: {
    flex: 1,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  userAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountOwed: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginRight: 8,
  },
  amountOwedToYou: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expenseGroup: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  expenseYouOwe: {
    fontSize: 12,
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
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
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  createGroupButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createGroupContent: {
    flex: 1,
  },
  createGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  createGroupText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  viewAllButton: {
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
