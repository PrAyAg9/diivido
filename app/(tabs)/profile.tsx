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
import * as ImagePicker from 'expo-image-picker';
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
  Crown,
  Trophy,
  Target,
  Zap,
  Star,
  Gift,
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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: string;
}

interface GamificationData {
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: Achievement[];
  streakDays: number;
  totalRewards: number;
}

// --- Helper Components --- //

// A component for each stat card to keep the main component clean
const StatCard = ({ label, value, color }: StatItemProps) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// A component for gamification progress
const GamificationCard = ({ gamificationData }: { gamificationData: GamificationData }) => {
  const progressPercentage = (gamificationData.xp / gamificationData.xpToNextLevel) * 100;
  
  return (
    <View style={styles.gamificationCard}>
      <View style={styles.gamificationHeader}>
        <View style={styles.levelBadge}>
          <Trophy size={16} color="#F59E0B" />
          <Text style={styles.levelText}>Level {gamificationData.level}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Zap size={14} color="#EF4444" />
          <Text style={styles.streakText}>{gamificationData.streakDays} day streak</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progress to Level {gamificationData.level + 1}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {gamificationData.xp} / {gamificationData.xpToNextLevel} XP
        </Text>
      </View>
      
      <View style={styles.achievementsPreview}>
        <Text style={styles.achievementsTitle}>Recent Achievements</Text>
        <View style={styles.achievementsList}>
          {gamificationData.achievements.slice(0, 3).map((achievement, index) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View style={[
                styles.achievementIcon,
                { backgroundColor: achievement.unlocked ? '#ECFDF5' : '#F3F4F6' }
              ]}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <Text style={[
                styles.achievementTitle,
                { color: achievement.unlocked ? '#111827' : '#9CA3AF' }
              ]}>
                {achievement.title}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [gamificationData, setGamificationData] = useState<GamificationData>({
    level: 3,
    xp: 750,
    xpToNextLevel: 1000,
    streakDays: 12,
    totalRewards: 3,
    achievements: [
      {
        id: '1',
        title: 'First Group',
        description: 'Create your first expense group',
        icon: '🎯',
        unlocked: true,
        progress: 1,
        maxProgress: 1,
        reward: '50 XP',
      },
      {
        id: '2',
        title: 'Social Butterfly',
        description: 'Invite 5 friends to the app',
        icon: '🦋',
        unlocked: true,
        progress: 5,
        maxProgress: 5,
        reward: '100 XP',
      },
      {
        id: '3',
        title: 'Money Manager',
        description: 'Track expenses for 30 days',
        icon: '💰',
        unlocked: false,
        progress: 12,
        maxProgress: 30,
        reward: '200 XP',
      },
      {
        id: '4',
        title: 'Group Leader',
        description: 'Create 10 expense groups',
        icon: '👑',
        unlocked: false,
        progress: 3,
        maxProgress: 10,
        reward: '300 XP',
      },
    ],
  });



  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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

  const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result = await response.json();
    if (result.secure_url) {
      return result.secure_url;
    } else {
      throw new Error('Failed to upload image');
    }
  };

  const generateInitialAvatar = (name: string): string => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    // Use a service like UI Avatars to generate an avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff&size=200&format=png`;
  };

  const handleImagePicker = async () => {
    if (!profile) return;

    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required to take photos');
              return;
            }
            selectImage('camera');
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Photo library permission is required');
              return;
            }
            selectImage('library');
          },
        },
        {
          text: 'Generate Avatar',
          onPress: () => {
            if (profile.fullName) {
              const avatarUrl = generateInitialAvatar(profile.fullName);
              updateProfileImage(avatarUrl);
            } else {
              Alert.alert('Error', 'Please set your name first to generate an avatar');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const selectImage = async (source: 'camera' | 'library') => {
    try {
      setIsUploadingImage(true);
      
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const cloudinaryUrl = await uploadToCloudinary(imageUri);
        await updateProfileImage(cloudinaryUrl);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to update profile photo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const updateProfileImage = async (avatarUrl: string) => {
    if (!profile) return;
    
    try {
      await updateUserProfile({ avatarUrl });
      setProfile({ ...profile, avatarUrl });
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile photo');
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
            id: 'subscription',
            title: 'Subscription',
            icon: Crown,
            hasChevron: true,
            subtitle: 'Free Plan',
          },
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
                  (profile.fullName 
                    ? generateInitialAvatar(profile.fullName)
                    : 'https://ui-avatars.com/api/?name=User&background=10B981&color=fff&size=200&format=png'
                  ),
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleImagePicker}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={16} color="#FFFFFF" />
              )}
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

        {/* <GamificationCard gamificationData={gamificationData} /> */}

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
                    if (item.id === 'currency') {
                      handleCurrencySelection();
                    } else if (item.id === 'subscription') {
                      router.push('/subscription');
                    } else if (item.id === 'payment-methods') {
                      router.push('/payment-methods');
                    } else if (item.id === 'notifications') {
                      router.push('/notifications');
                    } else if (item.id === 'privacy') {
                      router.push('/privacy-settings');
                    } else if (item.id === 'invite-friends') {
                      router.push('/invite-friends');
                    } else if (item.id === 'friends') {
                      router.push('/manage-friends');
                    } else if (item.id === 'help') {
                      Alert.alert('Help & Support', 'Coming soon! Contact support at prayag.thakur@example.com');
                    } else if (item.id === 'settings') {
                      Alert.alert('App Settings', 'Additional settings coming soon!');
                    }
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
  // Gamification Styles
  gamificationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  achievementsPreview: {
    marginTop: 4,
  },
  achievementsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  achievementsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementItem: {
    alignItems: 'center',
    flex: 1,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementTitle: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
