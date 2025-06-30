import { Linking, Platform, Alert } from 'react-native';

export interface UPIApp {
  id: string;
  name: string;
  packageName: string;
  displayName: string;
  icon: string;
  color: string;
}

export const UPI_APPS: UPIApp[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    packageName: 'com.google.android.apps.nbu.paisa.user',
    displayName: 'GPay',
    icon: '💳',
    color: '#1A73E8',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    displayName: 'PhonePe',
    icon: '📱',
    color: '#5F259F',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    packageName: 'net.one97.paytm',
    displayName: 'Paytm',
    icon: '💰',
    color: '#00BAF2',
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    packageName: 'in.org.npci.upiapp',
    displayName: 'BHIM',
    icon: '🏛️',
    color: '#FF6B35',
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    packageName: 'in.amazon.mShop.android.shopping',
    displayName: 'Amazon Pay',
    icon: '📦',
    color: '#FF9900',
  },
];

export interface PaymentRequest {
  recipientUPI: string;
  recipientName: string;
  amount: number;
  currency: string;
  note?: string;
  transactionId?: string;
}

export interface ManualPaymentData {
  amount: number;
  currency: string;
  recipientName: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'other';
  note?: string;
  receiptUrl?: string;
}

/**
 * Generate UPI payment URL for a specific app
 */
export function generateUPIUrl(app: UPIApp, payment: PaymentRequest): string {
  const baseParams = {
    pa: payment.recipientUPI, // Payee VPA
    pn: payment.recipientName, // Payee Name
    am: payment.amount.toString(), // Amount
    cu: payment.currency, // Currency
    tn: payment.note || `Payment to ${payment.recipientName}`, // Transaction Note
  };

  // Add transaction ID if provided
  if (payment.transactionId) {
    (baseParams as any).tr = payment.transactionId;
  }

  const params = new URLSearchParams(baseParams).toString();

  // Different apps have different URL schemes
  switch (app.id) {
    case 'gpay':
      return `upi://pay?${params}`;
    case 'phonepe':
      return `phonepe://pay?${params}`;
    case 'paytm':
      return `paytmmp://pay?${params}`;
    case 'bhim':
      return `bhim://pay?${params}`;
    case 'amazonpay':
      return `amazonpay://pay?${params}`;
    default:
      return `upi://pay?${params}`;
  }
}

/**
 * Check if a UPI app is installed on the device
 */
export async function isUPIAppInstalled(app: UPIApp): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // For Android, we'll try to open the app and catch the error
      const testUrl = `${app.packageName}://test`;
      return await Linking.canOpenURL(testUrl);
    } else {
      // For iOS, check if the URL scheme is supported
      const testUrl = generateUPIUrl(app, {
        recipientUPI: 'test@upi',
        recipientName: 'Test',
        amount: 1,
        currency: 'INR',
      });
      return await Linking.canOpenURL(testUrl);
    }
  } catch (error) {
    console.log(`Error checking if ${app.name} is installed:`, error);
    return false;
  }
}

/**
 * Get list of installed UPI apps
 */
export async function getInstalledUPIApps(): Promise<UPIApp[]> {
  const installedApps: UPIApp[] = [];

  for (const app of UPI_APPS) {
    try {
      const isInstalled = await isUPIAppInstalled(app);
      if (isInstalled) {
        installedApps.push(app);
      }
    } catch (error) {
      console.log(`Error checking ${app.name}:`, error);
    }
  }

  return installedApps;
}

/**
 * Open UPI app for payment
 */
export async function openUPIApp(
  app: UPIApp,
  payment: PaymentRequest
): Promise<boolean> {
  try {
    const upiUrl = generateUPIUrl(app, payment);
    const canOpen = await Linking.canOpenURL(upiUrl);

    if (canOpen) {
      await Linking.openURL(upiUrl);
      return true;
    } else {
      Alert.alert(
        'App Not Found',
        `${app.name} is not installed on your device. Please install it from the App Store.`
      );
      return false;
    }
  } catch (error) {
    console.error(`Error opening ${app.name}:`, error);
    Alert.alert(
      'Error',
      `Failed to open ${app.name}. Please try again or use a different payment method.`
    );
    return false;
  }
}

/**
 * Open device's default UPI app with payment details
 */
export async function openDefaultUPIApp(
  payment: PaymentRequest
): Promise<boolean> {
  try {
    const defaultUrl = generateUPIUrl(UPI_APPS[0], payment); // Use GPay as default
    const canOpen = await Linking.canOpenURL(defaultUrl);

    if (canOpen) {
      await Linking.openURL(defaultUrl);
      return true;
    } else {
      Alert.alert(
        'No UPI App Found',
        'Please install a UPI app like Google Pay, PhonePe, or Paytm to make payments.'
      );
      return false;
    }
  } catch (error) {
    console.error('Error opening default UPI app:', error);
    Alert.alert('Error', 'Failed to open UPI app. Please try again.');
    return false;
  }
}

/**
 * Validate UPI ID format
 */
export function validateUPIId(upiId: string): boolean {
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId);
}

/**
 * Generate a unique transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `DIVIDO${timestamp}${random}`.toUpperCase();
}

/**
 * Record manual payment
 */
export async function recordManualPayment(
  payerId: string,
  payeeId: string,
  paymentData: ManualPaymentData
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    // This would typically make an API call to your backend
    const response = await fetch('/api/payments/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payerId,
        payeeId,
        ...paymentData,
        timestamp: new Date().toISOString(),
        status: 'completed',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        paymentId: result.paymentId,
      };
    } else {
      return {
        success: false,
        error: 'Failed to record payment',
      };
    }
  } catch (error) {
    console.error('Error recording manual payment:', error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

/**
 * Show payment options modal
 */
export function getPaymentOptions(): Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  type: 'upi' | 'manual';
}> {
  return [
    {
      id: 'upi_quick',
      title: 'Quick UPI Payment',
      subtitle: 'Open your default UPI app',
      icon: '⚡',
      color: '#10B981',
      type: 'upi',
    },
    {
      id: 'upi_choose',
      title: 'Choose UPI App',
      subtitle: 'Select from installed apps',
      icon: '📱',
      color: '#3B82F6',
      type: 'upi',
    },
    {
      id: 'manual_cash',
      title: 'Cash Payment',
      subtitle: 'Mark as paid in cash',
      icon: '💵',
      color: '#F59E0B',
      type: 'manual',
    },
    {
      id: 'manual_transfer',
      title: 'Bank Transfer',
      subtitle: 'Mark as paid via bank transfer',
      icon: '🏦',
      color: '#8B5CF6',
      type: 'manual',
    },
    {
      id: 'manual_other',
      title: 'Other Method',
      subtitle: 'Custom payment method',
      icon: '💳',
      color: '#6B7280',
      type: 'manual',
    },
  ];
}
