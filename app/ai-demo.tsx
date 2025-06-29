import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mic,
  MessageCircle,
  Sparkles,
  Send,
  Zap,
  Brain,
  Volume2,
} from 'lucide-react-native';

export default function AIDemoScreen() {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'voice-commands',
      title: '🎤 Voice Commands',
      description: 'Talk to Divvy naturally',
      examples: [
        'Remind John about the dinner money',
        'What\'s my balance?',
        'Help me split the restaurant bill',
      ],
      icon: Mic,
      color: '#10B981',
    },
    {
      id: 'smart-suggestions',
      title: '🧠 Smart Suggestions',
      description: 'AI analyzes your expenses',
      examples: [
        'Type "Uber to airport" → Auto-suggests Transport category',
        'AI estimates amounts based on description',
        'Get money-saving tips automatically',
      ],
      icon: Brain,
      color: '#8B5CF6',
    },
    {
      id: 'humorous-reminders',
      title: '😄 Funny Reminders',
      description: 'Send witty payment nudges',
      examples: [
        '💸 Hey Sarah! Your wallet called, it misses the $25 from dinner! 😉',
        '🍕 Pizza debt alert! Alex owes $15. Payment in pepperoni accepted! 🍕',
        '💰 Friendly reminder: That $30 isn\'t going to pay itself! 😊',
      ],
      icon: MessageCircle,
      color: '#F59E0B',
    },
    {
      id: 'voice-responses',
      title: '🔊 Voice Responses',
      description: 'Hear AI responses aloud',
      examples: [
        'Natural text-to-speech using Eleven Labs',
        'Multiple voice personalities available',
        'Audio plays automatically with responses',
      ],
      icon: Volume2,
      color: '#EF4444',
    },
  ];

  const quickActions = [
    {
      title: 'Ask About Balance',
      description: '"What do I owe?"',
      icon: '💰',
    },
    {
      title: 'Split Expense',
      description: '"Split dinner bill with friends"',
      icon: '🍽️',
    },
    {
      title: 'Send Reminder',
      description: '"Remind Alex about movie tickets"',
      icon: '🎬',
    },
    {
      title: 'Get Suggestions',
      description: '"Suggest categories for my expenses"',
      icon: '💡',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Assistant Demo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Sparkles size={32} color="#10B981" />
          </View>
          <Text style={styles.heroTitle}>Meet Divvy AI</Text>
          <Text style={styles.heroSubtitle}>
            Your intelligent expense assistant powered by Gemini AI and Eleven Labs
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 AI Features</Text>
          {features.map((feature) => {
            const IconComponent = feature.icon;
            const isSelected = selectedFeature === feature.id;
            
            return (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.featureCard,
                  isSelected && styles.featureCardSelected,
                ]}
                onPress={() => setSelectedFeature(isSelected ? null : feature.id)}
              >
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                    <IconComponent size={20} color={feature.color} />
                  </View>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
                
                {isSelected && (
                  <View style={styles.featureExamples}>
                    <Text style={styles.examplesTitle}>Examples:</Text>
                    {feature.examples.map((example, index) => (
                      <Text key={index} style={styles.exampleText}>
                        • {example}
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Try These Commands</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <View key={index} style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Setup Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Quick Setup</Text>
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>Ready to get started?</Text>
            <Text style={styles.setupDescription}>
              1. Get your Gemini API key from Google AI Studio{'\n'}
              2. Sign up for Eleven Labs and get your API key{'\n'}
              3. Add keys to your .env file{'\n'}
              4. Look for the floating 🤖 button in the app!
            </Text>
            <Text style={styles.setupNote}>
              📋 See AI_SETUP.md for detailed instructions
            </Text>
          </View>
        </View>

        {/* Demo CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              // This would normally open the AI assistant
              router.back();
            }}
          >
            <Zap size={20} color="#FFFFFF" />
            <Text style={styles.ctaButtonText}>Try the AI Assistant</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>
            Look for the floating AI button (🤖) on any screen
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  featureExamples: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  setupCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  setupDescription: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
    marginBottom: 12,
  },
  setupNote: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
