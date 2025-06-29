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

const { width, height } = Dimensions.get('window');

export default function VoiceAIAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showEmergencyChat, setShowEmergencyChat] = useState(false);
  const [voiceFailCount, setVoiceFailCount] = useState(0);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
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
        "Remind everyone about movie night expenses"
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
      
      // Show emergency chat after 2 failed attempts
      if (newFailCount >= 2) {
        setShowEmergencyChat(true);
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
              ? '🎤 Listening...'
              : isProcessing
              ? '🤔 Processing...'
              : isResponding
              ? '🔊 Speaking...'
              : '⚡ Tap to nudge friends'}
          </Text>
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

      {/* Emergency Chat Modal */}
      <Modal
        visible={showEmergencyChat}
        transparent={true}
        animationType="slide"
        statusBarTranslucent
      >
        <BlurView intensity={30} style={styles.modalOverlay}>
          <View style={styles.emergencyChat}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Voice Assistant</Text>
              <TouchableOpacity
                onPress={() => setShowEmergencyChat(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.chatContent}>
              <MessageCircle size={48} color="#10B981" />
              <Text style={styles.chatMessage}>
                I'm having trouble with voice right now. 
                You can type your request or try voice again.
              </Text>
              
              <View style={styles.chatActions}>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={() => {
                    setShowEmergencyChat(false);
                    setVoiceFailCount(0);
                    setTimeout(() => startListening(), 500);
                  }}
                >
                  <Mic size={20} color="#FFFFFF" />
                  <Text style={styles.tryAgainText}>Try Voice Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    maxWidth: 200,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
});
