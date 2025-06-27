import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Users, DollarSign, ChartPie as PieChart, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const features = [
  {
    icon: Users,
    title: 'Split with Friends',
    description: 'Easily split expenses with roommates, friends, and family',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    icon: DollarSign,
    title: 'Track Expenses',
    description: 'Keep track of all your shared expenses in one place',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    icon: PieChart,
    title: 'Smart Analytics',
    description: 'Get insights into your spending patterns and habits',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Sparkles size={32} color="#FFFFFF" />
            </View>
          </View>
          
          <Text style={styles.title}>Welcome to Divido</Text>
          <Text style={styles.subtitle}>
            The smartest way to split expenses and settle up with friends
          </Text>

          {/* Hero Image with Overlay */}
          <View style={styles.heroImageContainer}>
            <Image
              source={{
                uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroCard}>
                <Text style={styles.heroCardTitle}>Dinner with Friends</Text>
                <Text style={styles.heroCardAmount}>$84.50</Text>
                <Text style={styles.heroCardSplit}>Split 4 ways • You owe $21.13</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why choose Divido?</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                <feature.icon size={24} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <Text style={styles.trustText}>Trusted by thousands of users worldwide</Text>
          <View style={styles.trustStats}>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>50K+</Text>
              <Text style={styles.trustLabel}>Active Users</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>$2M+</Text>
              <Text style={styles.trustLabel}>Split Successfully</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>4.9★</Text>
              <Text style={styles.trustLabel}>App Rating</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions - Fixed */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started Free</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Math.max(40, height * 0.05),
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: Math.min(36, width * 0.09),
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: Math.min(44, width * 0.11),
  },
  subtitle: {
    fontSize: Math.min(18, width * 0.045),
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: Math.min(26, width * 0.065),
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  heroImageContainer: {
    position: 'relative',
    width: Math.min(width - 48, 400),
    height: Math.min(200, width * 0.5),
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  heroCardAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  heroCardSplit: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  trustSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  trustText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  trustStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  trustStat: {
    alignItems: 'center',
  },
  trustNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  trustLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: Math.max(32, height * 0.04),
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});