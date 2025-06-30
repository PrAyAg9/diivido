import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  X,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  MoreHorizontal,
  ArrowRight,
  Check,
  Upload,
  Camera,
} from 'lucide-react-native';
import {
  UPI_APPS,
  getInstalledUPIApps,
  openUPIApp,
  openDefaultUPIApp,
  validateUPIId,
  generateTransactionId,
  recordManualPayment,
  getPaymentOptions,
  type UPIApp,
  type PaymentRequest,
  type ManualPaymentData,
} from '@/services/upi-payment-api';
import { formatCurrency, type Currency } from '@/utils/currency';
import Avatar from '@/components/Avatar';
import ReceiptUpload from '@/components/ReceiptUpload';

const { width } = Dimensions.get('window');

interface SettleUpModalProps {
  visible: boolean;
  onClose: () => void;
  payeeUser: {
    id: string;
    name: string;
    avatarUrl?: string;
    upiId?: string;
  };
  amount: number;
  currency: Currency;
  groupId?: string;
  onPaymentComplete: (paymentData: any) => void;
}

const SettleUpModal: React.FC<SettleUpModalProps> = ({
  visible,
  onClose,
  payeeUser,
  amount,
  currency,
  groupId,
  onPaymentComplete,
}) => {
  const [step, setStep] = useState<
    'options' | 'upi_apps' | 'manual_form' | 'upi_form'
  >('options');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [installedUPIApps, setInstalledUPIApps] = useState<UPIApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState(payeeUser.upiId || '');
  const [note, setNote] = useState('');
  const [manualPaymentData, setManualPaymentData] = useState<
    Partial<ManualPaymentData>
  >({
    paymentMethod: 'cash',
  });
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadInstalledUPIApps();
      setNote(`Settlement for ${payeeUser.name}`);
    }
  }, [visible, payeeUser.name]);

  const loadInstalledUPIApps = async () => {
    try {
      const apps = await getInstalledUPIApps();
      setInstalledUPIApps(apps);
    } catch (error) {
      console.error('Error loading UPI apps:', error);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);

    switch (optionId) {
      case 'upi_quick':
        handleQuickUPIPayment();
        break;
      case 'upi_choose':
        setStep('upi_apps');
        break;
      case 'manual_cash':
        setManualPaymentData({ paymentMethod: 'cash' });
        setStep('manual_form');
        break;
      case 'manual_transfer':
        setManualPaymentData({ paymentMethod: 'bank_transfer' });
        setStep('manual_form');
        break;
      case 'manual_other':
        setManualPaymentData({ paymentMethod: 'other' });
        setStep('manual_form');
        break;
      default:
        setStep('upi_form');
    }
  };

  const handleQuickUPIPayment = async () => {
    if (!upiId) {
      setStep('upi_form');
      return;
    }

    if (!validateUPIId(upiId)) {
      Alert.alert('Invalid UPI ID', 'Please check the UPI ID and try again.');
      return;
    }

    setLoading(true);

    const paymentRequest: PaymentRequest = {
      recipientUPI: upiId,
      recipientName: payeeUser.name,
      amount,
      currency,
      note,
      transactionId: generateTransactionId(),
    };

    try {
      const success = await openDefaultUPIApp(paymentRequest);
      if (success) {
        // Record the payment attempt
        onPaymentComplete({
          type: 'upi',
          app: 'default',
          transactionId: paymentRequest.transactionId,
          amount,
          currency,
          recipientId: payeeUser.id,
          status: 'pending',
        });
        onClose();
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      Alert.alert('Error', 'Failed to open UPI app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIAppSelect = async (app: UPIApp) => {
    if (!upiId) {
      setStep('upi_form');
      return;
    }

    if (!validateUPIId(upiId)) {
      Alert.alert('Invalid UPI ID', 'Please check the UPI ID and try again.');
      return;
    }

    setLoading(true);

    const paymentRequest: PaymentRequest = {
      recipientUPI: upiId,
      recipientName: payeeUser.name,
      amount,
      currency,
      note,
      transactionId: generateTransactionId(),
    };

    try {
      const success = await openUPIApp(app, paymentRequest);
      if (success) {
        onPaymentComplete({
          type: 'upi',
          app: app.id,
          transactionId: paymentRequest.transactionId,
          amount,
          currency,
          recipientId: payeeUser.id,
          status: 'pending',
        });
        onClose();
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      Alert.alert('Error', `Failed to open ${app.name}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPayment = async () => {
    if (!manualPaymentData.paymentMethod) {
      Alert.alert('Error', 'Please select a payment method.');
      return;
    }

    setLoading(true);

    const paymentData: ManualPaymentData = {
      amount,
      currency,
      recipientName: payeeUser.name,
      paymentMethod: manualPaymentData.paymentMethod!,
      note: manualPaymentData.note || note,
      receiptUrl,
    };

    try {
      const result = await recordManualPayment(
        'current-user-id', // This should come from auth context
        payeeUser.id,
        paymentData
      );

      if (result.success) {
        onPaymentComplete({
          type: 'manual',
          method: paymentData.paymentMethod,
          paymentId: result.paymentId,
          amount,
          currency,
          recipientId: payeeUser.id,
          status: 'completed',
          receiptUrl,
        });
        Alert.alert(
          'Payment Recorded',
          'Your payment has been recorded successfully.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording manual payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIFormSubmit = () => {
    if (!validateUPIId(upiId)) {
      Alert.alert(
        'Invalid UPI ID',
        'Please enter a valid UPI ID (e.g., user@paytm)'
      );
      return;
    }
    handleQuickUPIPayment();
  };

  const renderOptions = () => (
    <View style={styles.content}>
      <Text style={styles.subtitle}>Choose a payment method</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {getPaymentOptions().map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              index === getPaymentOptions().length - 1 && styles.lastOption,
            ]}
            onPress={() => handleOptionSelect(option.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: `${option.color}20` },
              ]}
            >
              <Text style={styles.optionEmoji}>{option.icon}</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <ArrowRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUPIApps = () => (
    <View style={styles.content}>
      <Text style={styles.subtitle}>Select UPI App</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {installedUPIApps.map((app, index) => (
          <TouchableOpacity
            key={app.id}
            style={[
              styles.optionCard,
              index === installedUPIApps.length - 1 && styles.lastOption,
            ]}
            onPress={() => handleUPIAppSelect(app)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.optionIcon, { backgroundColor: `${app.color}20` }]}
            >
              <Text style={styles.optionEmoji}>{app.icon}</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{app.name}</Text>
              <Text style={styles.optionSubtitle}>{app.displayName}</Text>
            </View>
            <ArrowRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {installedUPIApps.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No UPI apps found</Text>
            <Text style={styles.emptySubtext}>
              Install apps like Google Pay, PhonePe, or Paytm to continue
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderUPIForm = () => (
    <View style={styles.content}>
      <Text style={styles.subtitle}>Enter UPI Details</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>UPI ID</Text>
          <TextInput
            style={styles.textInput}
            value={upiId}
            onChangeText={setUpiId}
            placeholder="Enter UPI ID (e.g., user@paytm)"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Note (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={note}
            onChangeText={setNote}
            placeholder="Payment note"
            multiline
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleUPIFormSubmit}
          disabled={loading || !upiId}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Continue to Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderManualForm = () => (
    <View style={styles.content}>
      <Text style={styles.subtitle}>Record Manual Payment</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Payment Method</Text>
          <View style={styles.methodButtons}>
            {[
              { id: 'cash', label: 'Cash', icon: '💵' },
              { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
              { id: 'other', label: 'Other', icon: '💳' },
            ].map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  manualPaymentData.paymentMethod === method.id &&
                    styles.methodButtonActive,
                ]}
                onPress={() =>
                  setManualPaymentData((prev) => ({
                    ...prev,
                    paymentMethod: method.id as any,
                  }))
                }
              >
                <Text style={styles.methodEmoji}>{method.icon}</Text>
                <Text
                  style={[
                    styles.methodLabel,
                    manualPaymentData.paymentMethod === method.id &&
                      styles.methodLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Note (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={manualPaymentData.note}
            onChangeText={(text) =>
              setManualPaymentData((prev) => ({ ...prev, note: text }))
            }
            placeholder="Payment details"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Receipt (Optional)</Text>
          <ReceiptUpload
            receiptUrl={receiptUrl}
            onReceiptChange={(url: string | null) => setReceiptUrl(url || '')}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleManualPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Record Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.title}>Settle Up</Text>
            <View style={styles.paymentDetails}>
              <Avatar
                imageUrl={payeeUser.avatarUrl}
                name={payeeUser.name}
                size={40}
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.payeeName}>{payeeUser.name}</Text>
                <Text style={styles.amount}>
                  {formatCurrency(amount, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {step === 'options' && renderOptions()}
        {step === 'upi_apps' && renderUPIApps()}
        {step === 'upi_form' && renderUPIForm()}
        {step === 'manual_form' && renderManualForm()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  headerContent: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  paymentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentInfo: {
    marginLeft: 12,
  },
  payeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastOption: {
    marginBottom: 0,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  methodButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFEFF',
  },
  methodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  methodLabelActive: {
    color: '#10B981',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettleUpModal;
