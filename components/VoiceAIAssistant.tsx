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
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { aiAssistantApi } from '@/services/ai-assistant-api';

// const { width, height } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const { width, height } = Dimensions.get('window');

export default function VoiceAIAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [voiceFailCount, setVoiceFailCount] = useState(0);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
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
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
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
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please enable microphone access.');
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
      setIsListening(true);
      Vibration.vibrate(50); // Haptic feedback

      // Animate button expansion
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 100,
        friction: 5,
      }).start();

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Could not start voice recording');
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    setIsListening(false);
    setIsProcessing(true);
    Vibration.vibrate([50, 100, 50]); // Different haptic pattern

    // Animate button back to normal
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        await processVoiceInput(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
    } finally {
      setRecording(null);
    }
  };

  const processVoiceInput = async (audioUri: string) => {
    try {
      // Simulate speech-to-text for demo
      const mockTranscripts = [
        "Nudge John about the pizza money",
        "Send a funny reminder to Sarah about dinner",
        "Tell Mike he owes me for coffee in a witty way",
        "Check my balance with friends",
        "Remind everyone about movie night expenses",
        "Start a Quick Draw game for coffee",
        "Let's play Quick Draw for who pays the bill",
        "Challenge everyone to a Quick Draw game"
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      const response = await aiAssistantApi.processVoiceCommand(randomTranscript);
      
      setLastResponse(response.text);
      setIsProcessing(false);
      setIsResponding(true);
      
      // Play AI response audio if available
      if (response.audioUrl) {
        await playAudio(response.audioUrl);
      } else {
        // Fallback to text-to-speech
        Speech.speak(response.text, {
          language: 'en',
          pitch: 1.1,
          rate: 0.9,
        });
      }

      // Show success animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset voice fail count on success
      setVoiceFailCount(0);

      // Auto-hide response after 3 seconds
      setTimeout(() => {
        setIsResponding(false);
      }, 3000);

    } catch (error) {
      console.error('Error processing voice input:', error);
      
      const newFailCount = voiceFailCount + 1;
      setVoiceFailCount(newFailCount);
      setIsProcessing(false);
      
      // Show chat after 2 failed attempts
      if (newFailCount >= 2) {
        setShowChat(true);
      } else {
        Alert.alert('Voice Error', 'Could not understand. Please try again.');
      }
    }
  };

  const playAudio = async (audioUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(sound);
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsResponding(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsResponding(false);
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

    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSendingMessage(true);

    try {
      const response = await aiAssistantApi.processVoiceCommand(userMessage.text);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text || "I'm here to help! Ask me anything about your expenses or groups.",
        isUser: false,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Handle special actions like nudging friends
      if (response.action?.type === 'notification' && response.action.payload?.friendName) {
        try {
          await aiAssistantApi.sendWittyNudge(response.action.payload.friendName, userMessage.text);
          const nudgeMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            text: `✅ Sent a witty nudge to ${response.action.payload.friendName} about your money!`,
            isUser: false,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, nudgeMessage]);
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
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const openChat = () => {
    setShowChat(true);
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Hi! I'm Divi, your expense assistant. I can help you with expenses, nudge friends for money, or answer questions about your groups. What can I do for you?",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages([welcomeMessage]);
    }
  };

  const buttonColor = isListening 
    ? '#EF4444' 
    : isProcessing 
    ? '#F59E0B' 
    : isResponding 
    ? '#8B5CF6' 
    : '#10B981';

  const buttonIcon = isListening 
    ? <MicOff size={28} color="#FFFFFF" />
    : isProcessing 
    ? <ActivityIndicator size={28} color="#FFFFFF" />
    : isResponding 
    ? <Volume2 size={28} color="#FFFFFF" />
    : <Zap size={28} color="#FFFFFF" />;

  return (
    <>
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
                    scale: pulseAnim 
                  },
                ],
              },
            ]}
          >
            {buttonIcon}
          </Animated.View>
        </TouchableOpacity>

        {/* Status Text */}
        <Animated.View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isListening
              ? 'Ask Divi'
              : isProcessing
              ? '🤔 Processing...'
              : isResponding
              ? '🔊 Speaking...'
              : '⚡ Tap to nudge friends'}
          </Text>
          {isListening && (
            <TouchableOpacity 
              onPress={openChat}
              style={styles.askDiviButton}
            >
              <MessageCircle size={14} color="#10B981" />
            </TouchableOpacity>
          )}
        </Animated.View>
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
              
              <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
                {chatMessages.map((message) => (
                  <View 
                    key={message.id} 
                    style={[
                      styles.messageItem,
                      message.isUser ? styles.userMessage : styles.aiMessage
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.aiMessageText
                    ]}>
                      {message.text}
                    </Text>
                    <Text style={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  style={[styles.sendButton, (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled]}
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
    bottom: 100,
    alignItems: 'center',
    zIndex: 1000,
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  voiceButton: {
    width: 60,  // Reduced from 80
    height: 60, // Reduced from 80
    borderRadius: 30, // Reduced from 40
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    marginTop: 8, // Reduced from 12
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 6, // Reduced from 8
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16, // Reduced from 20
    maxWidth: 180, // Reduced from 200
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
});
