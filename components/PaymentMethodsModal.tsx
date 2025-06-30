import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import {
  X,
  CreditCard,
  Smartphone,
  Plus,
  Check,
  Settings,
} from 'lucide-react-native';
import {
  UPI_APPS,
  getInstalledUPIApps,
  type UPIApp,
} from '@/services/upi-payment-api';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  visible,
  onClose,
}) => {
  const [installedUPIApps, setInstalledUPIApps] = useState<UPIApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultUPIApp, setDefaultUPIApp] = useState<string>('');
  const [upiEnabled, setUpiEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      loadUPIApps();
    }
  }, [visible]);

  const loadUPIApps = async () => {
    setLoading(true);
    try {
      const apps = await getInstalledUPIApps();
      setInstalledUPIApps(apps);

      // Set first installed app as default if none selected
      if (apps.length > 0 && !defaultUPIApp) {
        setDefaultUPIApp(apps[0].id);
      }
    } catch (error) {
      console.error('Error loading UPI apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultUPI = (appId: string) => {
    setDefaultUPIApp(appId);
    // Save to user preferences
    // saveUserPreference('defaultUPIApp', appId);
  };

  const handleUPIToggle = (enabled: boolean) => {
    setUpiEnabled(enabled);
    // Save to user preferences
    // saveUserPreference('upiEnabled', enabled);
  };

  const openUPIAppSettings = (app: UPIApp) => {
    Alert.alert(
      `${app.name} Settings`,
      'This feature will allow you to configure app-specific settings.',
      [{ text: 'OK' }]
    );
  };

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
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>
            Manage your UPI apps and payment preferences
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* UPI Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>UPI Payments</Text>
              <Switch
                value={upiEnabled}
                onValueChange={handleUPIToggle}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor={upiEnabled ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Quick payments using your installed UPI apps
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Detecting UPI apps...</Text>
              </View>
            ) : installedUPIApps.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Smartphone size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No UPI Apps Found</Text>
                <Text style={styles.emptyText}>
                  Install UPI apps like Google Pay, PhonePe, or Paytm to enable
                  quick payments
                </Text>
              </View>
            ) : (
              <View style={styles.upiAppsContainer}>
                {installedUPIApps.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={[
                      styles.upiAppCard,
                      defaultUPIApp === app.id && styles.upiAppCardSelected,
                    ]}
                    onPress={() => handleSetDefaultUPI(app.id)}
                    disabled={!upiEnabled}
                  >
                    <View
                      style={[
                        styles.appIcon,
                        { backgroundColor: `${app.color}20` },
                      ]}
                    >
                      <Text style={styles.appEmoji}>{app.icon}</Text>
                    </View>

                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={styles.appDisplayName}>
                        {app.displayName}
                      </Text>
                    </View>

                    <View style={styles.appActions}>
                      {defaultUPIApp === app.id && (
                        <View style={styles.defaultBadge}>
                          <Check size={12} color="white" />
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => openUPIAppSettings(app)}
                      >
                        <Settings size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* All Available UPI Apps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All UPI Apps</Text>
            <Text style={styles.sectionDescription}>
              Apps available for UPI payments (install to use)
            </Text>

            <View style={styles.allAppsContainer}>
              {UPI_APPS.map((app) => {
                const isInstalled = installedUPIApps.some(
                  (installed) => installed.id === app.id
                );

                return (
                  <View
                    key={app.id}
                    style={[
                      styles.appListItem,
                      !isInstalled && styles.appListItemDisabled,
                    ]}
                  >
                    <View
                      style={[
                        styles.appIcon,
                        { backgroundColor: `${app.color}20` },
                      ]}
                    >
                      <Text style={styles.appEmoji}>{app.icon}</Text>
                    </View>

                    <View style={styles.appInfo}>
                      <Text
                        style={[
                          styles.appName,
                          !isInstalled && styles.appNameDisabled,
                        ]}
                      >
                        {app.name}
                      </Text>
                      <Text
                        style={[
                          styles.appDisplayName,
                          !isInstalled && styles.appDisplayNameDisabled,
                        ]}
                      >
                        {isInstalled ? 'Installed' : 'Not installed'}
                      </Text>
                    </View>

                    {isInstalled && (
                      <View style={styles.installedBadge}>
                        <Check size={16} color="#10B981" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Manual Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Payment Methods</Text>
            <Text style={styles.sectionDescription}>
              Alternative payment recording options
            </Text>

            <View style={styles.manualMethodsContainer}>
              {[
                {
                  id: 'cash',
                  name: 'Cash Payment',
                  icon: '💵',
                  description: 'Record cash transactions',
                },
                {
                  id: 'bank',
                  name: 'Bank Transfer',
                  icon: '🏦',
                  description: 'NEFT, RTGS, IMPS transfers',
                },
                {
                  id: 'other',
                  name: 'Other Methods',
                  icon: '💳',
                  description: 'Custom payment methods',
                },
              ].map((method) => (
                <View key={method.id} style={styles.manualMethodCard}>
                  <View style={styles.methodIcon}>
                    <Text style={styles.methodEmoji}>{method.icon}</Text>
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDescription}>
                      {method.description}
                    </Text>
                  </View>
                  <View style={styles.enabledBadge}>
                    <Check size={16} color="#10B981" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
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
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  upiAppsContainer: {
    gap: 12,
  },
  upiAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  upiAppCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appEmoji: {
    fontSize: 20,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  appNameDisabled: {
    color: '#9CA3AF',
  },
  appDisplayName: {
    fontSize: 14,
    color: '#6B7280',
  },
  appDisplayNameDisabled: {
    color: '#D1D5DB',
  },
  appActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
  },
  allAppsContainer: {
    gap: 8,
  },
  appListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appListItemDisabled: {
    opacity: 0.6,
  },
  installedBadge: {
    marginLeft: 'auto',
  },
  manualMethodsContainer: {
    gap: 12,
  },
  manualMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodEmoji: {
    fontSize: 18,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  enabledBadge: {
    marginLeft: 'auto',
  },
});

export default PaymentMethodsModal;
