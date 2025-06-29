import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, DollarSign, Plus } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  type: 'text' | 'money_request' | 'payment';
  amount?: number;
  currency?: string;
}

interface MoneyRequest {
  amount: number;
  description: string;
  currency: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const friendName = params.friendName as string || 'Friend';
  const friendId = params.friendId as string || '1';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! How are you?',
      timestamp: new Date(Date.now() - 3600000),
      isUser: false,
      type: 'text',
    },
    {
      id: '2',
      text: 'Good! Thanks for asking',
      timestamp: new Date(Date.now() - 3500000),
      isUser: true,
      type: 'text',
    },
    {
      id: '3',
      text: 'Can you help me with the dinner expense from yesterday?',
      timestamp: new Date(Date.now() - 1800000),
      isUser: false,
      type: 'money_request',
      amount: 850,
      currency: 'INR',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [showMoneyRequest, setShowMoneyRequest] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date(),
      isUser: true,
      type: 'text',
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate friend response (for demo)
    setTimeout(() => {
      const responses = [
        'Got it!',
        'Thanks for letting me know',
        'Sure thing!',
        'No problem',
        'Sounds good',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const friendResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        timestamp: new Date(),
        isUser: false,
        type: 'text',
      };
      
      setMessages(prev => [...prev, friendResponse]);
    }, 1000 + Math.random() * 2000);
  };

  const sendMoneyRequest = () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!requestDescription.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: `Requesting ₹${amount} for ${requestDescription.trim()}`,
      timestamp: new Date(),
      isUser: true,
      type: 'money_request',
      amount,
      currency: 'INR',
    };

    setMessages([...messages, newMessage]);
    setRequestAmount('');
    setRequestDescription('');
    setShowMoneyRequest(false);

    Alert.alert('Request Sent', `Money request for ₹${amount} has been sent to ${friendName}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMoneyRequest = item.type === 'money_request';
    
    return (
      <View style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.friendMessage
      ]}>
        <View style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.friendBubble,
          isMoneyRequest && styles.moneyRequestBubble
        ]}>
          {isMoneyRequest && (
            <View style={styles.moneyRequestHeader}>
              <DollarSign size={16} color={item.isUser ? '#FFFFFF' : '#10B981'} />
              <Text style={[
                styles.moneyRequestLabel,
                { color: item.isUser ? '#FFFFFF' : '#10B981' }
              ]}>
                Money Request
              </Text>
            </View>
          )}
          
          {isMoneyRequest && item.amount && (
            <Text style={[
              styles.moneyAmount,
              { color: item.isUser ? '#FFFFFF' : '#111827' }
            ]}>
              ₹{item.amount}
            </Text>
          )}
          
          <Text style={[
            styles.messageText,
            { color: item.isUser ? '#FFFFFF' : '#111827' }
          ]}>
            {item.text}
          </Text>
          
          <Text style={[
            styles.messageTime,
            { color: item.isUser ? '#E5E7EB' : '#9CA3AF' }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderMoneyRequestForm = () => (
    <View style={styles.moneyRequestForm}>
      <Text style={styles.formTitle}>Request Money</Text>
      
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.amountInput}
          value={requestAmount}
          onChangeText={setRequestAmount}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>What for?</Text>
        <TextInput
          style={styles.descriptionInput}
          value={requestDescription}
          onChangeText={setRequestDescription}
          placeholder="Dinner, movie tickets, etc."
          placeholderTextColor="#9CA3AF"
          multiline
        />
      </View>
      
      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowMoneyRequest(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sendRequestButton}
          onPress={sendMoneyRequest}
        >
          <Text style={styles.sendRequestButtonText}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.friendName}>{friendName}</Text>
          <Text style={styles.onlineStatus}>Online</Text>
        </View>
        <TouchableOpacity
          style={styles.moneyButton}
          onPress={() => setShowMoneyRequest(true)}
        >
          <DollarSign size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {showMoneyRequest && renderMoneyRequestForm()}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: inputText.trim() ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  onlineStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  moneyButton: {
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  friendMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#10B981',
  },
  friendBubble: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moneyRequestBubble: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  moneyRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moneyRequestLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  moneyAmount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  moneyRequestForm: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  sendRequestButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendRequestButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
