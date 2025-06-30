import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { Expense } from '../models/expense.model';
import { Payment } from '../models/payment.model';
import { Types } from 'mongoose';

// --- Interfaces for Populated Mongoose Documents --- //

// Represents a User document after being populated
interface PopulatedUser {
  _id: Types.ObjectId;
  fullName: string;
  avatarUrl?: string;
}

// Represents an Expense document with populated fields
interface PopulatedExpense {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  date: Date;
  category: string;
  paidBy: PopulatedUser;
  groupId: { _id: Types.ObjectId; name: string };
  splits: { userId: PopulatedUser; amount: number }[];
}

// Represents a Payment document with populated fields
interface PopulatedPayment {
  fromUser: PopulatedUser;
  toUser: PopulatedUser;
  amount: number;
}

// --- Controller Functions --- //

/**
 * Get a specific user's public profile.
 */
export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Server error while fetching profile.' });
  }
};

/**
 * Get all users in the system, excluding the currently authenticated user.
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const currentUserId = req.user.id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password')
      .sort({ fullName: 1 });

    const formattedUsers = users.map((user) => ({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl || '',
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: 'Server error while fetching users.' });
  }
};

/**
 * Update the profile of the currently authenticated user.
 */
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id;
    const { fullName, phone, avatarUrl } = req.body;

    const updateData: Partial<typeof req.body> = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error while updating profile.' });
  }
};

/**
 * Get the current user's detailed financial balances with other users.
 */
export const getUserBalances = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id;

    // Fetch all data in parallel
    const [userGroups, payments] = await Promise.all([
        Group.find({ 'members.userId': userId }),
        Payment.find({
            $or: [{ fromUser: userId }, { toUser: userId }],
            status: 'completed',
        }).populate<PopulatedPayment>('fromUser toUser')
    ]);

    const groupIds = userGroups.map(group => group._id);
    const expenses = await Expense.find({ groupId: { $in: groupIds } })
        .populate<Pick<PopulatedExpense, 'paidBy' | 'splits'>>('paidBy splits.userId');

    const balances = new Map<string, number>();

    // Process expenses to calculate debts
    expenses.forEach(expense => {
      const payerId = expense.paidBy._id.toString();
      if (payerId === userId) {
        // I paid, so others owe me
        expense.splits.forEach(split => {
          const debtorId = split.userId._id.toString();
          if (debtorId !== userId) {
            balances.set(debtorId, (balances.get(debtorId) || 0) + split.amount);
          }
        });
      } else {
        // Someone else paid, I might owe them
        const mySplit = expense.splits.find(split => split.userId._id.toString() === userId);
        if (mySplit) {
          balances.set(payerId, (balances.get(payerId) || 0) - mySplit.amount);
        }
      }
    });

    // Adjust balances based on completed payments
    payments.forEach(payment => {
        const fromId = payment.fromUser._id.toString();
        const toId = payment.toUser._id.toString();
        if (fromId === userId) {
            // I paid someone, this reduces what they owe me
            balances.set(toId, (balances.get(toId) || 0) - payment.amount);
        } else {
            // Someone paid me, this reduces what I owe them
            balances.set(fromId, (balances.get(fromId) || 0) + payment.amount);
        }
    });

    // Categorize and format the final balances
    let totalOwed = 0;
    let totalOwedToYou = 0;
    const usersYouOwe: any[] = [];
    const usersWhoOweYou: any[] = [];
    
    // Fetch user details for all involved parties at once
    const involvedUserIds = Array.from(balances.keys());
    const involvedUsers = await User.find({ _id: { $in: involvedUserIds } }).select('fullName avatarUrl');
    const userMap = new Map(involvedUsers.map(u => [u._id.toString(), u]));

    for (const [otherUserId, balance] of balances.entries()) {
        const otherUser = userMap.get(otherUserId);
        if (!otherUser || Math.abs(balance) < 0.01) continue; // Ignore tiny balances

        if (balance < 0) { // I owe them
            const amount = Math.abs(balance);
            totalOwed += amount;
            usersYouOwe.push({ id: otherUserId, name: otherUser.fullName, avatarUrl: otherUser.avatarUrl, amount });
        } else { // They owe me
            totalOwedToYou += balance;
            usersWhoOweYou.push({ id: otherUserId, name: otherUser.fullName, avatarUrl: otherUser.avatarUrl, amount: balance });
        }
    }

    res.json({
      netBalance: totalOwedToYou - totalOwed,
      totalOwed,
      totalOwedToYou,
      usersYouOwe: usersYouOwe.sort((a, b) => b.amount - a.amount),
      usersWhoOweYou: usersWhoOweYou.sort((a, b) => b.amount - a.amount),
    });
  } catch (error) {
    console.error('Error getting user balances:', error);
    res.status(500).json({ error: 'Server error while calculating balances.' });
  }
};

/**
 * Get the current user's recent activity feed, including expenses and payments.
 */
export const getUserActivity = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;

        const userGroups = await Group.find({ 'members.userId': userId });
        const groupIds = userGroups.map(group => group._id);

        const expenses = await Expense.find({ groupId: { $in: groupIds } })
            .populate<PopulatedExpense>('paidBy groupId');

        const payments = await Payment.find({ $or: [{ fromUser: userId }, { toUser: userId }] })
            .populate<PopulatedPayment>('fromUser toUser');

        const expenseActivity = expenses.map(expense => {
            const userSplit = expense.splits.find(split => split.userId.toString() === userId);
            const youOwe = expense.paidBy._id.toString() !== userId ? (userSplit?.amount || 0) : 0;

            return {
                id: expense._id,
                type: 'expense',
                title: expense.title,
                group: expense.groupId?.name || 'Unknown Group',
                amount: expense.amount,
                paidBy: expense.paidBy?.fullName || 'Unknown User',
                youOwe,
                date: expense.date,
                avatar: expense.paidBy?.avatarUrl || 'https://via.placeholder.com/50',
                category: expense.category,
            };
        });
        
        const paymentActivity = payments.map(payment => {
            const isSender = payment.fromUser._id.toString() === userId;
            const otherParty = isSender ? payment.toUser : payment.fromUser;
            return {
                id: payment._id,
                type: isSender ? 'payment_sent' : 'payment_received',
                title: isSender ? `You paid ${otherParty.fullName}` : `${otherParty.fullName} paid you`,
                group: 'Direct Payment',
                amount: payment.amount,
                date: (payment as any).createdAt, // Payments have createdAt/updatedAt
                avatar: otherParty.avatarUrl || 'https://via.placeholder.com/50',
            };
        });

        const combinedActivity = [...expenseActivity, ...paymentActivity]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50); // Limit to most recent 50 activities

        res.json(combinedActivity);
    } catch (error) {
        console.error('Error getting user activity:', error);
        res.status(500).json({ error: 'Server error while fetching activity.' });
    }
};
