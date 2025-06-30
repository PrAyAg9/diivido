import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Mail, ExternalLink } from 'lucide-react-native';

export default function PrivacySettingsScreen() {
  const router = useRouter();

  const handleContactDeveloper = () => {
    Linking.openURL(
      'mailto:prayag.thakur@example.com?subject=Divido App Inquiry'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Shield size={32} color="#10B981" />
          </View>
          <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
          <Text style={styles.privacyDescription}>
            We are committed to protecting your personal information and
            ensuring your data remains secure.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Protection</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionText}>
              • All financial data is encrypted and stored securely{'\n'}• We
              never share your personal information with third parties{'\n'}•
              Your payment details are processed through secure channels{'\n'}•
              Group expenses are only visible to group members
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionText}>
              • Basic profile information (name, email, phone){'\n'}• Expense
              and group data you create{'\n'}• Payment preferences and UPI IDs
              {'\n'}• Usage analytics to improve the app experience
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionText}>
              • Request a copy of your data{'\n'}• Delete your account and
              associated data{'\n'}• Opt-out of non-essential communications
              {'\n'}• Control your visibility in group searches
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactDeveloper}
        >
          <Mail size={20} color="#10B981" />
          <Text style={styles.contactButtonText}>Contact Developer</Text>
          <ExternalLink size={16} color="#10B981" />
        </TouchableOpacity>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>
            Divido - Expense Sharing Made Simple
          </Text>
          <Text style={styles.footerText}>Made with ❤️ by Prayag Thakur</Text>
          <Text style={styles.copyrightText}>
            © 2025 Prayag Thakur. All rights reserved.
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
  privacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  privacyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  privacyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginHorizontal: 8,
  },
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
