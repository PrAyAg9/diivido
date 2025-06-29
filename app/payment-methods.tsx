import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit3, Trash2, CheckCircle } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'bank';
  name: string;
  identifier: string; // UPI ID, Card ending, Bank account
  icon: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'upi',
      name: 'Google Pay',
      identifier: 'user@okaxis',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo.svg',
      isDefault: true,
    },
    {
      id: '2',
      type: 'upi',
      name: 'PhonePe',
      identifier: 'user@ybl',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/PhonePe_logo.svg',
      isDefault: false,
    },
    {
      id: '3',
      type: 'upi',
      name: 'Paytm',
      identifier: 'user@paytm',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo.jpg',
      isDefault: false,
    },
  ]);

  const [newUpiId, setNewUpiId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddUpi = () => {
    if (!newUpiId.trim()) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }

    if (!newUpiId.includes('@')) {
      Alert.alert('Error', 'Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'upi',
      name: 'UPI',
      identifier: newUpiId.trim(),
      icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg',
      isDefault: false,
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewUpiId('');
    setShowAddForm(false);
    Alert.alert('Success', 'UPI ID added successfully');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(methods => methods.filter(method => method.id !== id));
          },
        },
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.paymentMethodCard}>
      <View style={styles.methodInfo}>
        <Image source={{ uri: method.icon }} style={styles.methodIcon} />
        <View style={styles.methodDetails}>
          <Text style={styles.methodName}>{method.name}</Text>
          <Text style={styles.methodIdentifier}>{method.identifier}</Text>
        </View>
        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <View style={styles.methodActions}>
        {!method.isDefault && (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(method.id)}
          >
            <Text style={styles.setDefaultText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(method.id)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>UPI Payment Methods</Text>
        <Text style={styles.sectionDescription}>
          Add your UPI IDs for quick payments and settlements
        </Text>

        {paymentMethods.map(renderPaymentMethod)}

        {showAddForm ? (
          <View style={styles.addForm}>
            <TextInput
              style={styles.upiInput}
              placeholder="Enter UPI ID (e.g., user@paytm)"
              value={newUpiId}
              onChangeText={setNewUpiId}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setNewUpiId('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddUpi}>
                <Text style={styles.addButtonText}>Add UPI</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => setShowAddForm(true)}
          >
            <Plus size={20} color="#10B981" />
            <Text style={styles.addNewButtonText}>Add New UPI ID</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • Your UPI IDs are used for quick payments and settlements{'\n'}
            • Set a default payment method for faster transactions{'\n'}
            • Your payment information is stored securely{'\n'}
            • You can add multiple UPI IDs from different providers
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  methodIdentifier: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  methodActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setDefaultButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setDefaultText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  deleteButton: {
    padding: 8,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  addNewButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginLeft: 8,
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  upiInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});
