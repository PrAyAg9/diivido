import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Settings,
  Plus,
  Users,
  DollarSign,
  Calendar,
  MoveHorizontal as MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Shuffle,
  Target,
  ShoppingBag,
  Plane,
  Car,
  Coffee,
  Home,
  Heart,
  FileText,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getUserCurrency, type Currency } from '@/utils/currency';
import {
  getGroupDetails,
  getGroupExpenses,
  markSplitAsPaid,
  createPayment,
  getGroupPayments,
} from '@/services/group-details-api';
import {
  getGroupBalances,
  calculateSimplifiedDebts,
} from '@/services/group-balances-api';
import { budgetAPI, type BudgetStatus } from '@/services/budget-api';
import Avatar from '@/components/Avatar';

const { width } = Dimensions.get('window');

// Category icons mapping
const categoryIcons: { [key: string]: any } = {
  food: Coffee,
  transport: Car,
  entertainment: Heart,
  shopping: ShoppingBag,
  utilities: Home,
  health: Heart,
  travel: Plane,
  other: FileText,
};

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

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  members: GroupMember[];
  totalExpenses: number;
  yourBalance: number;
}

interface GroupMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  balance: number;
  isYou?: boolean;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  paid_by: string;
  payer_name: string;
  payer_avatar: string | null;
  participants: number;
  yourShare: number;
}

interface SimplifiedDebt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

interface CategorySpending {
  category: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
}

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { id } = params;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [simplifying, setSimplifying] = useState(false);
  const [userCurrency, setUserCurrency] = useState<Currency>('INR');
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);

  const loadUserCurrency = async () => {
    try {
      const currency = await getUserCurrency();
      setUserCurrency(currency);
    } catch (error) {
      console.error('Error loading user currency:', error);
    }
  };

  const fetchGroupDetails = async () => {
    if (!user) return;

    try {
      const groupId = Array.isArray(id) ? id[0] : id;
      if (!groupId) {
        console.error('No group ID provided');
        setLoading(false);
        return;
      }

      const [groupResponse, balancesResponse, expensesResponse] = await Promise.all([
        getGroupDetails(groupId),
        getGroupBalances(groupId),
        getGroupExpenses(groupId)
      ]);

      const groupData = groupResponse.data;
      const members = balancesResponse.data.members.map((member: any) => ({
        id: member.id,
        full_name: member.full_name,
        avatar_url: member.avatar_url,
        balance: member.balance,
        isYou: member.id === user.id,
      }));

      const totalExpenses = groupData.total_expenses || 0;
      const yourBalance = members.find((m: any) => m.isYou)?.balance || 0;

      setGroup({
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        avatar_url: groupData.avatar_url,
        created_by: groupData.created_by,
        members,
        totalExpenses,
        yourBalance,
      });

      const formattedExpenses: Expense[] = expensesResponse.data.map((expense: any) => ({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        created_at: expense.created_at,
        paid_by: expense.paid_by,
        payer_name: expense.payer_name || 'Unknown',
        payer_avatar: expense.payer_avatar,
        participants: expense.participants?.length || 0,
        yourShare: expense.your_share || 0,
      }));

      setExpenses(formattedExpenses);
    } catch (err) {
      console.error('Error fetching group details:', err);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetStatus = async () => {
    if (!group?.id) return;
    
    try {
      const response = await budgetAPI.getGroupBudgetStatus(group.id);
      setBudgetStatus(response.budgetStatus);
    } catch (error) {
      console.error('Error loading budget status:', error);
      setBudgetStatus(null);
    }
  };

  const calculateCategorySpending = () => {
    if (!expenses.length) {
      setCategorySpending([]);
      return;
    }

    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    expenses.forEach(expense => {
      const category = expense.category || 'other';
      const existing = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1
      });
    });

    const categorySpendingData = categories.map(cat => {
      const data = categoryMap.get(cat.id) || { amount: 0, count: 0 };
      return {
        category: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: data.amount,
        count: data.count
      };
    }).filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    setCategorySpending(categorySpendingData);
  };

  const handleSimplifyDebts = () => {
    if (!group || !group.members) {
      Alert.alert('Error', 'Group data not available.');
      return;
    }

    setSimplifying(true);
    try {
      const debts = calculateSimplifiedDebts(group.members);
      setSimplifiedDebts(debts);
      setShowSimplifyModal(true);
    } catch (error) {
      console.error('Error simplifying debts:', error);
      Alert.alert('Error', 'Failed to calculate simplified payments.');
    } finally {
      setSimplifying(false);
    }
  };

  const renderOverview = () => {
    if (!group) return null;

    return (
      <View style={styles.overviewContainer}>
        {/* Category Spending Breakdown */}
        {categorySpending.length > 0 && (
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
            </View>
            
            <View style={styles.categoryList}>
              {categorySpending.slice(0, 6).map((category, index) => {
                const totalAmount = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
                const percentage = totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;
                
                return (
                  <View key={category.category} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <View style={styles.categoryDetails}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryCount}>{category.count} expenses</Text>
                      </View>
                    </View>
                    
                    <View style={styles.categoryAmountContainer}>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(category.amount, userCurrency)}
                      </Text>
                      <Text style={styles.categoryPercentage}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                    
                    <View style={styles.categoryProgressBar}>
                      <View 
                        style={[
                          styles.categoryProgress, 
                          { 
                            width: `${percentage}%`,
                            backgroundColor: category.color
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
            </View>
            
            <View style={styles.recentExpenses}>
              {expenses.slice(0, 5).map((expense) => {
                const category = categories.find(cat => cat.id === expense.category) || categories[7];
                
                return (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseLeft}>
                      <Text style={styles.expenseIcon}>{category.icon}</Text>
                      <View style={styles.expenseDetails}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        <Text style={styles.expensePayer}>
                          Paid by {expense.payer_name}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>
                        {formatCurrency(expense.amount, userCurrency)}
                      </Text>
                      <Text style={styles.expenseShare}>
                        Your share: {formatCurrency(expense.yourShare, userCurrency)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderBalances = () => {
    if (!group) return null;

    return (
      <View style={styles.balancesContainer}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>Member Balances</Text>
        </View>
        
        <View style={styles.membersList}>
          {group.members.map((member) => (
            <View key={member.id} style={styles.memberBalance}>
              <View style={styles.memberInfo}>
                <Avatar
                  imageUrl={member.avatar_url}
                  name={member.full_name}
                  size={40}
                  editable={false}
                />
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.full_name || 'Unknown'} {member.isYou && '(You)'}
                  </Text>
                </View>
              </View>
              
              <View style={[
                styles.balanceAmount,
                { backgroundColor: member.balance >= 0 ? '#D1FAE5' : '#FEE2E2' }
              ]}>
                <Text style={[
                  styles.balanceAmountText,
                  { color: member.balance >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {member.balance >= 0 ? '+' : ''}{formatCurrency(member.balance, userCurrency)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderExpenses = () => {
    if (!group) return null;

    return (
      <View style={styles.expensesContainer}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>All Expenses</Text>
        </View>
        
        <View style={styles.expensesList}>
          {expenses.map((expense) => {
            const category = categories.find(cat => cat.id === expense.category) || categories[7];
            
            return (
              <View key={expense.id} style={styles.fullExpenseItem}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseIcon}>{category.icon}</Text>
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expenseCategory}>{category.name}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(expense.amount, userCurrency)}
                    </Text>
                    <Text style={styles.expenseDate}>
                      {new Date(expense.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.expenseFooter}>
                  <Text style={styles.expensePayer}>
                    Paid by {expense.payer_name}
                  </Text>
                  <Text style={styles.expenseShare}>
                    Your share: {formatCurrency(expense.yourShare, userCurrency)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (id && user) {
      loadUserCurrency();
      fetchGroupDetails();
    }
  }, [id, user]);

  useEffect(() => {
    if (group?.id) {
      loadBudgetStatus();
    }
  }, [group]);

  useEffect(() => {
    if (expenses.length > 0) {
      calculateCategorySpending();
    }
  }, [expenses]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- START OF FIX ---
  // The original error occurred here. 
  // We add checks to ensure `budgetStatus` and its properties are not null before rendering.
  const renderBudgetSummary = () => {
    if (!budgetStatus) {
      return (
        <View style={styles.noBudgetSummary}>
          <Target size={20} color="#9CA3AF" />
          <Text style={styles.noBudgetText}>No budget set</Text>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/group-budget',
              params: { groupId: group.id, groupName: group.name }
            })}
            style={styles.setBudgetButton}
          >
            <Text style={styles.setBudgetButtonText}>Set Budget</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Safely get values with fallbacks
    const totalSpent = budgetStatus.totalSpent || 0;
    const totalBudget = budgetStatus.totalBudget || 0;
    const percentage = budgetStatus.percentage || 0;
    const status = budgetStatus.status || 'good';
    const statusColor = status === 'exceeded' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#10B981';

    return (
      <View style={styles.budgetSummary}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <Target size={16} color="#8B5CF6" />
            <Text style={styles.budgetTitle}>Group Budget</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/group-budget',
              params: { groupId: group.id, groupName: group.name }
            })}
            style={styles.budgetSettingsButton}
          >
            <Settings size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.budgetProgressContainer}>
          <View style={styles.budgetAmounts}>
            <Text style={styles.budgetSpent}>
              {formatCurrency(totalSpent, userCurrency)} spent
            </Text>
            <Text style={styles.budgetTotal}>
              of {formatCurrency(totalBudget, userCurrency)}
            </Text>
          </View>
          
          <View style={styles.budgetProgressBar}>
            <View 
              style={[
                styles.budgetProgress, 
                { 
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: statusColor
                }
              ]} 
            />
          </View>
          
          <Text style={[styles.budgetStatus, { color: statusColor }]}>
            {/* The line that caused the error is now safe */}
            {percentage.toFixed(1)}% used
            {status === 'exceeded' && ' (Over budget!)'}
            {status === 'warning' && ' (Almost there!)'}
          </Text>
        </View>
      </View>
    );
  };
  // --- END OF FIX ---

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <TouchableOpacity 
          style={styles.settingsIcon}
          onPress={() => {
            Alert.alert(
              'Group Settings',
              'Choose an action for this group',
              [
                {
                  text: 'Edit Group',
                  onPress: () => {
                    // Navigate to edit group screen
                    Alert.alert('Edit Group', 'This feature will allow you to edit group details like name, description, and avatar.');
                  }
                },
                {
                  text: 'Manage Budget',
                  onPress: () => {
                    router.push({
                      pathname: '/group-budget',
                      params: { groupId: group.id, groupName: group.name }
                    });
                  }
                },
                {
                  text: 'Group Analytics',
                  onPress: () => {
                    Alert.alert('Analytics', 'View detailed spending analytics and trends for this group.');
                  }
                },
                {
                  text: 'Leave Group',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Leave Group',
                      'Are you sure you want to leave this group? You will no longer have access to its expenses and balances.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Leave', style: 'destructive', onPress: () => {
                          // Handle leave group
                          Alert.alert('Left Group', 'You have successfully left the group.');
                        }}
                      ]
                    );
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Settings size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
          <View style={styles.groupSummary}>
            <View style={styles.summaryItem}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.summaryText}>{group.members.length} members</Text>
            </View>
            <View style={styles.summaryItem}>
              <DollarSign size={16} color="#6B7280" />
              <Text style={styles.summaryText}>
                {formatCurrency(group.totalExpenses, userCurrency)} total
              </Text>
            </View>
            <View style={[
                styles.balanceBadge,
                { backgroundColor: group.yourBalance >= 0 ? '#D1FAE5' : '#FEE2E2' },
              ]}>
              <Text style={[
                  styles.balanceText,
                  { color: group.yourBalance >= 0 ? '#10B981' : '#EF4444' },
                ]}>
                {group.yourBalance >= 0 ? 'You get back' : 'You owe'} {formatCurrency(Math.abs(group.yourBalance), userCurrency)}
              </Text>
            </View>
          </View>

          {/* Use the new safe rendering function */}
          {renderBudgetSummary()}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/add-expense', params: { groupId: group.id } })}
              style={styles.actionButton}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSimplifyDebts}
              style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
              disabled={simplifying}
            >
              {simplifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Shuffle size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Simplify Debts</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
              onPress={() => setActiveTab('expenses')}
            >
              <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
                Expenses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'balances' && styles.activeTab]}
              onPress={() => setActiveTab('balances')}
            >
              <Text style={[styles.tabText, activeTab === 'balances' && styles.activeTabText]}>
                Balances
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'expenses'
            ? renderExpenses()
            : activeTab === 'balances'
            ? renderBalances()
            : renderOverview()}
      </ScrollView>

      {/* Modal rendering logic */}
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
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  settingsIcon: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  groupSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 6,
    color: '#4B5563',
    fontSize: 14,
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetSummary: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  budgetSettingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  budgetProgressContainer: {
    marginTop: 8,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetSpent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  budgetTotal: {
    fontSize: 14,
    color: '#6B7280',
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden'
  },
  budgetProgress: {
    height: 8,
    borderRadius: 4,
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  noBudgetSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noBudgetText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  setBudgetButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setBudgetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#10B981',
    fontWeight: '600',
  },
  balancesContainer: {},
  expensesContainer: {},
  debtsContainer: {},
  
  // New styles for enhanced UI
  overviewContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryAmountContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryProgressBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: 4,
    borderRadius: 2,
  },
  recentSection: {
    marginBottom: 16,
  },
  recentExpenses: {
    backgroundColor: '#FFFFFF',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  expensePayer: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  expenseShare: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  membersList: {
    backgroundColor: '#FFFFFF',
  },
  memberBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  balanceAmount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expensesList: {
    backgroundColor: '#FFFFFF',
  },
  fullExpenseItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
