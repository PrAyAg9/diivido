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
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import {
  Mic,
  MicOff,
  MessageCircle,
  X,
  Volume2,
  Zap,
  Send,
  Users,
  Bot,
  Sparkles, // <-- FIXED: Added missing import
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// --- Mocking for standalone example ---
const aiAssistantApi = {
  processVoiceCommand: async (command: string) => {
    console.log('Processing command:', command);
    await new Promise(res => setTimeout(res, 1500));
    return {
      text: `I've processed your command about: "${command}". In a real app, I would perform an action.`,
      audioUrl: null,
      action: { type: 'CONFIRMATION', details: command },
    };
  },
  getVoiceBalanceSummary: async () => {
      await new Promise(res => setTimeout(res, 1500));
      return {
          text: "Here's your balance summary: You are owed $50 and you owe $20. Your net balance is $30.",
          audioUrl: null,
      }
  }
};
// --- End of Mocking ---


const { width, height } = Dimensions.get('window');

// FIXED: Defined missing AIMessage type
interface AIMessage {
  id: string;
  text: string;
  isUser: boolean;
  audioUrl?: string | null;
  timestamp: Date;
  action?: AIAction;
}

interface AIAction {
  type: 'nudge' | 'reminder' | 'balance' | 'general';
  payload: any;
}

export default function FloatingAIAssistant() {
  // FIXED: Declared all necessary state variables
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatFallback, setShowChatFallback] = useState(false);
  const [voiceFailCount, setVoiceFailCount] = useState(0);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current; // <-- FIXED: Declared slideAnim
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current; // <-- FIXED: Declared sparkleAnim

  useEffect(() => {
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();

    return () => {
      sparkleLoop.stop();
      if (sound) sound.unloadAsync();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, [sound, recording]); // Added dependencies

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [isExpanded]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please enable microphone access to use voice commands.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsListening(true); // <-- FIXED: Changed from setIsRecording to setIsListening

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsListening(false); // <-- FIXED: Changed from setIsRecording to setIsListening
    setIsProcessing(true);
    pulseAnim.stopAnimation(() => pulseAnim.setValue(1));

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        await processVoiceInput(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setRecording(null);
      setIsProcessing(false);
    }
  };

  const processVoiceInput = async (audioUri: string) => {
    try {
      const mockTranscript = "Check my balance with my friends";
      addMessage(mockTranscript, true);
      
      const response = await aiAssistantApi.processVoiceCommand(mockTranscript);
      addMessage(response.text, false, response.audioUrl, response.action);
      
      if (response.audioUrl) {
        playAudio(response.audioUrl);
      }
      setVoiceFailCount(0);
    } catch (error) {
      console.error('Error processing voice input:', error);
      const newFailCount = voiceFailCount + 1;
      setVoiceFailCount(newFailCount);
      
      if (newFailCount >= 2) {
        setShowChatFallback(true);
        addMessage("I'm having trouble with voice right now. Let me open the chat for you! 💬", false);
      } else {
        addMessage("Sorry, I couldn't hear that clearly. Could you try speaking again?", false);
      }
    }
  };
    
  // FIXED: Implemented the missing addMessage function
  const addMessage = (text: string, isUser: boolean, audioUrl?: string | null, action?: any) => {
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      audioUrl,
      timestamp: new Date(),
      action,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const playAudio = async (audioUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const sendQuickAction = async (action: string) => {
    setIsProcessing(true);
    addMessage(action, true);

    try {
      let response;
      switch (action) {
        case 'Show my balance':
          response = await aiAssistantApi.getVoiceBalanceSummary();
          addMessage(response.text, false, response.audioUrl);
          if (response.audioUrl) playAudio(response.audioUrl);
          break;
        case 'Help me split an expense':
          addMessage("I'd love to help! Tell me about the expense and who was involved. 💰", false);
          break;
        case 'Send a funny reminder':
          addMessage("Who should I remind and about what? I'll make it entertaining! 😄", false);
          break;
        default:
          response = await aiAssistantApi.processVoiceCommand(action);
          addMessage(response.text, false, response.audioUrl);
          if (response.audioUrl) playAudio(response.audioUrl);
      }
    } catch (error) {
      addMessage("Oops! Something went wrong. Let me try that again.", false);
    } finally {
      setIsProcessing(false);
    }
  };

  const FloatingButton = () => (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => {
        setIsExpanded(true);
        setTimeout(() => startRecording(), 500);
      }}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.buttonContent, { transform: [{ rotate: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] }) }] }]}>
        <Bot size={24} color="#FFFFFF" />
        <Animated.View style={[styles.sparkle, { opacity: sparkleAnim, transform: [{ scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }] }]}>
          <Sparkles size={12} color="#FFD700" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );

  if (!isExpanded) {
    return <FloatingButton />;
  }

  return (
    <Modal visible={isExpanded} transparent={true} animationType="none" statusBarTranslucent>
      <BlurView intensity={20} style={styles.modalOverlay}>
        <Animated.View style={[styles.chatContainer, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiAvatar}><Bot size={20} color="#FFFFFF" /></View>
              <View>
                <Text style={styles.aiName}>Divvy AI</Text>
                <Text style={styles.aiStatus}>Your smart expense assistant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsExpanded(false)} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>👋 Hi! I'm Divvy, your AI assistant!</Text>
                <Text style={styles.welcomeSubtext}>I can help you split expenses, remind friends about money, and answer questions about your finances!</Text>
              </View>
            )}
            {/* FIXED: Added explicit type for 'message' */}
            {messages.map((message: AIMessage) => (
              <View key={message.id} style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.aiMessage]}>
                <Text style={[styles.messageText, message.isUser ? styles.userMessageText : styles.aiMessageText]}>
                  {message.text}
                </Text>
                {message.audioUrl && !message.isUser && (
                  <TouchableOpacity onPress={() => playAudio(message.audioUrl!)} style={styles.playButton}>
                    <Volume2 size={16} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.processingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {showChatFallback && (
            <View style={styles.quickActions}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Show my balance', 'Help me split an expense', 'Send a funny reminder', 'What can you do?'].map((action) => (
                  <TouchableOpacity key={action} onPress={() => sendQuickAction(action)} style={styles.quickActionButton} disabled={isProcessing}>
                    <Text style={styles.quickActionText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={isListening ? stopRecording : startRecording} disabled={isProcessing} style={[styles.voiceButton, isListening && styles.voiceButtonActive]}>
              <Animated.View style={[styles.voiceButtonContent, { transform: [{ scale: pulseAnim }] }]}>
                {isListening ? <MicOff size={24} color="#FFFFFF" /> : <Mic size={24} color="#FFFFFF" />}
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.voiceHint}>
              {isListening ? 'Listening... Tap to stop' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </Text>
          </View>

        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// Styles remain largely the same, only minor adjustments needed
const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -15,
    right: -5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  aiStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageText: {
    padding: 12,
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  aiMessageText: {
    backgroundColor: '#F3F4F6',
    color: '#000000',
  },
  playButton: {
    marginLeft: 8,
    padding: 4,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickActionButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#EF4444',
  },
  voiceButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  voiceFirstContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWelcome: {
    alignItems: 'center',
    marginBottom: 40,
  },
  voiceWelcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  voiceWelcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  largeVoiceButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  largeVoiceButtonActive: {
    backgroundColor: '#EF4444',
  },
  largeVoiceButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceInstructions: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  voicePrompts: {
    alignItems: 'center',
    width: '100%',
  },
  voicePromptsTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '600',
  },
  voicePromptButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 200,
  },
  voicePromptText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

