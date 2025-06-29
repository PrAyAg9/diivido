import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { Expense } from '../models/expense.model';
import mongoose from 'mongoose';

// Friend Request model (should match the one in friends.controller.ts)
const FriendRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const FriendRequest =
  mongoose.models.FriendRequest ||
  mongoose.model('FriendRequest', FriendRequestSchema);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Eleven Labs API configuration
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_VOICE_ID =
  process.env.ELEVEN_LABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default voice

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

class AIController {
  // Process voice commands using Gemini AI
  // Converted to an arrow function to preserve 'this' context
  processVoiceCommand = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { transcript } = req.body;
      const userId = req.user?.id;

      if (!transcript) {
        res.status(400).json({ error: 'Transcript is required' });
        return;
      }

      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY) {
        console.error('Gemini API key not configured');
        res.json({
          text: "Hi! I'm your AI assistant, but I need to be configured properly. Please set up the Gemini API key.",
          audioUrl: null,
          action: { type: 'general', payload: {} },
        });
        return;
      }

      // Handle case where no user is authenticated
      if (!userId) {
        const fallbackText =
          "Hi there! I'm your expense-splitting assistant. I'd love to help you manage your finances!";
        res.json({
          text: fallbackText,
          audioUrl: await this.generateSpeech(fallbackText),
          action: { type: 'general', payload: {} },
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get user's real data
      const userData = await this.getUserContextData(userId);

      // Analyze the transcript to determine intent
      const nudgeKeywords = [
        'nudge',
        'remind',
        'tell',
        'message',
        'send',
        'owe',
        'owes',
        'money',
        'debt',
        'pay',
        'bill',
      ];
      const balanceKeywords = [
        'balance',
        'owe me',
        'debt',
        'summary',
        'status',
      ];
      const quickDrawKeywords = [
        'quick draw',
        'quickdraw',
        'game',
        'challenge',
        'who pays',
        'loser pays',
        'reaction game',
        'fastest',
        'slowest',
      ];

      const isNudgeRequest = nudgeKeywords.some((keyword) =>
        transcript.toLowerCase().includes(keyword)
      );

      const isBalanceRequest = balanceKeywords.some((keyword) =>
        transcript.toLowerCase().includes(keyword)
      );

      const isQuickDrawRequest = quickDrawKeywords.some((keyword) =>
        transcript.toLowerCase().includes(keyword)
      );

      if (isNudgeRequest) {
        // Extract friend name from transcript (simple regex)
        const nameMatch = transcript.match(/(?:nudge|remind|tell)\s+(\w+)/i);
        const friendName = nameMatch ? nameMatch[1] : null;

        const context = `
          You are a witty AI assistant that helps people send fun reminders about money to friends.
          User ${user.fullName} wants to send a nudge about money.
          Their request: "${transcript}"
          ${friendName ? `Target friend: ${friendName}` : ''}
          
          Available friends: ${userData.friends
            .map((f) => f.fullName)
            .join(', ')}
          
          Create a short, humorous, and friendly message to remind someone about money they owe.
          Make it playful and not aggressive. Use emojis and keep it under 40 words.
          If no specific friend is mentioned, suggest they specify who to nudge from their friends list.
          
          Format your response as if you're speaking directly to ${
            user.fullName
          }, 
          and include the actual nudge message they can send.
        `;

        const result = await model.generateContent(context);
        const aiResponse = result.response.text();

        const audioUrl = await this.generateSpeech(aiResponse);

        // If a friend was identified, simulate sending the nudge
        if (friendName) {
          console.log(
            `🎯 Nudge sent to ${friendName}: Witty money reminder from ${user.fullName}!`
          );
        }

        res.json({
          text: aiResponse,
          audioUrl,
          action: {
            type: 'nudge',
            payload: {
              friendName,
              message: aiResponse,
              friends: userData.friends,
            },
          },
        });
      } else if (isBalanceRequest) {
        // Return balance info
        const balanceText =
          userData.balance.netBalance > 0
            ? `Great news ${user.fullName}! Your friends owe you $${userData.balance.totalOwedToUser} total. You're only out $${userData.balance.totalOwed}. Net result: you're up $${userData.balance.netBalance}! 🎉`
            : `Hey ${user.fullName}! You owe $${
                userData.balance.totalOwed
              } to friends, and they owe you $${
                userData.balance.totalOwedToUser
              }. Net: you owe $${Math.abs(
                userData.balance.netBalance
              )}. Time for some friendly nudges! 😉`;

        const audioUrl = await this.generateSpeech(balanceText);

        res.json({
          text: balanceText,
          audioUrl,
          action: {
            type: 'balance',
            payload: userData.balance,
          },
        });
      } else if (isQuickDrawRequest) {
        // Handle Quick Draw game requests
        const quickDrawResponse = `Ready for some Quick Draw action, ${user.fullName}? 🎯⚡ 

This is perfect for settling who pays! Here's how it works:
1. Create an expense and select "Loser Pays All ⚡"
2. Everyone gets a notification to join the game
3. When the signal appears, tap as fast as you can!
4. Slowest reaction pays the whole bill!

Want to start a Quick Draw challenge now? Just add an expense and choose the Quick Draw option!`;

        const audioUrl = await this.generateSpeech(quickDrawResponse);

        res.json({
          text: quickDrawResponse,
          audioUrl,
          action: {
            type: 'quickdraw',
            payload: {
              suggestion: 'Navigate to add expense and select Quick Draw option',
              groups: userData.groups,
            },
          },
        });
      } else {
        // General conversation with focus on nudging
        const context = `
          You are DividoAI, a fun AI assistant specialized in helping people nudge friends about money in witty ways.
          User ${user.fullName} said: "${transcript}"
          
          Their friends: ${userData.friends.map((f) => f.fullName).join(', ')}
          Their balance: ${
            userData.balance.netBalance > 0
              ? 'owed $' + userData.balance.totalOwedToUser
              : 'owes $' + Math.abs(userData.balance.netBalance)
          }
          
          Respond helpfully and guide them toward using your main feature: sending witty money reminders to friends.
          Keep it conversational, fun, and brief. Mention their real friends or suggest nudging specific people.
        `;

        const result = await model.generateContent(context);
        const aiResponse = result.response.text();

        const audioUrl = await this.generateSpeech(aiResponse);

        res.json({
          text: aiResponse,
          audioUrl,
          action: {
            type: 'general',
            payload: userData,
          },
        });
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      res.status(500).json({
        error: 'Failed to process voice command',
        text: "Sorry, I couldn't understand that. Could you try again?",
      });
    }
  };

  // Generate humorous reminder messages using Gemini
  generateReminderMessage = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { targetUser, reason, amount } = req.body;
      const senderUser = await User.findById(req.user?.id);

      if (!senderUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get real user data for context
      const userData = await this.getUserContextData(req.user?.id || '');

      const prompt = `
        Generate a short, witty, and friendly push notification message to remind ${targetUser} about money.
        
        Sender: ${senderUser.fullName}
        Target: ${targetUser}
        Reason: ${reason || 'shared expense'}
        ${amount ? `Amount: $${amount}` : ''}
        
        Context: ${senderUser.fullName} has ${
        userData.friends.length
      } friends and is in ${userData.groups.length} groups.
        
        Requirements:
        - Humorous and light-hearted tone
        - Use emojis appropriately
        - Keep under 30 words
        - Make it friendly, not aggressive
        - Include the sender's name
        - Be creative and witty!
        
        Just return the message text, nothing else.
      `;

      const result = await model.generateContent(prompt);
      const message = result.response.text();

      const audioUrl = await this.generateSpeech(message);

      res.json({
        message,
        audioUrl,
      });
    } catch (error) {
      console.error('Error generating reminder:', error);
      res.status(500).json({ error: 'Failed to generate reminder message' });
    }
  };

  // Get voice balance summary
  getVoiceBalanceSummary = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const fallbackText =
          "Hi! I'd love to show you your balance, but I need you to be logged in first!";
        const audioUrl = await this.generateSpeech(fallbackText);
        res.json({
          text: fallbackText,
          audioUrl,
          balanceData: { totalOwed: 0, totalOwedToUser: 0, netBalance: 0 },
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get user's real data
      const userData = await this.getUserContextData(userId);

      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY) {
        const fallbackText = `Hey ${user.fullName}! You have ${
          userData.friends.length
        } friends and ${userData.groups.length} groups. Your current balance: ${
          userData.balance.netBalance >= 0
            ? `You're owed $${userData.balance.totalOwedToUser}`
            : `You owe $${Math.abs(userData.balance.netBalance)}`
        }`;
        const audioUrl = await this.generateSpeech(fallbackText);
        res.json({
          text: fallbackText,
          audioUrl,
          balanceData: userData.balance,
        });
        return;
      }

      const prompt = `
        Create a conversational, friendly balance summary for ${user.fullName}.
        
        REAL USER DATA:
        - Friends: ${userData.friends.length} friends (${userData.friends
        .map((f: any) => f.fullName)
        .join(', ')})
        - Groups: ${userData.groups.length} groups (${userData.groups
        .map((g: any) => g.name)
        .join(', ')})
        - Recent expenses: ${userData.recentExpenses.length} recent expenses
        - Total owed to user: $${userData.balance.totalOwedToUser}
        - Total user owes: $${userData.balance.totalOwed}
        - Net balance: ${
          userData.balance.netBalance >= 0
            ? `+$${userData.balance.netBalance}`
            : `-$${Math.abs(userData.balance.netBalance)}`
        }
        
        Make it sound natural and conversational, using the REAL data above.
        Mention specific friends or groups if relevant. Keep it concise but informative.
        Add some personality and be encouraging!
      `;

      const result = await model.generateContent(prompt);
      const summaryText = result.response.text();

      const audioUrl = await this.generateSpeech(summaryText);

      res.json({
        text: summaryText,
        audioUrl,
        balanceData: userData.balance,
      });
    } catch (error) {
      console.error('Error getting balance summary:', error);
      const fallbackText = `Hey there! I'm having trouble getting your balance right now, but don't worry - I'll be back to help you track those expenses soon!`;
      const audioUrl = await this.generateSpeech(fallbackText);
      res.status(200).json({
        text: fallbackText,
        audioUrl,
        balanceData: { totalOwed: 0, totalOwedToUser: 0, netBalance: 0 },
      });
    }
  };

  // Send witty nudge to a friend
  sendWittyNudge = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { friendName, message, customMessage } = req.body;
      const userId = req.user?.id || 'demo-user-123';

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Find the friend
      const userData = await this.getUserContextData(userId);
      const friend = userData.friends.find((f) =>
        f.fullName.toLowerCase().includes(friendName.toLowerCase())
      );

      let nudgeMessage = customMessage;
      if (!nudgeMessage) {
        // Generate a witty nudge message
        const prompt = `
          Generate a short, funny, and friendly push notification message to remind ${friendName} about money they owe.
          Sender: ${user.fullName}
          
          Requirements:
          - Humorous and light-hearted tone
          - Use emojis appropriately 
          - Keep under 25 words
          - Make it friendly, not aggressive
          - Include a money-related pun or joke
          
          Just return the message text, nothing else.
        `;

        const result = await model.generateContent(prompt);
        nudgeMessage = result.response.text();
      }

      // In a real app, this would send a push notification
      console.log(`📱 NUDGE SENT!`);
      console.log(`From: ${user.fullName}`);
      console.log(`To: ${friendName}`);
      console.log(`Message: ${nudgeMessage}`);

      const confirmationText = `Nudge sent to ${friendName}! 🎯 They'll get your witty reminder: "${nudgeMessage}"`;
      const audioUrl = await this.generateSpeech(confirmationText);

      res.json({
        success: true,
        message: confirmationText,
        audioUrl,
        nudgeMessage,
        sentTo: friendName,
      });
    } catch (error) {
      console.error('Error sending nudge:', error);
      res.status(500).json({ error: 'Failed to send nudge' });
    }
  };

  // Convert text to speech using Eleven Labs
  textToSpeech = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const audioUrl = await this.generateSpeech(text);

      res.json({ audioUrl });
    } catch (error) {
      console.error('Error converting text to speech:', error);
      res.status(500).json({ error: 'Failed to convert text to speech' });
    }
  };

  // Get AI suggestions for expenses
  getExpenseSuggestions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { description } = req.body;

      if (!description) {
        res.status(400).json({ error: 'Description is required' });
        return;
      }

      const prompt = `
        Analyze this expense description and provide smart suggestions: "${description}"
        
        Return a JSON object with:
        - category: best category (food, transport, entertainment, shopping, utilities, other)
        - estimatedAmount: estimated amount if you can infer it (or null)
        - suggestions: array of 3 helpful suggestions to improve the description
        - tips: array of 2 money-saving tips related to this expense type
      `;

      const result = await model.generateContent(prompt);
      let suggestions;

      try {
        const cleanedText = result.response
          .text()
          .replace(/```json\n?|\n?```/g, '');
        suggestions = JSON.parse(cleanedText);
      } catch (e) {
        console.error('Failed to parse Gemini JSON response:', e);
        suggestions = {
          category: 'other',
          estimatedAmount: null,
          suggestions: [
            'Add more details',
            'Include the date',
            'Specify the amount',
          ],
          tips: [
            'Compare prices before buying',
            'Look for discounts and deals',
          ],
        };
      }

      res.json(suggestions);
    } catch (error) {
      console.error('Error getting expense suggestions:', error);
      res.status(500).json({ error: 'Failed to get expense suggestions' });
    }
  };

  // General AI chat
  chatWithAI = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { message } = req.body;
      const user = await User.findById(req.user?.id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get real user data for context
      const userData = await this.getUserContextData(req.user?.id || '');

      const prompt = `
        You are DividoAI, a friendly and witty AI assistant for the Divido expense-splitting app.
        
        USER INFO:
        Name: ${user.fullName}
        Friends: ${userData.friends.length} friends (${userData.friends
        .map((f: any) => f.fullName)
        .join(', ')})
        Groups: ${userData.groups.length} groups (${userData.groups
        .map((g: any) => g.name)
        .join(', ')})
        Net Balance: ${
          userData.balance.netBalance >= 0
            ? `+$${userData.balance.netBalance}`
            : `-$${Math.abs(userData.balance.netBalance)}`
        }
        
        User says: "${message}"
        
        Respond in a helpful, conversational way using their REAL data when relevant.
        Keep it short and engaging. If they ask about app features, be helpful.
        If it's casual chat, be fun and witty!
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const audioUrl = await this.generateSpeech(responseText);

      res.json({
        text: responseText,
        audioUrl,
      });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: 'Failed to chat with AI' });
    }
  };

  // Helper method to get user context data for dynamic AI responses
  private getUserContextData = async (userId: string) => {
    try {
      // Get user's friends
      const friendRequests = await FriendRequest.find({
        $or: [
          { fromUserId: userId, status: 'accepted' },
          { toUserId: userId, status: 'accepted' },
        ],
      }).populate('fromUserId toUserId', 'fullName email');

      const friends = friendRequests.map((req: any) => {
        const friend =
          req.fromUserId._id.toString() === userId
            ? req.toUserId
            : req.fromUserId;
        return {
          id: friend._id,
          fullName: friend.fullName,
          email: friend.email,
        };
      });

      // Get user's groups
      const groups = await Group.find({
        'members.userId': userId,
      }).populate('members.userId', 'fullName');

      // Get recent expenses (last 10)
      const recentExpenses = await Expense.find({
        $or: [{ paidBy: userId }, { 'splits.userId': userId }],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('paidBy', 'fullName')
        .populate('groupId', 'name');

      // Calculate balance
      const expensesOwedToUser = await Expense.find({ paidBy: userId });
      const expensesUserOwes = await Expense.find({ 'splits.userId': userId });

      let totalOwedToUser = 0;
      let totalOwed = 0;

      // Calculate what others owe to user
      for (const expense of expensesOwedToUser) {
        const unpaidSplits = expense.splits.filter(
          (split) => !split.paid && split.userId.toString() !== userId
        );
        totalOwedToUser += unpaidSplits.reduce(
          (sum, split) => sum + split.amount,
          0
        );
      }

      // Calculate what user owes to others
      for (const expense of expensesUserOwes) {
        if (expense.paidBy.toString() !== userId) {
          const userSplit = expense.splits.find(
            (split) => split.userId.toString() === userId
          );
          if (userSplit && !userSplit.paid) {
            totalOwed += userSplit.amount;
          }
        }
      }

      const netBalance = totalOwedToUser - totalOwed;

      return {
        friends,
        groups: groups.map((group) => ({
          id: group._id,
          name: group.name,
          memberCount: group.members.length,
        })),
        recentExpenses: recentExpenses.map((expense: any) => ({
          id: expense._id,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          paidBy: expense.paidBy,
          groupName: expense.groupId?.name || 'Personal',
          date: expense.date,
        })),
        balance: {
          totalOwedToUser,
          totalOwed,
          netBalance,
        },
      };
    } catch (error) {
      console.error('Error getting user context data:', error);
      // Return empty data if there's an error
      return {
        friends: [],
        groups: [],
        recentExpenses: [],
        balance: { totalOwedToUser: 0, totalOwed: 0, netBalance: 0 },
      };
    }
  };

  // Helper method to generate speech using Eleven Labs
  private generateSpeech = async (
    text: string,
    voiceId: string = ELEVEN_LABS_VOICE_ID!
  ): Promise<string> => {
    try {
      if (!ELEVEN_LABS_API_KEY) {
        console.warn(
          'Eleven Labs API key not configured, returning placeholder audio URL'
        );
        // Returning null instead of a placeholder URL to be more explicit
        return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'; // Placeholder as per original
      }

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1', // This can be multilingual if needed
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVEN_LABS_API_KEY,
          },
          responseType: 'arraybuffer',
        }
      );

      const audioBuffer = Buffer.from(response.data);
      const audioBase64 = audioBuffer.toString('base64');
      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (error) {
      console.error('Error generating speech:', error);
      // Return a placeholder or null if TTS fails
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'; // Placeholder as per original
    }
  };
}

// Export a single instance of the controller.
export default new AIController();
