import { Platform, Alert } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

// RevenueCat API Keys
const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_YOUR_IOS_API_KEY_HERE', // Replace with your iOS API key
  android: 'goog_KUswLuEznszTArnxzMsuGHufmOI', // Replace with your Android API key
}) || '';

class SubscriptionService {
  private static instance: SubscriptionService;
  private isInitialized = false;

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async initialize(userId?: string): Promise<void> {
    // --- THIS IS THE FIX ---
    // RevenueCat is a native module. We must check that we are NOT on the web
    // before attempting to initialize it.
    if (Platform.OS === 'web') {
      console.warn('RevenueCat is not supported on the web. Skipping initialization.');
      return;
    }
    
    if (this.isInitialized) {
      return;
    }

    try {
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId,
      });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      throw error;
    }
  }

  // --- All other methods are also wrapped in platform checks ---

  async getOfferings(): Promise<PurchasesOffering[]> {
    if (Platform.OS === 'web') return [];
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Error getting offerings:', error);
      return [];
    }
  }

  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (Platform.OS === 'web') return null;
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error getting current offering:', error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (Platform.OS === 'web') return null;
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    if (Platform.OS === 'web') {
      Alert.alert("Not Supported", "Purchases are not available on the web.");
      return { success: false, error: 'Not supported on web' };
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('Purchase error:', error);
      if (error.userCancelled) {
        return { success: false, error: 'Purchase was cancelled by user' };
      }
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    if (Platform.OS === 'web') {
      Alert.alert("Not Supported", "Restore is not available on the web.");
      return { success: false, error: 'Not supported on web' };
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('Restore purchases error:', error);
      return { success: false, error: error.message || 'Failed to restore purchases' };
    }
  }

  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    productIdentifier?: string;
    expirationDate?: string | null;
    willRenew?: boolean;
  }> {
    if (Platform.OS === 'web') return { isSubscribed: false };
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        return { isSubscribed: false };
      }

      const proEntitlement = customerInfo.entitlements.active['pro'];
      
      if (proEntitlement) {
        return {
          isSubscribed: true,
          productIdentifier: proEntitlement.productIdentifier,
          expirationDate: proEntitlement.expirationDate,
          willRenew: proEntitlement.willRenew,
        };
      }

      return { isSubscribed: false };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { isSubscribed: false };
    }
  }

  async checkTrialEligibility(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return true;
      return Object.keys(customerInfo.allPurchasedProductIdentifiers).length === 0;
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      return false;
    }
  }

  async setUserAttributes(attributes: Record<string, string>): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('Error setting user attributes:', error);
    }
  }

  async logOut(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Error logging out from RevenueCat:', error);
    }
  }

  // Helper method to get formatted price
  getFormattedPrice(packageItem: PurchasesPackage): string {
    return packageItem.product.priceString;
  }

  // Helper method to get package duration
  getPackageDuration(packageItem: PurchasesPackage): string {
    const identifier = packageItem.identifier.toLowerCase();
    if (identifier.includes('monthly')) return 'Monthly';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'Annual';
    if (identifier.includes('weekly')) return 'Weekly';
    return 'One-time';
  }
}

export default SubscriptionService.getInstance();
