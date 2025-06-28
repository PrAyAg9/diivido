import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Settings,
  Bell,
  CreditCard,
  Users,
  CircleHelp as HelpCircle,
  Shield,
  Moon,
  ChevronRight,
  LogOut,
  Edit3,
  DollarSign,
  Camera,
  Save,
  UserPlus,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '@/services/profile-api';
import { getUserBalances } from '@/services/dashboard-api';
import { getUserGroups } from '@/services/groups-api';
import {
  getUserCurrency,
  setUserCurrency,
  convertAndFormatAmount,
  getAvailableCurrencies,
  getCurrencyName,
  CURRENCY_SYMBOLS,
  type Currency,
} from '@/utils/currency';

// --- Interfaces --- //
interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
}

interface BalanceData {
  netBalance: number;
  totalOwed: number;
  totalOwedToYou: number;
}

interface StatItemProps {
  label: string;
  value: string;
  color: string;
}

// --- Helper Components --- //

// A component for each stat card to keep the main component clean
const StatCard = ({ label, value, color }: StatItemProps) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// A component for each setting item to keep the main component clean
const SettingItem = ({
  item,
  isLast,
  onPress,
}: {
  item: any;
  isLast: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.settingItem, isLast && styles.lastSettingItem]}
    onPress={onPress}
  >
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <item.icon size={20} color="#6B7280" />
      </View>
      <View>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>
    </View>
    <View style={styles.settingRight}>
      {item.hasSwitch && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: '#E5E7EB', true: '#10B981' }}
          thumbColor="#FFFFFF"
        />
      )}
      {item.hasChevron && <ChevronRight size={20} color="#9CA3AF" />}
    </View>
  </TouchableOpacity>
);

// --- Main Screen Component --- //

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // State Management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [totalGroups, setTotalGroups] = useState(0);
  const [stats, setStats] = useState<StatItemProps[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');

  // --- Data Fetching --- //
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      const currency = await getUserCurrency();
      setSelectedCurrency(currency);

      // Fetch data in parallel for faster loading
      await Promise.all([loadProfile(), loadBalances(currency), loadGroups()]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile(user?.id || '');
      setProfile(profileData.data);
      setFullName(profileData.data.fullName || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    }
  };

  const loadBalances = async (currency: Currency) => {
    try {
      const response = await getUserBalances();
      const balances = response.data;
      setBalanceData(balances);

      const netBalanceFormatted = await convertAndFormatAmount(
        Math.abs(balances.netBalance),
        currency
      );
      const owedFormatted = await convertAndFormatAmount(
        balances.totalOwed,
        currency
      );
      const owedToYouFormatted = await convertAndFormatAmount(
        balances.totalOwedToYou,
        currency
      );

      setStats([
        {
          label: 'Net Balance',
          value: netBalanceFormatted,
          color: balances.netBalance >= 0 ? '#10B981' : '#EF4444',
        },
        { label: 'You Owe', value: owedFormatted, color: '#EF4444' },
        { label: 'Owed to You', value: owedToYouFormatted, color: '#10B981' },
      ]);
    } catch (error) {
      console.error('Error loading balances:', error);
      setStats([]); // Clear stats on error
    }
  };

  const loadGroups = async () => {
    try {
      const groupsResponse = await getUserGroups();
      setTotalGroups(groupsResponse.data.length);
    } catch (error) {
      console.error('Error loading groups:', error);
      setTotalGroups(0);
    }
  };

  // --- Event Handlers --- //
  const handleCurrencyChange = async (currency: Currency) => {
    try {
      await setUserCurrency(currency);
      setSelectedCurrency(currency);
      await loadBalances(currency); // Reload balances with new currency
      Alert.alert(
        'Success',
        `Currency changed to ${getCurrencyName(currency)}`
      );
    } catch (error) {
      console.error('Error changing currency:', error);
      Alert.alert('Error', 'Failed to change currency');
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateUserProfile({ fullName: fullName.trim() });
      setProfile({ ...profile, fullName: fullName.trim() });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleCurrencySelection = () => {
    const currencies = getAvailableCurrencies();
    const options = currencies.map((code) => ({
      text: `${CURRENCY_SYMBOLS[code]} ${getCurrencyName(code)}`,
      onPress: () => handleCurrencyChange(code),
    }));

    Alert.alert(
      'Select Currency',
      'Choose your preferred currency for displaying amounts',
      [...options, { text: 'Cancel', style: 'cancel' }]
    );
  };

  // --- Memoized Data for Rendering --- //
  const settingsSections = useMemo(
    () => [
      {
        section: 'Account',
        items: [
          {
            id: 'payment-methods',
            title: 'Payment Methods',
            icon: CreditCard,
            hasChevron: true,
          },
          {
            id: 'currency',
            title: 'Default Currency',
            icon: DollarSign,
            hasChevron: true,
            subtitle: selectedCurrency,
          },
        ],
      },
      {
        section: 'Preferences',
        items: [
          {
            id: 'notifications',
            title: 'Notifications',
            icon: Bell,
            hasChevron: true,
          },
          {
            id: 'dark-mode',
            title: 'Dark Mode',
            icon: Moon,
            hasSwitch: true,
            value: isDarkMode,
            onToggle: setIsDarkMode,
          },
        ],
      },
      {
        section: 'Social',
        items: [
          {
            id: 'invite-friends',
            title: 'Invite Friends',
            icon: UserPlus,
            hasChevron: true,
          },
          {
            id: 'friends',
            title: 'Manage Friends',
            icon: Users,
            hasChevron: true,
          },
          {
            id: 'privacy',
            title: 'Privacy Settings',
            icon: Shield,
            hasChevron: true,
          },
        ],
      },
      {
        section: 'Support',
        items: [
          {
            id: 'help',
            title: 'Help & Support',
            icon: HelpCircle,
            hasChevron: true,
          },
          {
            id: 'settings',
            title: 'App Settings',
            icon: Settings,
            hasChevron: true,
          },
        ],
      },
    ],
    [selectedCurrency, isDarkMode]
  ); // Re-generate this data only when dependencies change

  const formatMemberSince = (dateString: string) =>
    `Member since ${new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })}`;

  // --- Render Logic --- //
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            onPress={() =>
              isEditing ? handleUpdateProfile() : setIsEditing(true)
            }
            disabled={saving}
            style={styles.editButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : isEditing ? (
              <Save size={20} color="#10B981" />
            ) : (
              <Edit3 size={20} color="#10B981" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  profile.avatarUrl ||
                  'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() =>
                Alert.alert(
                  'Coming Soon',
                  'Image upload will be available soon.'
                )
              }
            >
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.profileName}>
                {profile.fullName || 'No name set'}
              </Text>
            )}
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Text style={styles.memberSince}>
              {formatMemberSince(profile.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
          <StatCard
            label="Groups"
            value={String(totalGroups)}
            color="#F59E0B"
          />
        </View>

        {settingsSections.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <SettingItem
                  key={item.id}
                  item={item}
                  isLast={itemIndex === section.items.length - 1}
                  onPress={() => {
                    if (item.id === 'currency') handleCurrencySelection();
                    else if (item.id === 'invite-friends')
                      router.push('/invite-friends');
                    else if (item.id === 'friends')
                      router.push('/manage-friends');
                    // Add other navigation or actions here
                  }}
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Divido v1.0.0</Text>
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
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 200,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
});
