import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { X, Shield, Settings, Bell, HelpCircle, Users, UserPlus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface InfoPopupProps {
  visible: boolean;
  onClose: () => void;
  type: 'privacy' | 'settings' | 'notifications' | 'help' | 'friends' | 'invite';
}

const InfoPopup: React.FC<InfoPopupProps> = ({ visible, onClose, type }) => {
  const getPopupContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Settings',
          icon: Shield,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>
                Your privacy is important to us. Here are your privacy controls:
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Protection</Text>
                <Text style={styles.sectionText}>
                  • All financial data is encrypted and securely stored
                  {'\n'}• We never share your personal information with third parties
                  {'\n'}• You can delete your account and data at any time
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sharing Controls</Text>
                <Text style={styles.sectionText}>
                  • Group expenses are only visible to group members
                  {'\n'}• You control who can add you to groups
                  {'\n'}• Your profile information is only shared with connected friends
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };

      case 'settings':
        return {
          title: 'App Settings',
          icon: Settings,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>
                Manage your app preferences and configurations:
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <Text style={styles.sectionText}>
                  • Update profile information from the profile screen
                  {'\n'}• Change currency preferences
                  {'\n'}• Manage notification settings
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <Text style={styles.sectionText}>
                  • Export your data anytime
                  {'\n'}• Clear app cache to free up space
                  {'\n'}• Backup and restore settings
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };

      case 'notifications':
        return {
          title: 'Notification Settings',
          icon: Bell,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>
                Control how you receive notifications:
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Push Notifications</Text>
                <Text style={styles.sectionText}>
                  • Get notified when expenses are added
                  {'\n'}• Receive payment reminders
                  {'\n'}• Group activity updates
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Email Notifications</Text>
                <Text style={styles.sectionText}>
                  • Weekly expense summaries
                  {'\n'}• Important account updates
                  {'\n'}• Security alerts
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Smart Notifications</Text>
                <Text style={styles.sectionText}>
                  • AI-powered spending insights
                  {'\n'}• Budget alerts and recommendations
                  {'\n'}• Personalized financial tips
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };

      case 'help':
        return {
          title: 'Help & Support',
          icon: HelpCircle,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>
                Need help? We're here to assist you:
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Getting Started</Text>
                <Text style={styles.sectionText}>
                  • Create your first group and add expenses
                  {'\n'}• Invite friends and split bills easily
                  {'\n'}• Track balances and settle up
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common Questions</Text>
                <Text style={styles.sectionText}>
                  • How to split expenses unequally?
                  {'\n'}• How to handle different currencies?
                  {'\n'}• How to settle up using UPI apps?
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Support</Text>
                <Text style={styles.sectionText}>
                  • Email: support@divido.app
                  {'\n'}• WhatsApp: +91 9876543210
                  {'\n'}• In-app chat support available 24/7
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };

      case 'friends':
        return {
          title: 'Manage Friends',
          icon: Users,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>
                Manage your friends and connections:
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                <Text style={styles.sectionText}>
                  • View and respond to pending friend requests
                  {'\n'}• Control who can send you friend requests
                  {'\n'}• Block or unblock users
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connected Friends</Text>
                <Text style={styles.sectionText}>
                  • See all your connected friends
                  {'\n'}• View shared group memberships
                  {'\n'}• Quick access to settle up
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy Controls</Text>
                <Text style={styles.sectionText}>
                  • Choose who can add you to groups
                  {'\n'}• Control visibility of your profile
                  {'\n'}• Manage friend list privacy
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };

      case 'invite':
        return {
          title: 'Invite Friends',
          icon: UserPlus,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>
                Invite your friends to join Divido and make expense splitting easier:
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Share the App</Text>
                <Text style={styles.sectionText}>
                  • Send invitation links via WhatsApp, Telegram, or SMS
                  {'\n'}• Share on social media platforms
                  {'\n'}• Email invitations directly from the app
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Referral Benefits</Text>
                <Text style={styles.sectionText}>
                  • Get premium features for successful referrals
                  {'\n'}• Unlock exclusive themes and customizations
                  {'\n'}• Early access to new features
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How It Works</Text>
                <Text style={styles.sectionText}>
                  • Your friends download the app using your link
                  {'\n'}• They create an account and add their first expense
                  {'\n'}• You both get rewarded with premium features!
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };

      default:
        return {
          title: 'Information',
          icon: Settings,
          content: (
            <View style={styles.content}>
              <Text style={styles.description}>Information not available.</Text>
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 All rights reserved to Prayag Thakur
                </Text>
              </View>
            </View>
          ),
        };
    }
  };

  const { title, icon: Icon, content } = getPopupContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Icon size={24} color="#10B981" />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default InfoPopup;
