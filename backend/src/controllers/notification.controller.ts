// backend/src/controllers/notification.controller.ts

import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

interface UserWithPushToken {
  _id: string;
  fullName: string;
  email: string;
  expoPushToken?: string;
}

class NotificationController {
  // Register device for push notifications
  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pushToken } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!pushToken) {
        res.status(400).json({ error: 'Push token is required' });
        return;
      }

      // Validate the push token
      if (!Expo.isExpoPushToken(pushToken)) {
        res.status(400).json({ error: 'Invalid push token format' });
        return;
      }

      // Update user with push token
      await User.findByIdAndUpdate(userId, { expoPushToken: pushToken });

      res.json({ success: true, message: 'Device registered for notifications' });
    } catch (error) {
      console.error('Error registering device:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  };

  // Send Quick Draw notification to group members
  sendQuickDrawNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId, groupId } = req.body;
      const currentUserId = req.user?.id || req.user?._id;

      if (!gameId || !groupId) {
        res.status(400).json({ error: 'Game ID and Group ID are required' });
        return;
      }

      // Get group and populate members
      const group = await Group.findById(groupId).populate('members.userId', 'fullName email pushToken');
      
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Get current user's name for the notification
      const currentUser = await User.findById(currentUserId);
      const initiatorName = currentUser?.fullName || 'Someone';

      // Collect push tokens from group members (excluding current user)
      const pushTokens: string[] = [];
      const memberNames: string[] = [];

      group.members.forEach((member: any) => {
        const user = member.userId as UserWithPushToken;
        if (user._id.toString() !== currentUserId.toString() && user.expoPushToken) {
          if (Expo.isExpoPushToken(user.expoPushToken)) {
            pushTokens.push(user.expoPushToken);
            memberNames.push(user.fullName);
          }
        }
      });

      if (pushTokens.length === 0) {
        res.json({ 
          success: true, 
          message: 'No valid push tokens found for group members',
          sentTo: 0 
        });
        return;
      }

      // Create push messages
      const messages: ExpoPushMessage[] = pushTokens.map(pushToken => ({
        to: pushToken,
        sound: 'default',
        title: '⚡ Quick Draw Challenge!',
        body: `${initiatorName} started a Quick Draw! Who will pay this time? Tap to join!`,
        data: {
          type: 'quickdraw',
          gameId,
          groupId,
          initiator: initiatorName,
        },
        priority: 'high',
        ttl: 300, // 5 minutes
      }));

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const receipts = [];

      for (const chunk of chunks) {
        try {
          const chunkReceipts = await expo.sendPushNotificationsAsync(chunk);
          receipts.push(...chunkReceipts);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      console.log(`📱 Quick Draw notifications sent to ${pushTokens.length} players:`);
      memberNames.forEach(name => {
        console.log(`  → ${name}: Quick Draw invitation sent!`);
      });

      res.json({
        success: true,
        message: `Quick Draw notifications sent to ${pushTokens.length} players`,
        sentTo: pushTokens.length,
        memberNames
      });

    } catch (error) {
      console.error('Error sending Quick Draw notification:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  };

  // Send expense nudge notification
  sendNudgeNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { targetUserId, message, amount } = req.body;
      const currentUserId = req.user?.id || req.user?._id;

      if (!targetUserId || !message) {
        res.status(400).json({ error: 'Target user ID and message are required' });
        return;
      }

      // Get users
      const currentUser = await User.findById(currentUserId);
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
        res.status(404).json({ error: 'Target user not found' });
        return;
      }

      if (!targetUser.expoPushToken || !Expo.isExpoPushToken(targetUser.expoPushToken)) {
        res.json({ 
          success: true, 
          message: 'User does not have valid push notifications enabled',
          sent: false 
        });
        return;
      }

      const senderName = currentUser?.fullName || 'Someone';
      const amountText = amount ? ` $${amount}` : '';

      // Create push message
      const pushMessage: ExpoPushMessage = {
        to: targetUser.expoPushToken,
        sound: 'default',
        title: `💰 Friendly Reminder from ${senderName}`,
        body: message,
        data: {
          type: 'nudge',
          fromUserId: currentUserId,
          fromUserName: senderName,
          amount: amount || null,
        },
        priority: 'normal',
      };

      // Send notification
      const receipt = await expo.sendPushNotificationsAsync([pushMessage]);

      console.log(`🎯 Nudge sent to ${targetUser.fullName}: ${message}`);

      res.json({
        success: true,
        message: `Nudge sent to ${targetUser.fullName}`,
        sent: true,
        receipt: receipt[0]
      });

    } catch (error) {
      console.error('Error sending nudge notification:', error);
      res.status(500).json({ error: 'Failed to send nudge' });
    }
  };

  // Send game result notification
  sendGameResultNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId, groupId, winner, loser, expenseTitle } = req.body;

      if (!gameId || !groupId || !winner || !loser) {
        res.status(400).json({ error: 'Missing required game result data' });
        return;
      }

      // Get group and populate members
      const group = await Group.findById(groupId).populate('members.userId', 'fullName email pushToken');
      
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Collect push tokens and create personalized messages
      const messages: ExpoPushMessage[] = [];

      group.members.forEach((member: any) => {
        const user = member.userId as UserWithPushToken;
        if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
          let title: string;
          let body: string;

          if (user.fullName === loser) {
            title = '🐢 You Lost the Quick Draw!';
            body = `Too slow! Looks like "${expenseTitle}" is on you this time. Better luck next round!`;
          } else if (user.fullName === winner) {
            title = '🏆 Quick Draw Champion!';
            body = `Lightning fast! You won the Quick Draw for "${expenseTitle}". ${loser} picks up the tab!`;
          } else {
            title = '⚡ Quick Draw Results';
            body = `${winner} was fastest, ${loser} was slowest. "${expenseTitle}" is covered!`;
          }

          messages.push({
            to: user.expoPushToken,
            sound: 'default',
            title,
            body,
            data: {
              type: 'quickdraw_result',
              gameId,
              groupId,
              winner,
              loser,
              expenseTitle,
            },
            priority: 'normal',
          });
        }
      });

      if (messages.length === 0) {
        res.json({ success: true, message: 'No valid push tokens found', sentTo: 0 });
        return;
      }

      // Send notifications
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending result notification chunk:', error);
        }
      }

      console.log(`🎯 Game result notifications sent to ${messages.length} players`);
      console.log(`   Winner: ${winner}, Loser: ${loser}, Expense: ${expenseTitle}`);

      res.json({
        success: true,
        message: `Game result notifications sent to ${messages.length} players`,
        sentTo: messages.length
      });

    } catch (error) {
      console.error('Error sending game result notification:', error);
      res.status(500).json({ error: 'Failed to send game results' });
    }
  };
}

export default new NotificationController();
