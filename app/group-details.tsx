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
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getUserCurrency, type Currency } from '@/utils/currency';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  SimplifiedDebt,
} from '@/services/group-balances-api';

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

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { id } = params;

  console.log('Group details screen params:', params);
  console.log('Group ID from params:', id);

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [simplifying, setSimplifying] = useState(false);
  const [userCurrency, setUserCurrency] = useState<Currency>('INR');

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
      // Handle array or string IDs from useLocalSearchParams
      const groupId = Array.isArray(id) ? id[0] : id;

      // Check if groupId is valid
      if (!groupId) {
        console.error('No group ID provided');
        setLoading(false);
        return;
      }

      console.log('Fetching details for group:', groupId);

      // Get group info
      const response = await getGroupDetails(groupId);
      const groupData = response.data;

      console.log('Group data received:', groupData);

      // Get group balances for members
      const balancesResponse = await getGroupBalances(groupId);
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

      // Get expenses
      const expensesResponse = await getGroupExpenses(groupId);
      const expensesData = expensesResponse.data;

      const formattedExpenses: Expense[] = expensesData.map((expense: any) => ({
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

  // Calculate who owes whom (simplified debts)
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

  // New component for rendering Splitwise-style debts
  const renderDebtsList = () => {
    if (!group) {
      return (
        <View>
          <Text>No group data available</Text>
        </View>
      );
    }

    // If we don't have simplified debts yet and we have group data, calculate them
    if (!simplifiedDebts.length && group.members && group.members.length > 0) {
      const debts = calculateSimplifiedDebts(group.members);
      setSimplifiedDebts(debts);
    }

    if (!group) return null;

    return (
      <View style={styles.debtsContainer}>
        <View style={styles.debtsHeader}>
          <Text style={styles.debtsTitle}>Who Pays Whom</Text>
          <TouchableOpacity
            style={styles.simplifyButton}
            onPress={handleSimplifyDebts}
          >
            <Shuffle size={16} color="#10B981" />
            <Text style={styles.simplifyButtonText}>Simplify Debts</Text>
          </TouchableOpacity>
        </View>

        {simplifiedDebts.length === 0 ? (
          <View style={styles.emptyDebtsContainer}>
            <Text style={styles.emptyDebtsText}>No outstanding balances</Text>
          </View>
        ) : (
          simplifiedDebts.map((debt, index) => (
            <View key={index} style={styles.debtItem}>
              <View style={styles.debtUsers}>
                <Image
                  source={{
                    uri:
                      group.members.find((m) => m.id === debt.from)
                        ?.avatar_url ||
                      'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
                  }}
                  style={styles.debtAvatar}
                />
                <Text style={styles.debtUserName}>
                  {debt.from === user?.id ? 'You' : debt.fromName}
                </Text>
                <TrendingUp
                  size={16}
                  color="#10B981"
                  style={styles.debtArrow}
                />
                <Image
                  source={{
                    uri:
                      group.members.find((m) => m.id === debt.to)?.avatar_url ||
                      'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
                  }}
                  style={styles.debtAvatar}
                />
                <Text style={styles.debtUserName}>
                  {debt.to === user?.id ? 'You' : debt.toName}
                </Text>
              </View>
              <View style={styles.debtAmountContainer}>
                <Text style={styles.debtAmountText}>
                  {formatCurrency(debt.amount, userCurrency)}
                </Text>
                {debt.from === user?.id && (
                  <TouchableOpacity style={styles.payNowButton}>
                    <Text style={styles.payNowButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  useEffect(() => {
    console.log('Group details useEffect running with id:', id);
    if (id) {
      loadUserCurrency();
      fetchGroupDetails();
    }
  }, [id, user]);

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderBalances = () => (
    <View style={styles.balancesContainer}>
      {group.members.map((member) => (
        <View key={member.id} style={styles.memberBalanceCard}>
          <Image
            source={{
              uri:
                member.avatar_url ||
                'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            }}
            style={styles.memberAvatar}
          />
          <View style={styles.memberBalanceInfo}>
            <Text style={styles.memberName}>
              {member.isYou ? 'You' : member.full_name || 'Unknown'}
            </Text>
            <View style={styles.balanceRow}>
              {member.balance > 0 ? (
                <TrendingUp size={12} color="#10B981" />
              ) : member.balance < 0 ? (
                <TrendingDown size={12} color="#EF4444" />
              ) : null}
              <Text
                style={[
                  styles.memberBalance,
                  { color: member.balance >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {member.balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(member.balance), userCurrency)}
              </Text>
            </View>
          </View>
          <Text style={styles.balanceLabel}>
            {member.balance > 0
              ? 'Gets back'
              : member.balance < 0
              ? 'Owes'
              : 'Settled up'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderExpenses = () => (
    <View style={styles.expensesContainer}>
      {expenses.map((expense) => (
        <TouchableOpacity key={expense.id} style={styles.expenseCard}>
          <Image
            source={{
              uri:
                expense.payer_avatar ||
                'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            }}
            style={styles.expenseAvatar}
          />

          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle}>{expense.title}</Text>
            <Text style={styles.expenseCategory}>{expense.category}</Text>
            <View style={styles.expenseMeta}>
              <Calendar size={12} color="#9CA3AF" />
              <Text style={styles.expenseTime}>
                {new Date(expense.created_at).toLocaleDateString()}
              </Text>
              <Users size={12} color="#9CA3AF" style={{ marginLeft: 8 }} />
              <Text style={styles.expenseParticipants}>
                {expense.participants}
              </Text>
            </View>
          </View>

          <View style={styles.expenseAmount}>
            <Text style={styles.expenseTotal}>
              {formatCurrency(expense.amount, userCurrency)}
            </Text>
            <Text style={styles.expenseYourShare}>
              You: {formatCurrency(expense.yourShare, userCurrency)}
            </Text>
            <Text style={styles.expensePaidBy}>
              Paid by{' '}
              {expense.paid_by === user?.id ? 'You' : expense.payer_name}
            </Text>
          </View>

          <TouchableOpacity style={styles.expenseOptions}>
            <MoreHorizontal size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <TouchableOpacity style={styles.settingsIcon}>
          <Settings size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Group Summary */}
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
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.balanceBadge,
              {
                backgroundColor: group.yourBalance >= 0 ? '#D1FAE5' : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.balanceText,
                { color: group.yourBalance >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {group.yourBalance >= 0 ? 'You get back' : 'You owe'} {formatCurrency(Math.abs(group.yourBalance), userCurrency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/add-expense',
              params: { groupId: group.id },
            })
          }
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

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'expenses' && styles.activeTabText,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && styles.activeTab]}
          onPress={() => setActiveTab('balances')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'balances' && styles.activeTabText,
            ]}
          >
            Balances
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'debts' && styles.activeTab]}
          onPress={() => setActiveTab('debts')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'debts' && styles.activeTabText,
            ]}
          >
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'expenses'
          ? renderExpenses()
          : activeTab === 'balances'
          ? renderBalances()
          : renderDebtsList()}
      </ScrollView>

      {/* Simplify Debts Modal */}
      <Modal
        visible={showSimplifyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSimplifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Simplified Payments</Text>
            <Text style={styles.modalDescription}>
              Here's the simplified way to settle all debts with the fewest
              transactions:
            </Text>

            <ScrollView style={styles.simplifiedDebtsList}>
              {simplifiedDebts.map((debt, index) => (
                <View key={index} style={styles.debtItem}>
                  <Text style={styles.debtText}>
                    <Text style={styles.debtorName}>
                      {debt.from === user?.id ? 'You' : debt.fromName}
                    </Text>{' '}
                    pays{' '}
                    <Text style={styles.creditorName}>
                      {debt.to === user?.id ? 'You' : debt.toName}
                    </Text>
                  </Text>
                  <Text style={styles.debtAmount}>
                    {formatCurrency(debt.amount, userCurrency)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowSimplifyModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
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
  contentContainer: {
    flex: 1,
  },
  balancesContainer: {
    padding: 16,
  },
  memberBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberBalanceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberBalance: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  balanceLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  expensesContainer: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  expenseInfo: {
    marginLeft: 12,
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  expenseParticipants: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  expenseAmount: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
    marginRight: 8,
  },
  expenseTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  expenseYourShare: {
    fontSize: 14,
    color: '#4B5563',
  },
  expensePaidBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  expenseOptions: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  simplifiedDebtsList: {
    maxHeight: 300,
  },
  debtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  debtText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  debtorName: {
    fontWeight: '600',
    color: '#EF4444',
  },
  creditorName: {
    fontWeight: '600',
    color: '#10B981',
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeModalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // New styles for Splitwise-style debts visualization
  debtsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  debtsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debtsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  simplifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  simplifyButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyDebtsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  emptyDebtsText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  debtUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
  },
  debtAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  debtUserName: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  debtArrow: {
    marginHorizontal: 8,
  },
  debtAmountContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  debtAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  payNowButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payNowButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '500',
  },
});
