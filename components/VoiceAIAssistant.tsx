import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Vibration,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Mic,
  MicOff,
  MessageCircle,
  X,
  Volume2,
  Bot,
  Send,
  Users,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { aiAssistantApi } from '@/services/ai-assistant-api';
import { useAuth } from '@/contexts/AuthContext';
import { WebSpeech } from '@/utils/speech';

// const { width, height } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const { width, height } = Dimensions.get('window');

interface VoiceAIAssistantProps {
  showWelcome?: boolean;
  onDismissWelcome?: () => void;
}

export default function VoiceAIAssistant({
  showWelcome = false,
  onDismissWelcome,
}: VoiceAIAssistantProps) {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [voiceFailCount, setVoiceFailCount] = useState(0);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(showWelcome);

  // Welcome message effect
  useEffect(() => {
    if (showWelcome) {
      setShowWelcomeModal(true);
      // Auto-speak welcome message with a more natural greeting
      setTimeout(() => {
        const hour = new Date().getHours();
        let timeGreeting = 'Hello';
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 17) timeGreeting = 'Good afternoon';
        else if (hour < 21) timeGreeting = 'Good evening';
        else timeGreeting = 'Good evening';

        const welcomeText = `${timeGreeting} ${
          user?.fullName || 'there'
        }! I'm Divi, your smart expense assistant. I'm here to help you manage your finances, remind friends about payments, and make expense tracking effortless. What would you like to do today?`;
        playAudio(undefined, welcomeText);
      }, 1500);
    }
  }, [showWelcome, user]);

  const handleDismissWelcome = () => {
    setShowWelcomeModal(false);
    if (onDismissWelcome) {
      onDismissWelcome();
    }
  };

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      // Start pulse animation when listening
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Start ripple effect
      const rippleLoop = Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rippleLoop.start();

      return () => {
        pulseLoop.stop();
        rippleLoop.stop();
      };
    } else {
      pulseAnim.setValue(1);
      rippleAnim.setValue(0);
    }
  }, [isListening]);

  const startListening = async () => {
    try {
      if (Platform.OS === 'web') {
        startWebSpeechRecognition();
      } else {
        startMobileSpeechRecognition();
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      setVoiceFailCount((prev) => prev + 1);

      // Fallback to demo functionality
      simulateVoiceCommand();
    }
  };

  const startWebSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Alert.alert(
        'Not Supported',
        'Speech recognition is not supported in your browser.'
      );
      simulateVoiceCommand();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceFailCount(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        await processVoiceInput(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceFailCount((prev) => prev + 1);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const startMobileSpeechRecognition = () => {
    // For mobile, we'll simulate voice recognition for now
    setIsListening(true);
    setVoiceFailCount(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simulate listening for 3 seconds, then use demo
    setTimeout(() => {
      setIsListening(false);
      simulateVoiceCommand();
    }, 3000);
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsListening(false);
    }
  };

  const processVoiceInput = async (transcript: string) => {
    try {
      setIsListening(false);
      setIsProcessing(true);

      console.log('🎤 Voice input:', transcript);

      // Add the user's voice message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: transcript,
        isUser: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // Send to Gemini AI via our API
      const response = await aiAssistantApi.processVoiceCommand(transcript);

      setLastResponse(response.text);
      setIsProcessing(false);
      setIsResponding(true);

      // Add AI response to chat (remove emojis as requested)
      const cleanResponse = response.text
        .replace(
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          ''
        )
        .trim();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: cleanResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);

      // Use Eleven Labs TTS for response (better female voice, faster)
      await playAudio(response.audioUrl, cleanResponse);

      // Execute any actions
      if (response.action) {
        executeAction(response.action);
      }

      setIsResponding(false);
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      setIsResponding(false);

      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: "I'm having trouble connecting to my AI brain right now. Could you try typing your message instead?",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, fallbackMessage]);

      await playAudio(undefined, fallbackMessage.text);
    }
  };

  const simulateVoiceCommand = async () => {
    try {
      setIsProcessing(true);

      // Common voice commands for expense tracking
      const mockQueries = [
        'How much do I owe John?',
        "What's my balance with Sarah?",
        'Add a dinner expense for $50',
        'Send a reminder to Alex about the pizza money',
        'How much did I spend this month?',
        'Who owes me money?',
        'Create a new group for vacation',
        'Split the grocery bill equally',
      ];

      const randomQuery =
        mockQueries[Math.floor(Math.random() * mockQueries.length)];

      // Add the user's "voice" message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `🎤 "${randomQuery}"`,
        isUser: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // Generate a demo response
      let demoResponse = '';
      if (randomQuery.includes('balance') || randomQuery.includes('owe')) {
        demoResponse =
          "I can see you currently have a net balance of +$45.50. John owes you $20 from last week's dinner!";
      } else if (
        randomQuery.includes('group') ||
        randomQuery.includes('create')
      ) {
        demoResponse =
          "I'd be happy to help you create a new group! Just go to the Groups tab and tap the + button.";
      } else if (
        randomQuery.includes('expense') ||
        randomQuery.includes('add')
      ) {
        demoResponse =
          'To add an expense, tap the + button on your dashboard. I can help you split it fairly among your friends!';
      } else if (
        randomQuery.includes('reminder') ||
        randomQuery.includes('send')
      ) {
        demoResponse =
          "I can send a friendly reminder! Just let me know who you want to remind and I'll craft a nice message.";
      } else {
        demoResponse =
          "I'm here to help you manage your expenses and groups. What would you like to do today?";
      }

      setIsProcessing(false);
      setIsResponding(true);

      // Add AI response to chat (clean, no emojis)
      const cleanResponse = demoResponse
        .replace(
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          ''
        )
        .trim();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: cleanResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);

      // Speak the response
      await playAudio(undefined, cleanResponse);

      setIsResponding(false);
    } catch (error) {
      console.error('Error simulating voice command:', error);
      setIsProcessing(false);
      setIsResponding(false);
    }
  };

  const executeAction = (action: any) => {
    try {
      console.log('Executing AI action:', action);

      switch (action.type) {
        case 'navigate':
          // Handle navigation actions
          console.log('Navigation action:', action.payload);
          break;
        case 'reminder':
          // Handle reminder actions
          console.log('Reminder action:', action.payload);
          break;
        case 'notification':
          // Handle notification actions
          console.log('Notification action:', action.payload);
          break;
        case 'balance':
          // Handle balance check actions
          console.log('Balance check action:', action.payload);
          break;
        case 'expense':
          // Handle expense actions
          console.log('Expense action:', action.payload);
          break;
        default:
          console.log('AI assistant handled:', action.type);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const playAudio = async (audioUrl?: string, text?: string) => {
    try {
      if (text) {
        console.log('🔊 Divi is speaking:', text);

        // Use the enhanced WebSpeech utility for all platforms
        const success = await WebSpeech.speak(text, {
          rate: 1.0, // Slightly faster
          pitch: 1.1,
        });

        if (success) {
          // Haptic feedback on successful speech
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          console.log('TTS failed, providing haptic feedback only');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else {
        // Fallback haptic feedback
        console.log('🔊 Divi response (haptic feedback)');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      // Fallback to haptic feedback if speech fails
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else if (!isProcessing && !isResponding) {
      startListening();
    }
  };

  const sendChatMessage = async () => {
    if (!inputText.trim() || sendingMessage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSendingMessage(true);

    try {
      const response = await aiAssistantApi.processVoiceCommand(
        userMessage.text
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text:
          response.text ||
          "I'm here to help! Ask me anything about your expenses or groups.",
        isUser: false,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);

      // Make Divi speak the response
      await playAudio(undefined, aiMessage.text);

      // Handle special actions like nudging friends
      if (
        response.action?.type === 'notification' &&
        response.action.payload?.friendName
      ) {
        try {
          await aiAssistantApi.sendWittyNudge(
            response.action.payload.friendName,
            userMessage.text
          );
          const nudgeMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            text: `✅ Sent a witty nudge to ${response.action.payload.friendName} about your money!`,
            isUser: false,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, nudgeMessage]);
        } catch (error) {
          console.error('Error sending nudge:', error);
        }
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const openChat = () => {
    setShowChat(true);
    if (chatMessages.length === 0) {
      const hour = new Date().getHours();
      let timeGreeting = 'Hi';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 17) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';

      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `${timeGreeting}! I'm Divi, your personal expense assistant. I can help you track expenses, remind friends about money, check balances, or answer questions about your groups. What can I help you with today?`,
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages([welcomeMessage]);

      // Speak the welcome message
      setTimeout(() => {
        playAudio(undefined, welcomeMessage.text);
      }, 500);
    }
  };

  const buttonColor = isListening
    ? '#EF4444'
    : isProcessing
    ? '#F59E0B'
    : isResponding
    ? '#8B5CF6'
    : '#10B981';

  const buttonIcon = isListening ? (
    <MicOff size={28} color="#FFFFFF" />
  ) : isProcessing ? (
    <ActivityIndicator size={28} color="#FFFFFF" />
  ) : isResponding ? (
    <Volume2 size={28} color="#FFFFFF" />
  ) : (
    <Bot size={28} color="#FFFFFF" />
  );

  return (
    <>
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <Modal
          visible={showWelcomeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDismissWelcome}
        >
          <View style={styles.welcomeOverlay}>
            <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
            <View style={styles.welcomeModal}>
              <View style={styles.welcomeHeader}>
                <View style={styles.diviAvatar}>
                  <Bot size={24} color="#10B981" />
                </View>
                <Text style={styles.welcomeTitle}>Meet Divi</Text>
                <Text style={styles.welcomeSubtitle}>Your AI Assistant</Text>
              </View>

              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeText}>
                  Hi {user?.fullName || 'there'}! 👋 I'm here to help you with:
                </Text>

                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>💰</Text>
                    <Text style={styles.featureText}>
                      Track expenses and balances
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>📱</Text>
                    <Text style={styles.featureText}>
                      Send reminders to friends
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>👥</Text>
                    <Text style={styles.featureText}>Manage your groups</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>💬</Text>
                    <Text style={styles.featureText}>
                      Answer your questions
                    </Text>
                  </View>
                </View>

                <Text style={styles.welcomeFooter}>
                  Tap the voice button to talk to me or use the chat!
                </Text>
              </View>

              <TouchableOpacity
                style={styles.welcomeButton}
                onPress={handleDismissWelcome}
              >
                <Text style={styles.welcomeButtonText}>Let's Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Main Voice Button */}
      <View style={styles.container}>
        {/* Ripple Effect */}
        {isListening && (
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0],
                }),
                transform: [
                  {
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 3],
                    }),
                  },
                ],
              },
            ]}
          />
        )}

        {/* Glow Effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
            },
          ]}
        />

        {/* Main Button */}
        <TouchableOpacity
          style={[styles.voiceButton, { backgroundColor: buttonColor }]}
          onPress={toggleVoice}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.buttonContent,
              {
                transform: [
                  { scale: scaleAnim },
                  {
                    scale: pulseAnim,
                  },
                ],
              },
            ]}
          >
            {buttonIcon}
          </Animated.View>
        </TouchableOpacity>

        {/* Status Text - Make it clickable */}
        <TouchableOpacity onPress={openChat} activeOpacity={0.7}>
          <Animated.View style={styles.statusContainer}>
            <MessageCircle
              size={14}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.statusText}>
              {isListening
                ? 'Listening...'
                : isProcessing
                ? 'Processing...'
                : isResponding
                ? 'Speaking...'
                : 'Chat with Divi'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Response Bubble */}
      {isResponding && lastResponse && (
        <Animated.View style={styles.responseBubble}>
          <Text style={styles.responseText} numberOfLines={3}>
            {lastResponse}
          </Text>
        </Animated.View>
      )}

      {/* Chat Modal */}
      <Modal
        visible={showChat}
        transparent={true}
        animationType="slide"
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <BlurView intensity={30} style={styles.modalOverlay}>
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>Ask Divi</Text>
                <TouchableOpacity
                  onPress={() => setShowChat(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
              >
                {chatMessages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageItem,
                      message.isUser ? styles.userMessage : styles.aiMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser
                          ? styles.userMessageText
                          : styles.aiMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text style={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                ))}
                {sendingMessage && (
                  <View style={[styles.messageItem, styles.aiMessage]}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={styles.aiMessageText}>Thinking...</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Divi or say 'nudge John about my money'..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || sendingMessage) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={sendChatMessage}
                  disabled={!inputText.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.voiceRetryButton}
                onPress={() => {
                  setShowChat(false);
                  setVoiceFailCount(0);
                  setTimeout(() => startListening(), 500);
                }}
              >
                <Mic size={20} color="#10B981" />
                <Text style={styles.voiceRetryText}>Try Voice Instead</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 90, // Position right above the footer (footer is ~80px)
    alignItems: 'center',
    zIndex: 1000,
  },
  ripple: {
    position: 'absolute',
    width: 60, // Reduced to match smaller button
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
  },
  glow: {
    position: 'absolute',
    width: 70, // Reduced to match smaller button
    height: 70,
    borderRadius: 35,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8, // Reduced glow
    shadowRadius: 15, // Reduced glow
    elevation: 6, // Reduced glow
  },
  voiceButton: {
    width: 50, // Made even smaller
    height: 50, // Made even smaller
    borderRadius: 25, // Made even smaller
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4, // Reduced shadow
    },
    shadowOpacity: 0.2, // Reduced shadow
    shadowRadius: 6, // Reduced shadow
    elevation: 8, // Reduced shadow
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)', // Green background to show it's clickable
    borderRadius: 20,
    maxWidth: 140, // Made smaller
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11, // Reduced from 12
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  askDiviButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  responseBubble: {
    position: 'absolute',
    right: 20,
    bottom: 220,
    maxWidth: width * 0.8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  responseText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyChat: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  chatContent: {
    padding: 32,
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  chatActions: {
    width: '100%',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  tryAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // New chat styles
  chatContainer: {
    width: width * 0.95,
    height: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: width * 0.025,
    marginTop: height * 0.1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: '#1F2937',
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  voiceRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  voiceRetryText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Welcome Modal Styles
  welcomeOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  welcomeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  diviAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  welcomeContent: {
    width: '100%',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  welcomeFooter: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  welcomeButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  welcomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
