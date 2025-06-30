import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Vibration,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Zap, Trophy, Clock, Users, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface Participant {
  userName: string;
  isReady: boolean;
  hasPlayed: boolean;
  reactionTime?: number;
}

interface GameResults {
  winner: string;
  loser: string;
  allTimes: Array<{
    userName: string;
    reactionTime: number;
  }>;
}

export default function QuickDrawGame() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();

  const [gameState, setGameState] = useState<
    'waiting' | 'ready' | 'signal' | 'finished'
  >('waiting');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [results, setResults] = useState<GameResults | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [signalShown, setSignalShown] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Polling for game status
  useEffect(() => {
    if (!gameId) return;

    const pollGameStatus = async () => {
      try {
        const response = await fetch(
          `https://backend-divido.onrender.com/api/quickdraw/status/${gameId}`
        );
        const data = await response.json();

        if (response.ok) {
          setGameState(data.gameState);
          setParticipants(data.participants);
          setExpenseTitle(data.expenseTitle);

          if (data.results) {
            setResults(data.results);
          }

          // If signal state and we haven't shown signal yet
          if (data.gameState === 'signal' && !signalShown) {
            showSignal();
          }
        }
      } catch (error) {
        console.error('Error polling game status:', error);
      }
    };

    // Poll every 500ms for real-time updates
    const interval = setInterval(pollGameStatus, 500);

    // Initial poll
    pollGameStatus();

    return () => clearInterval(interval);
  }, [gameId, signalShown]);

  // Join the game
  const joinGame = async () => {
    try {
      const response = await fetch(
        `https://backend-divido.onrender.com/api/quickdraw/join/${gameId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        setIsReady(true);
        Vibration.vibrate(100);

        // Start ready animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join game');
    }
  };

  // Show signal animation
  const showSignal = () => {
    setSignalShown(true);
    Vibration.vibrate([100, 100, 100]);

    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle tap
  const handleTap = async () => {
    if (gameState !== 'signal' || reactionTime !== null) return;

    const tapTime = Date.now();
    setReactionTime(tapTime);

    try {
      const response = await fetch(
        `https://backend-divido.onrender.com/api/quickdraw/tap/${gameId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tapTime }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setReactionTime(data.reactionTime);

        if (data.results) {
          setResults(data.results);
          setGameState('finished');
        }

        Vibration.vibrate(50);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record tap');
    }
  };

  const renderWaitingScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Quick Draw Challenge! ⚡</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.expenseInfo}>
          <Zap size={48} color="#F59E0B" />
          <Text style={styles.expenseTitle}>{expenseTitle}</Text>
          <Text style={styles.subtitle}>Who will pay for this? 🎯</Text>
        </View>

        <View style={styles.participantsContainer}>
          <Text style={styles.participantsTitle}>
            Players ({participants.length})
          </Text>
          {participants.map((participant, index) => (
            <View key={index} style={styles.participantRow}>
              <View
                style={[
                  styles.participantStatus,
                  {
                    backgroundColor: participant.isReady
                      ? '#10B981'
                      : '#6B7280',
                  },
                ]}
              />
              <Text style={styles.participantName}>{participant.userName}</Text>
              <Text style={styles.participantState}>
                {participant.isReady ? '✓ Ready' : 'Waiting...'}
              </Text>
            </View>
          ))}
        </View>

        {!isReady ? (
          <TouchableOpacity style={styles.readyButton} onPress={joinGame}>
            <Text style={styles.readyButtonText}>I'm Ready! 🎮</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingForOthers}>
            <Animated.View
              style={[styles.pulseIcon, { transform: [{ scale: pulseAnim }] }]}
            >
              <Clock size={32} color="#F59E0B" />
            </Animated.View>
            <Text style={styles.waitingText}>Waiting for other players...</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderReadyScreen = () => (
    <View style={[styles.container, styles.readyContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      <Animated.View
        style={[styles.readyContent, { transform: [{ scale: pulseAnim }] }]}
      >
        <Text style={styles.readyTitle}>Get Ready...</Text>
        <Text style={styles.readySubtitle}>Wait for the signal!</Text>

        <View style={styles.playersReady}>
          <Users size={48} color="#FFFFFF" />
          <Text style={styles.allReadyText}>
            All {participants.length} players ready!
          </Text>
        </View>
      </Animated.View>
    </View>
  );

  const renderSignalScreen = () => (
    <TouchableOpacity
      style={[styles.container, styles.signalContainer]}
      onPress={handleTap}
      activeOpacity={1}
    >
      <StatusBar barStyle="light-content" backgroundColor="#EF4444" />

      <Animated.View
        style={[
          styles.signalContent,
          {
            opacity: flashAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.signalText}>TAP!</Text>
        <Text style={styles.signalSubtext}>Tap anywhere NOW!</Text>
      </Animated.View>

      {reactionTime && (
        <View style={styles.yourTimeContainer}>
          <Text style={styles.yourTimeText}>Your time: {reactionTime}ms</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderResultsScreen = () => (
    <View style={[styles.container, styles.resultsContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      <View style={styles.resultsContent}>
        <View style={styles.resultHeader}>
          <Trophy size={64} color="#F59E0B" />
          <Text style={styles.resultsTitle}>Game Over! 🎯</Text>
        </View>

        <View style={styles.winnerLoserContainer}>
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerLabel}>🥇 Fastest</Text>
            <Text style={styles.winnerName}>{results?.winner}</Text>
          </View>

          <View style={styles.loserContainer}>
            <Text style={styles.loserLabel}>🐢 Pays the bill</Text>
            <Text style={styles.loserName}>{results?.loser}</Text>
          </View>
        </View>

        <View style={styles.allTimesContainer}>
          <Text style={styles.allTimesTitle}>Final Times</Text>
          {results?.allTimes.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <Text style={styles.timePosition}>#{index + 1}</Text>
              <Text style={styles.timePlayerName}>{time.userName}</Text>
              <Text style={styles.timeValue}>{time.reactionTime}ms</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
        >
          <Text style={styles.doneButtonText}>Done 🎉</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render appropriate screen based on game state
  switch (gameState) {
    case 'waiting':
      return renderWaitingScreen();
    case 'ready':
      return renderReadyScreen();
    case 'signal':
      return renderSignalScreen();
    case 'finished':
      return renderResultsScreen();
    default:
      return renderWaitingScreen();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  expenseInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  participantsContainer: {
    marginBottom: 40,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  participantStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  participantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantState: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  readyButton: {
    backgroundColor: '#10B981',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waitingForOthers: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  pulseIcon: {
    marginBottom: 16,
  },
  waitingText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  readyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyContent: {
    alignItems: 'center',
  },
  readyTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  readySubtitle: {
    fontSize: 20,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 40,
  },
  playersReady: {
    alignItems: 'center',
  },
  allReadyText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 12,
    fontWeight: '600',
  },
  signalContainer: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signalContent: {
    alignItems: 'center',
  },
  signalText: {
    fontSize: 96,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  signalSubtext: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  yourTimeContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  yourTimeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resultsContainer: {
    justifyContent: 'center',
  },
  resultsContent: {
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
  },
  winnerLoserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  winnerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 20,
    borderRadius: 16,
    marginRight: 8,
  },
  winnerLabel: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loserContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 20,
    borderRadius: 16,
    marginLeft: 8,
  },
  loserLabel: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 8,
  },
  loserName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  allTimesContainer: {
    marginBottom: 40,
  },
  allTimesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  timePosition: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    width: 40,
  },
  timePlayerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
