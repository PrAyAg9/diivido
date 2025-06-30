import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Types } from 'mongoose';

// Create a new Expo SDK client
const expo = new Expo();

// --- Interfaces --- //

// Extends the default Express Request to include a typed user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // Standardize on 'id' for the authenticated user
  };
}

// Defines the shape of a user object when populated, including the push token
interface UserWithPushToken {
  _id: Types.ObjectId; // Mongoose documents use _id
  fullName: string;
  email: string;
  expoPushToken?: string;
}

// --- Controller Class --- //

class NotificationController {
  // Register a device for push notifications
  public registerDevice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { pushToken } = req.body;
      const userId = req.user?.id; // FIX: Standardize on req.user.id

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!pushToken) {
        res.status(400).json({ error: 'Push token is required' });
        return;
      }

      if (!Expo.isExpoPushToken(pushToken)) {
        res.status(400).json({ error: 'Invalid push token format' });
        return;
      }

      await User.findByIdAndUpdate(userId, { expoPushToken: pushToken });

      res.json({ success: true, message: 'Device registered for notifications' });
    } catch (error) {
      console.error('Error registering device:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  };

  // Send a Quick Draw game invitation notification to group members
  public sendQuickDrawNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { gameId, groupId } = req.body;
      const currentUserId = req.user?.id; // FIX: Standardize on req.user.id

      if (!gameId || !groupId) {
        res.status(400).json({ error: 'Game ID and Group ID are required' });
        return;
      }

      const group = await Group.findById(groupId).populate<{ members: { userId: UserWithPushToken }[] }>('members.userId', 'fullName email expoPushToken');
      
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      const currentUser = await User.findById(currentUserId);
      const initiatorName = currentUser?.fullName || 'Someone';

      const messages: ExpoPushMessage[] = [];
      const sentToNames: string[] = [];

      group.members.forEach(member => {
        // The populated user object is on member.userId
        const user = member.userId;
        
        // FIX: Check if user and token exist, and user is not the initiator
        if (user && user.expoPushToken && user._id.toString() !== currentUserId) {
          if (Expo.isExpoPushToken(user.expoPushToken)) {
            messages.push({
              to: user.expoPushToken,
              sound: 'default',
              title: '⚡ Quick Draw Challenge!',
              body: `${initiatorName} started a Quick Draw! Who will pay this time? Tap to join!`,
              data: { type: 'quickdraw', gameId, groupId, initiator: initiatorName },
              priority: 'high',
              ttl: 300,
            });
            sentToNames.push(user.fullName);
          }
        }
      });

      if (messages.length === 0) {
        res.json({ success: true, message: 'No other members with notifications enabled found.', sentTo: 0 });
        return;
      }

      // Send notifications
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      console.log(`📱 Quick Draw notifications sent to ${messages.length} players:`, sentToNames);
      res.json({
        success: true,
        message: `Quick Draw notifications sent to ${messages.length} players`,
        sentTo: messages.length,
        memberNames: sentToNames,
      });

    } catch (error) {
      console.error('Error sending Quick Draw notification:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  };

  // Send a nudge notification to a specific user
  public sendNudgeNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { targetUserId, message, amount } = req.body;
      const currentUserId = req.user?.id; // FIX: Standardize on req.user.id

      if (!targetUserId || !message) {
        res.status(400).json({ error: 'Target user ID and message are required' });
        return;
      }
      
      if (targetUserId === currentUserId) {
        res.status(400).json({ error: "You can't nudge yourself!" });
        return;
      }

      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId)
      ]);

      if (!targetUser) {
        res.status(404).json({ error: 'Target user not found' });
        return;
      }

      if (!targetUser.expoPushToken || !Expo.isExpoPushToken(targetUser.expoPushToken)) {
        res.json({ success: false, message: 'User does not have notifications enabled.' });
        return;
      }

      const senderName = currentUser?.fullName || 'Someone';

      const pushMessage: ExpoPushMessage = {
        to: targetUser.expoPushToken,
        sound: 'default',
        title: `💰 Friendly Reminder from ${senderName}`,
        body: message,
        data: { type: 'nudge', fromUserId: currentUserId, fromUserName: senderName, amount: amount || null },
        priority: 'normal',
      };

      await expo.sendPushNotificationsAsync([pushMessage]);

      console.log(`🎯 Nudge sent to ${targetUser.fullName}: ${message}`);
      res.json({ success: true, message: `Nudge sent to ${targetUser.fullName}` });

    } catch (error) {
      console.error('Error sending nudge notification:', error);
      res.status(500).json({ error: 'Failed to send nudge' });
    }
  };

  // Send game result notifications to all group members
  public sendGameResultNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId, groupId, winner, loser, expenseTitle } = req.body;

      if (!gameId || !groupId || !winner || !loser) {
        res.status(400).json({ error: 'Missing required game result data' });
        return;
      }

      const group = await Group.findById(groupId).populate<{ members: { userId: UserWithPushToken }[] }>('members.userId', 'fullName email expoPushToken');
      
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      const messages: ExpoPushMessage[] = [];

      group.members.forEach(member => {
        const user = member.userId;
        if (user && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
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
            data: { type: 'quickdraw_result', gameId, groupId, winner, loser, expenseTitle },
            priority: 'normal',
          });
        }
      });

      if (messages.length > 0) {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error('Error sending result notification chunk:', error);
          }
        }
      }

      console.log(`🎯 Game result notifications sent to ${messages.length} players`);
      res.json({ success: true, message: 'Game result notifications sent.', sentTo: messages.length });

    } catch (error) {
      console.error('Error sending game result notification:', error);
      res.status(500).json({ error: 'Failed to send game results' });
    }
  };
}

export default new NotificationController();
