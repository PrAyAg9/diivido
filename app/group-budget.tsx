import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  DollarSign,
  Target,
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  Coffee,
  Car,
  Heart,
  ShoppingBag,
  Home,
  Plane,
  FileText,
  X,
} from 'lucide-react-native';
import {
  budgetAPI,
  type BudgetStatus,
  type BudgetSuggestion,
  type AIBudgetRequest,
  type CategoryBudget,
} from '@/services/budget-api';
import {
  formatCurrency,
  getUserCurrency,
  type Currency,
} from '@/utils/currency';

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

export default function GroupBudgetScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiRequest, setAiRequest] = useState<AIBudgetRequest>({});
  const [description, setDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [userCurrency, setUserCurrency] = useState<Currency>('INR');
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<BudgetSuggestion | null>(null);

  useEffect(() => {
    loadUserCurrency();
    if (groupId) {
      loadBudgetStatus();
    }
  }, [groupId]);

  const loadUserCurrency = async () => {
    try {
      const currency = await getUserCurrency();
      setUserCurrency(currency);
    } catch (error) {
      console.error('Error loading user currency:', error);
    }
  };

  const loadBudgetStatus = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const response = await budgetAPI.getGroupBudgetStatus(groupId);
      setBudgetStatus(response.budgetStatus);
    } catch (error) {
      console.error('Error loading budget status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAISuggestions = async () => {
    if (!description.trim()) {
      Alert.alert(
        'Missing Information',
        'Please describe your plan to get AI suggestions.'
      );
      return;
    }

    if (!groupId) return;

    try {
      setLoadingSuggestions(true);
      const response = await budgetAPI.getSmartBudgetSuggestions(
        description,
        groupId
      );
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      Alert.alert(
        'Error',
        'Failed to get budget suggestions. Please try again.'
      );
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const setBudget = async (amount: number, budgetDescription?: string) => {
    if (!groupId) return;
    try {
      setSavingBudget(true);
      await budgetAPI.setGroupBudget(
        groupId,
        amount,
        userCurrency,
        budgetDescription || description
      );

      Alert.alert(
        'Budget Set! 💰',
        `Successfully set budget of ${formatCurrency(
          amount,
          userCurrency
        )} for ${groupName}`,
        [
          {
            text: 'OK',
            onPress: () => {
              loadBudgetStatus();
              setShowAISuggestions(false);
              setDescription('');
              setManualAmount('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error setting budget:', error);
      Alert.alert('Error', 'Failed to set budget. Please try again.');
    } finally {
      setSavingBudget(false);
    }
  };

  const removeBudget = async () => {
    if (!groupId) return;
    Alert.alert(
      'Remove Budget',
      'Are you sure you want to remove the budget for this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetAPI.removeGroupBudget(groupId);
              setBudgetStatus(null); // Clear budget locally
            } catch (error) {
              Alert.alert('Error', 'Failed to remove budget.');
            }
          },
        },
      ]
    );
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#10B981';
      case 'halfway':
        return '#F59E0B';
      case 'warning':
        return '#EF4444';
      case 'exceeded':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return '💚';
      case 'halfway':
        return '💛';
      case 'warning':
        return '🧡';
      case 'exceeded':
        return '🔴';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading budget information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // FIXED: Calculate 'remaining' safely after confirming budgetStatus exists.
  const remaining = budgetStatus
    ? budgetStatus.totalBudget - budgetStatus.totalSpent
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Budget</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.subtitle}>
            Set and track your group's spending limit
          </Text>
        </View>

        {budgetStatus ? (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>
                Current Budget {getStatusIcon(budgetStatus.status)}
              </Text>
              <TouchableOpacity
                onPress={removeBudget}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.budgetAmount}>
              {formatCurrency(budgetStatus.totalBudget || 0, userCurrency)}
            </Text>
            {budgetStatus.description && (
              <Text style={styles.budgetDescription}>
                {budgetStatus.description}
              </Text>
            )}

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(budgetStatus.percentage || 0, 100)}%`,
                      backgroundColor: getProgressColor(budgetStatus.status),
                    },
                  ]}
                />
              </View>
              {/* FIXED: Added null checks to prevent the .toFixed() error */}
              <Text style={styles.progressText}>
                {formatCurrency(budgetStatus.totalSpent || 0, userCurrency)} /{' '}
                {formatCurrency(budgetStatus.totalBudget || 0, userCurrency)} (
                {(budgetStatus.percentage || 0).toFixed(1)}%)
              </Text>
            </View>

            <View style={styles.budgetStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Spent</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {formatCurrency(budgetStatus.totalSpent || 0, userCurrency)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: remaining >= 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {formatCurrency(remaining, userCurrency)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.noBudgetCard}>
              <Target size={48} color="#9CA3AF" />
              <Text style={styles.noBudgetTitle}>No Budget Set</Text>
              <Text style={styles.noBudgetText}>
                Set a budget to track your group's spending and get helpful
                alerts.
              </Text>
            </View>

            <View style={styles.setBudgetSection}>
              <Text style={styles.sectionTitle}>Set Group Budget</Text>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Manual Amount</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.currencySymbol}>
                    {userCurrency === 'INR'
                      ? '₹'
                      : userCurrency === 'EUR'
                      ? '€'
                      : '$'}
                  </Text>
                  <TextInput
                    style={styles.amountTextInput}
                    placeholder="Enter budget amount"
                    value={manualAmount}
                    onChangeText={setManualAmount}
                    keyboardType="numeric"
                  />
                </View>
                {manualAmount ? (
                  <TouchableOpacity
                    style={styles.setBudgetButton}
                    onPress={() => setBudget(parseFloat(manualAmount))}
                    disabled={savingBudget}
                  >
                    {savingBudget ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.setBudgetButtonText}>Set Budget</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.aiSection}>
                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={() => setShowAISuggestions(!showAISuggestions)}
                >
                  <Sparkles size={20} color="#8B5CF6" />
                  <Text style={styles.aiButtonText}>Help Me Estimate ✨</Text>
                </TouchableOpacity>

                {showAISuggestions && (
                  <View style={styles.aiContainer}>
                    <Text style={styles.aiPrompt}>
                      Describe your plan, and I'll suggest a budget:
                    </Text>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="e.g., A 5-day trip to Goa for 4 people..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={getAISuggestions}
                      disabled={loadingSuggestions}
                    >
                      {loadingSuggestions ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Sparkles size={16} color="#FFFFFF" />
                          <Text style={styles.generateButtonText}>
                            Generate Suggestions
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {suggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>
                          AI Budget Suggestions
                        </Text>
                        {suggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionCard}
                            onPress={() =>
                              setBudget(suggestion.amount, suggestion.reason)
                            }
                            disabled={savingBudget}
                          >
                            <View style={styles.suggestionHeader}>
                              <Text style={styles.suggestionName}>
                                {suggestion.name}
                              </Text>
                              <Text style={styles.suggestionAmount}>
                                {formatCurrency(
                                  suggestion.amount,
                                  userCurrency
                                )}
                              </Text>
                            </View>
                            <Text style={styles.suggestionReason}>
                              {suggestion.reason}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  groupInfo: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  budgetDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  noBudgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noBudgetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  noBudgetText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  setBudgetSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: 48,
  },
  setBudgetButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  setBudgetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  aiContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aiPrompt: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 12,
    minHeight: 80,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  suggestionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  suggestionReason: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
