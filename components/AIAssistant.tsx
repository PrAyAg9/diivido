import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import {
  Mic,
  MicOff,
  Volume2,
  MessageCircle,
  Sparkles,
  Send,
  X,
} from 'lucide-react-native';
// Mock useAuth and aiAssistantApi for standalone example
const useAuth = () => ({ user: { fullName: 'Demo User' } });
const aiAssistantApi = {
  processVoiceCommand: async (command: string) => {
    console.log('Processing command:', command);
    await new Promise(res => setTimeout(res, 1500));
    return {
      text: `I've processed your command about: "${command}". In a real app, I would perform an action.`,
      audioUrl: null, // No audio URL for this demo
      action: { type: 'CONFIRMATION', details: command },
    };
  }
};
type AIResponse = Awaited<ReturnType<typeof aiAssistantApi.processVoiceCommand>>;


const { width, height } = Dimensions.get('window');

interface AIAssistantProps {
  isVisible: boolean;
  onClose: () => void;
  onAction?: (action: any) => void;
}

export default function AIAssistant({ isVisible, onClose, onAction }: AIAssistantProps) {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    audioUrl?: string | null;
  }>>([
    {
      type: 'assistant',
      text: `Hey ${user?.fullName?.split(' ')[0] || 'there'}! 👋 I'm your money buddy. Ask me to remind friends about debts, split bills, or check balances. Try saying "Remind John about the pizza money" or "Split $50 dinner with Sarah and Mike"!`,
      timestamp: new Date(),
    }
  ]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startListening = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice commands.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      console.log('Starting recording..');

      // --- THIS IS THE CORRECTED PART ---
      // We now use the recommended preset instead of a manual configuration object.
      // This automatically handles platform-specific settings (Android, iOS, Web) for you.
      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      // --- END OF CORRECTION ---

      setRecording(recording);
      setIsListening(true);
      setCurrentTranscript('Listening...');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start voice recording. Please check app permissions.');
    }
  };


  const stopListening = async () => {
    try {
      if (!recording) return;

      setIsListening(false);
      setCurrentTranscript('Processing...');
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // In a real app, you'd send the 'uri' to a speech-to-text service.
        // For this demo, we will simulate the recognition.
        console.log('Recording URI:', uri);
        setTimeout(() => {
          simulateVoiceRecognition();
        }, 1000);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  };

  const simulateVoiceRecognition = async () => {
    // Simulate some voice commands for demo
    const demoCommands = [
      "Remind John about the pizza money",
      "Split fifty dollars dinner with Sarah and Mike",
      "Check my balance",
      "Create a new group for vacation",
      "How much do I owe in total",
      "Send payment reminder to Alex"
    ];
    
    const randomCommand = demoCommands[Math.floor(Math.random() * demoCommands.length)];
    setCurrentTranscript(randomCommand);
    
    // Add user message to conversation
    const userMessage = {
      type: 'user' as const,
      text: randomCommand,
      timestamp: new Date(),
    };
    
    setConversation(prev => [...prev, userMessage]);
    
    try {
      // Process with AI
      const response = await aiAssistantApi.processVoiceCommand(randomCommand);
      await handleAIResponse(response);
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorResponse = {
        type: 'assistant' as const,
        text: "Oops! I couldn't process that. Could you try again? 🤔",
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  };

  const handleAIResponse = async (response: AIResponse) => {
    // Add AI response to conversation
    const assistantMessage = {
      type: 'assistant' as const,
      text: response.text,
      timestamp: new Date(),
      audioUrl: response.audioUrl,
    };
    
    setConversation(prev => [...prev, assistantMessage]);

    // Play audio response if available
    if (response.audioUrl) {
      try {
        await playAudio(response.audioUrl);
      } catch (error) {
        console.error('Error playing audio:', error);
        // Fallback to text-to-speech
        Speech.speak(response.text, {
          language: 'en-US',
          pitch: 1.1,
          rate: 0.9,
        });
      }
    } else {
      // Use built-in text-to-speech
      Speech.speak(response.text, {
        language: 'en-US',
        pitch: 1.1,
        rate: 0.9,
      });
    }

    // Handle actions
    if (response.action && onAction) {
      onAction(response.action);
    }
  };

  const playAudio = async (audioUrl: string) => {
    try {
      setIsPlaying(true);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      setIsPlaying(false);
      throw error;
    }
  };

  const sendQuickMessage = async (message: string) => {
    const userMessage = {
      type: 'user' as const,
      text: message,
      timestamp: new Date(),
    };
    
    setConversation(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await aiAssistantApi.processVoiceCommand(message);
      await handleAIResponse(response);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorResponse = {
        type: 'assistant' as const,
        text: "I'm having trouble right now. Try again in a moment! 😅",
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions = [
    { id: 'remind', text: 'Send reminder', icon: '💰' },
    { id: 'balance', text: 'Check balance', icon: '⚖️' },
    { id: 'split', text: 'Split bill', icon: '🍕' },
    { id: 'create', text: 'Create group', icon: '👥' },
  ];

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIcon}>
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Money Buddy</Text>
              <Text style={styles.headerSubtitle}>
                {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : 'Ready to help!'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Conversation */}
        <View style={styles.conversation}>
          {conversation.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.type === 'user' ? styles.userMessageText : styles.assistantMessageText,
                ]}
              >
                {message.text}
              </Text>
              {message.audioUrl && (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => playAudio(message.audioUrl!)}
                >
                  <Volume2 size={16} color="#10B981" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {isProcessing && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionButtons}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => sendQuickMessage(action.text)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Input */}
        <View style={styles.voiceContainer}>
          {currentTranscript ? (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptText}>{currentTranscript}</Text>
            </View>
          ) : null}
          
          <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
                isProcessing && styles.micButtonProcessing,
              ]}
              onPress={isListening ? stopListening : startListening}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <View style={styles.processingIndicator}>
                  <Sparkles size={24} color="#FFFFFF" />
                </View>
              ) : isListening ? (
                <View style={styles.listeningContainer}>
                  <MicOff size={24} color="#FFFFFF" />
                  <Animated.View
                    style={[
                      styles.waveIndicator,
                      {
                        opacity: waveAnim,
                        transform: [{
                          scaleX: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.5],
                          }),
                        }],
                      },
                    ]}
                  />
                </View>
              ) : (
                <Mic size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.micHint}>
            {isListening ? 'Tap to stop' : isProcessing ? 'Processing...' : 'Tap to speak'}
          </Text>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
  },
  conversation: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessageText: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  assistantMessageText: {
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playButton: {
    marginLeft: 8,
    padding: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 18, // Adjusted for dot size
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: '#9CA3AF',
    borderRadius: 4,
    marginHorizontal: 2,
    // Add animation in a useEffect if desired
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    backgroundColor: '#FFFFFF'
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
  },
  voiceContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFFFFF'
  },
  transcriptContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  transcriptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  micContainer: {
    marginBottom: 8,
  },
  micButton: {
    width: 64,
    height: 64,
    backgroundColor: '#10B981',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  micButtonProcessing: {
    backgroundColor: '#F59E0B',
  },
  listeningContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveIndicator: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  processingIndicator: {
    // Add rotation animation in a useEffect if desired
  },
  micHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
