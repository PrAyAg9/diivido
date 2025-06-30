import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express'; // Assuming you have a standard types file
import { Group } from '../models/group.model';
import { User } from '../models/user.model';
import { Expense } from '../models/expense.model';
import notificationService from '../services/notification.service';
import { Types } from 'mongoose';

// --- Interfaces --- //

interface PopulatedMember {
  userId: {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
  };
  // other member fields like 'role'
}

interface QuickDrawGame {
  id: string;
  groupId: string;
  expenseData: any;
  participants: Array<{
    userId: string;
    userName: string;
    isReady: boolean;
    hasPlayed: boolean;
    reactionTime?: number;
  }>;
  gameState: 'waiting' | 'ready' | 'signal' | 'finished';
  signalTime?: number;
  winner?: string;
  loser?: string;
  createdAt: Date;
}

// In-memory game storage (in production, consider using Redis or a temporary MongoDB collection)
const activeGames = new Map<string, QuickDrawGame>();

// --- Controller Class --- //

class QuickDrawController {
  
  public startQuickDrawGame = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { groupId, expenseData } = req.body;
      const userId = req.user?.id; // FIX: Standardize on req.user.id

      if (!userId) {
        res.status(400).json({ error: 'User not authenticated' });
        return;
      }

      if (!groupId || !expenseData) {
        res.status(400).json({ error: 'Group ID and expense data are required' });
        return;
      }

      const group = await Group.findById(groupId).populate< { members: PopulatedMember[] }>('members.userId', 'fullName email');
      
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      const isMember = group.members.some(member => member.userId._id.toString() === userId);
      if (!isMember) {
        res.status(403).json({ error: 'You are not a member of this group' });
        return;
      }

      const gameId = `quickdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const participants = group.members.map(member => ({
        userId: member.userId._id.toString(),
        userName: member.userId.fullName,
        isReady: false,
        hasPlayed: false,
        reactionTime: undefined,
      }));

      const game: QuickDrawGame = {
        id: gameId,
        groupId,
        expenseData,
        participants,
        gameState: 'waiting',
        createdAt: new Date(),
      };

      activeGames.set(gameId, game);

      // Assuming notificationService is correctly typed and imported
      // await notificationService.sendQuickDrawNotifications(participants, expenseData.title, gameId);

      res.json({
        success: true,
        gameId,
        message: `Quick Draw game started! Notifications sent to ${participants.length} players.`,
        participants: participants.map(p => ({ userName: p.userName, isReady: p.isReady })),
      });

    } catch (error) {
      console.error('Error starting Quick Draw game:', error);
      res.status(500).json({ error: 'Failed to start Quick Draw game' });
    }
  }

  public joinGame = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const userId = req.user?.id; // FIX: Standardize on req.user.id

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const game = activeGames.get(gameId);
      if (!game) {
        res.status(404).json({ error: 'Game not found or has expired' });
        return;
      }

      const participant = game.participants.find(p => p.userId === userId);
      if (!participant) {
        res.status(403).json({ error: 'You are not a participant in this game' });
        return;
      }

      participant.isReady = true;

      const allReady = game.participants.every(p => p.isReady);
      
      if (allReady && game.gameState === 'waiting') {
        game.gameState = 'ready';
        
        const delay = 3000 + Math.random() * 4000; // 3-7 seconds
        
        setTimeout(() => {
          const currentGame = activeGames.get(gameId);
          if (currentGame && currentGame.gameState === 'ready') {
            currentGame.gameState = 'signal';
            currentGame.signalTime = Date.now();
            console.log(`🚨 SIGNAL! Game ${gameId} signal sent at ${currentGame.signalTime}`);
          }
        }, delay);
      }

      res.json({
        success: true,
        gameState: game.gameState,
        participants: game.participants.map(p => ({
          userName: p.userName,
          isReady: p.isReady,
          hasPlayed: p.hasPlayed,
        })),
        allReady,
      });

    } catch (error) {
      console.error('Error joining game:', error);
      res.status(500).json({ error: 'Failed to join game' });
    }
  }

  public recordTap = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { tapTime } = req.body;
      const userId = req.user?.id; // FIX: Standardize on req.user.id

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const game = activeGames.get(gameId);
      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      if (game.gameState !== 'signal') {
        res.status(400).json({ error: 'Game is not in the active signal state. Too early or too late!' });
        return;
      }

      const participant = game.participants.find(p => p.userId === userId);
      if (!participant) {
        res.status(403).json({ error: 'You are not a participant in this game' });
        return;
      }

      if (participant.hasPlayed) {
        res.status(400).json({ error: 'You have already played this round' });
        return;
      }

      const reactionTime = tapTime - (game.signalTime || 0);
      participant.reactionTime = reactionTime;
      participant.hasPlayed = true;

      console.log(`⚡ ${participant.userName} tapped in ${reactionTime}ms`);

      const allPlayed = game.participants.every(p => p.hasPlayed);

      if (allPlayed) {
        game.gameState = 'finished';
        const validTimes = game.participants.filter(p => typeof p.reactionTime === 'number' && p.reactionTime >= 0);
        
        if (validTimes.length > 0) {
          validTimes.sort((a, b) => a.reactionTime! - b.reactionTime!);
          
          game.winner = validTimes[0].userName;
          game.loser = validTimes[validTimes.length - 1].userName;

          await this.createExpenseForLoser(game, validTimes[validTimes.length - 1].userId);

          console.log(`🏆 Game ${gameId} finished! Winner: ${game.winner}, Loser: ${game.loser}`);
        }
      }

      res.json({
        success: true,
        reactionTime,
        gameState: game.gameState,
        results: game.gameState === 'finished' ? {
          winner: game.winner,
          loser: game.loser,
          allTimes: game.participants
            .filter(p => p.reactionTime)
            .sort((a, b) => a.reactionTime! - b.reactionTime!)
            .map(p => ({ userName: p.userName, reactionTime: p.reactionTime })),
        } : null,
      });

    } catch (error) {
      console.error('Error recording tap:', error);
      res.status(500).json({ error: 'Failed to record tap' });
    }
  }

  public getGameStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const game = activeGames.get(gameId);
      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      res.json({
        gameId: game.id,
        gameState: game.gameState,
        expenseTitle: game.expenseData.title,
        participants: game.participants.map(p => ({
          userName: p.userName,
          isReady: p.isReady,
          hasPlayed: p.hasPlayed,
          reactionTime: p.reactionTime,
        })),
        results: game.gameState === 'finished' ? {
          winner: game.winner,
          loser: game.loser,
        } : null,
      });

    } catch (error) {
      console.error('Error getting game status:', error);
      res.status(500).json({ error: 'Failed to get game status' });
    }
  }

  private createExpenseForLoser = async (game: QuickDrawGame, loserUserId: string): Promise<void> => {
    try {
      // The loser pays the full amount
      const paidBy = loserUserId;
      
      // The expense is split equally among all participants, as they all "benefitted" from the activity.
      // The 'paidBy' field correctly assigns the cost to the loser.
      const splitAmount = game.expenseData.amount / game.participants.length;

      const expense = new Expense({
        groupId: game.groupId,
        title: game.expenseData.title,
        description: `Quick Draw result: ${game.loser} pays all! 🎯`,
        amount: game.expenseData.amount,
        currency: game.expenseData.currency || 'USD',
        category: game.expenseData.category || 'other',
        paidBy: paidBy,
        splitType: 'equal',
        splits: game.participants.map(p => ({
          userId: p.userId,
          amount: splitAmount, // FIX: Correctly assign the split amount
        })),
        date: new Date(),
      });

      await expense.save();
      console.log(`💰 Expense created: ${game.loser} pays ${game.expenseData.amount} for "${game.expenseData.title}"`);

    } catch (error) {
      console.error('Error creating expense for loser:', error);
    }
  }

  public cleanupOldGames = async (req: Request, res: Response): Promise<void> => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let cleaned = 0;

    for (const [gameId, game] of activeGames.entries()) {
      if (game.createdAt.getTime() < oneHourAgo) {
        activeGames.delete(gameId);
        cleaned++;
      }
    }
    console.log(`🧹 Cleaned up ${cleaned} old games.`);
    res.json({ message: `Cleaned up ${cleaned} old games` });
  }
}

export default new QuickDrawController();
