import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check, Zap } from 'lucide-react-native';
import {
  PurchasesPackage,
  PurchasesOffering,
  PACKAGE_TYPE,
  PurchasesStoreProduct,
  PRODUCT_CATEGORY,
  PRODUCT_TYPE,
  PresentedOfferingContext,
} from 'react-native-purchases';
import SubscriptionService from '@/services/subscription.service';

// Mocking for standalone functionality
const useAuth = () => ({ user: { id: 'test-user-123' } });

// --- MOCK SUBSCRIPTION DATA ---
// FIXED: The mock product now includes all required fields from PurchasesStoreProduct
const mockMonthlyProduct: PurchasesStoreProduct = {
  identifier: 'pro_monthly',
  description: 'Full access to all pro features',
  title: 'Divido Pro',
  price: 199.0,
  priceString: '₹199.00',
  currencyCode: 'INR',
  introPrice: null,
  discounts: [],
  productCategory: PRODUCT_CATEGORY.SUBSCRIPTION,
  productType: PRODUCT_TYPE.NON_CONSUMABLE,
  subscriptionPeriod: 'P1M',
  presentedOfferingIdentifier: null,
  pricePerWeek: 49.75,
  pricePerMonth: 199.0,
  pricePerYear: 2388.0,
  pricePerWeekString: '₹49.75',
  pricePerMonthString: '₹199.00',
  pricePerYearString: '₹2,388.00',
  defaultOption: null,
  subscriptionOptions: [],
  presentedOfferingContext: {} as PresentedOfferingContext,
};

const mockAnnualProduct: PurchasesStoreProduct = {
  identifier: 'pro_annual',
  description: 'Full access to all pro features for a year',
  title: 'Divido Pro (Annual)',
  price: 1999.0,
  priceString: '₹1,999.00',
  currencyCode: 'INR',
  introPrice: null,
  discounts: [],
  productCategory: PRODUCT_CATEGORY.SUBSCRIPTION,
  productType: PRODUCT_TYPE.NON_CONSUMABLE,
  subscriptionPeriod: 'P1Y',
  presentedOfferingIdentifier: null,
  pricePerWeek: 38.44,
  pricePerMonth: 166.58,
  pricePerYear: 1999.0,
  pricePerWeekString: '₹38.44',
  pricePerMonthString: '₹166.58',
  pricePerYearString: '₹1,999.00',
  defaultOption: null,
  subscriptionOptions: [],
  presentedOfferingContext: {} as PresentedOfferingContext,
};

// This simulates what RevenueCat would return if the real service fails or in development.
const mockOffering: PurchasesOffering = {
  identifier: 'default',
  serverDescription: 'Default Offering',
  metadata: {},
  availablePackages: [
    {
      identifier: '$rc_monthly',
      packageType: PACKAGE_TYPE.MONTHLY,
      product: mockMonthlyProduct,
      offeringIdentifier: 'default',
      presentedOfferingContext: {} as PresentedOfferingContext,
    },
    {
      identifier: '$rc_annual',
      packageType: PACKAGE_TYPE.ANNUAL,
      product: mockAnnualProduct,
      offeringIdentifier: 'default',
      presentedOfferingContext: {} as PresentedOfferingContext,
    },
  ],
  lifetime: null,
  annual: null,
  sixMonth: null,
  threeMonth: null,
  twoMonth: null,
  monthly: null,
  weekly: null,
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
    productIdentifier?: string;
    expirationDate?: string | null;
    willRenew?: boolean;
  }>({
    isSubscribed: false,
  });

  useEffect(() => {
    initializeRevenueCat();
  }, [user]); // Re-initialize when user changes.

  const initializeRevenueCat = async () => {
    // Prevent any action on web platform.
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      await SubscriptionService.initialize(user?.id);

      const [currentOffering, status] = await Promise.all([
        SubscriptionService.getCurrentOffering(),
        SubscriptionService.getSubscriptionStatus(),
      ]);

      setOfferings(currentOffering || mockOffering);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setIsProcessing(true);
    setSelectedPlan(packageToPurchase.identifier);

    try {
      const result = await SubscriptionService.purchasePackage(
        packageToPurchase
      );
      if (result.success) {
        const newStatus = await SubscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(newStatus);
        Alert.alert('Success!', 'Welcome to Divido Pro!', [
          { text: 'Awesome!', onPress: () => router.back() },
        ]);
      } else if (result.error && !result.error.includes('cancelled')) {
        Alert.alert('Purchase Failed', result.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Something went wrong during purchase');
    } finally {
      setIsProcessing(false);
      setSelectedPlan('');
    }
  };

  const handleRestorePurchases = async () => {
    setIsProcessing(true);
    try {
      const result = await SubscriptionService.restorePurchases();
      if (result.success) {
        const newStatus = await SubscriptionService.getSubscriptionStatus();
        setSubscriptionStatus(newStatus);
        if (newStatus.isSubscribed) {
          Alert.alert('Success', 'Your purchases have been restored!');
        } else {
          Alert.alert(
            'No Purchases',
            'No previous purchases found to restore.'
          );
        }
      } else {
        Alert.alert(
          'Restore Failed',
          result.error || 'Failed to restore purchases'
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setIsProcessing(false);
    }
  };

  const proFeatures = [
    { text: 'Unlimited groups/trips', included: true },
    { text: 'Advanced expense tracking', included: true },
    { text: 'Smart split suggestions', included: true },
    { text: 'Detailed analytics & insights', included: true },
    { text: '24/7 priority support', included: true },
    { text: 'Export detailed reports', included: true },
  ];

  const freeFeatures = [
    { text: 'Up to 10 groups', included: true },
    { text: 'Basic expense tracking', included: true },
    { text: 'Payment reminders', included: true },
    { text: 'Advanced analytics', included: false },
    { text: 'Priority support', included: false },
  ];

  const renderFeatureList = (
    features: { text: string; included: boolean }[]
  ) => (
    <View style={styles.featuresContainer}>
      {features.map((feature, index) => (
        <View key={index} style={styles.feature}>
          <View
            style={[
              styles.featureIcon,
              { backgroundColor: feature.included ? '#ECFDF5' : '#F3F4F6' },
            ]}
          >
            <Check size={12} color={feature.included ? '#10B981' : '#9CA3AF'} />
          </View>
          <Text
            style={[
              styles.featureText,
              { color: feature.included ? '#111827' : '#9CA3AF' },
            ]}
          >
            {feature.text}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.title}>Subscription</Text>
      {Platform.OS !== 'web' ? (
        <TouchableOpacity
          onPress={handleRestorePurchases}
          style={styles.restoreButton}
          disabled={isProcessing}
        >
          <Text style={styles.restoreButtonText}>Restore</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Explicitly handle web platform UI
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            In-app subscriptions are available on our mobile app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Zap size={32} color="#10B981" />
          </View>
          <Text style={styles.heroTitle}>
            {subscriptionStatus.isSubscribed
              ? "You're a Pro!"
              : 'Unlock Premium Features'}
          </Text>
          <Text style={styles.heroDescription}>
            {subscriptionStatus.isSubscribed
              ? `Your Pro plan is active. Thanks for supporting Divido!`
              : 'Upgrade to Divido Pro for unlimited groups and advanced analytics.'}
          </Text>
        </View>

        {subscriptionStatus.isSubscribed ? (
          <View style={styles.subscribedSection}>
            <View style={styles.subscribedCard}>
              <Crown size={32} color="#FBBF24" />
              <Text style={styles.subscribedTitle}>Divido Pro Active</Text>
              {subscriptionStatus.expirationDate && (
                <Text style={styles.subscribedDescription}>
                  {subscriptionStatus.willRenew ? 'Renews on:' : 'Expires on:'}{' '}
                  {new Date(
                    subscriptionStatus.expirationDate
                  ).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {offerings?.availablePackages.map((packageItem) => (
              <View
                key={packageItem.identifier}
                style={[
                  styles.planCard,
                  packageItem.packageType === PACKAGE_TYPE.MONTHLY &&
                    styles.popularPlan,
                ]}
              >
                {packageItem.packageType === PACKAGE_TYPE.MONTHLY && (
                  <View style={styles.popularBadge}>
                    <Crown size={16} color="#FFFFFF" />
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>
                    {SubscriptionService.getPackageDuration(packageItem)} Pro
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      {SubscriptionService.getFormattedPrice(packageItem)}
                    </Text>
                    <Text style={styles.period}>
                      /
                      {packageItem.packageType === PACKAGE_TYPE.MONTHLY
                        ? 'month'
                        : 'year'}
                    </Text>
                  </View>
                </View>
                {renderFeatureList(proFeatures)}
                <TouchableOpacity
                  style={[
                    styles.planButton,
                    { backgroundColor: '#10B981' },
                    isProcessing &&
                      selectedPlan === packageItem.identifier &&
                      styles.processingButton,
                  ]}
                  onPress={() => handlePurchase(packageItem)}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlan === packageItem.identifier ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.planButtonText}>Upgrade to Pro</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.planCard, styles.freePlan]}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Free Plan</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>₹0</Text>
                  <Text style={styles.period}>/forever</Text>
                </View>
              </View>
              {renderFeatureList(freeFeatures)}
              <TouchableOpacity
                style={[styles.planButton, styles.currentPlanButton]}
                disabled={true}
              >
                <Text style={styles.currentPlanButtonText}>Current Plan</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  restoreButton: {
    position: 'absolute',
    right: 20,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  subscribedSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  subscribedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  subscribedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  subscribedDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  freePlan: {
    borderColor: '#D1D5DB',
  },
  popularBadge: {
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  planButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentPlanButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentPlanButtonText: {
    color: '#6B7280',
  },
  processingButton: {
    opacity: 0.7,
  },
  placeholder: {
    width: 60,
  },
});
