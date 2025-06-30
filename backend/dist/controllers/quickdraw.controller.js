"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const group_model_1 = require("../models/group.model");
const expense_model_1 = require("../models/expense.model");
const notification_service_1 = __importDefault(require("../services/notification.service"));
// In-memory game storage (in production, use Redis or MongoDB)
const activeGames = new Map();
class QuickDrawController {
    constructor() {
        // Start a new Quick Draw game for an expense
        this.startQuickDrawGame = async (req, res) => {
            var _a, _b;
            try {
                const { groupId, expenseData } = req.body;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                if (!groupId || !expenseData) {
                    res.status(400).json({ error: 'Group ID and expense data are required' });
                    return;
                }
                // Verify group membership and get all members
                const group = await group_model_1.Group.findById(groupId).populate('members.userId', 'fullName email');
                if (!group) {
                    res.status(404).json({ error: 'Group not found' });
                    return;
                }
                // Check if user is a member
                const isMember = group.members.some((member) => member.userId._id.toString() === userId.toString());
                if (!isMember) {
                    res.status(403).json({ error: 'Not a member of this group' });
                    return;
                }
                // Create game ID
                const gameId = `quickdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                // Create participants list from group members
                const participants = group.members.map((member) => ({
                    userId: member.userId._id.toString(),
                    userName: member.userId.fullName,
                    isReady: false,
                    hasPlayed: false,
                    reactionTime: undefined
                }));
                // Create the game
                const game = {
                    id: gameId,
                    groupId: groupId,
                    expenseData,
                    participants,
                    gameState: 'waiting',
                    createdAt: new Date()
                };
                activeGames.set(gameId, game);
                // Send push notifications to all group members
                await notification_service_1.default.sendQuickDrawNotifications(participants, expenseData.title, gameId);
                res.json({
                    success: true,
                    gameId,
                    message: `Quick Draw game started! Notifications sent to ${participants.length} players.`,
                    participants: participants.map(p => ({ userName: p.userName, isReady: p.isReady }))
                });
            }
            catch (error) {
                console.error('Error starting Quick Draw game:', error);
                res.status(500).json({ error: 'Failed to start Quick Draw game' });
            }
        };
        // Join a Quick Draw game
        this.joinGame = async (req, res) => {
            var _a, _b;
            try {
                const { gameId } = req.params;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                const game = activeGames.get(gameId);
                if (!game) {
                    res.status(404).json({ error: 'Game not found or expired' });
                    return;
                }
                // Find the participant
                const participant = game.participants.find(p => p.userId === userId.toString());
                if (!participant) {
                    res.status(403).json({ error: 'You are not a participant in this game' });
                    return;
                }
                // Mark as ready
                participant.isReady = true;
                // Check if all participants are ready
                const allReady = game.participants.every(p => p.isReady);
                if (allReady && game.gameState === 'waiting') {
                    // Start the countdown
                    game.gameState = 'ready';
                    // Schedule the signal after random delay (3-7 seconds)
                    const delay = 3000 + Math.random() * 4000; // 3-7 seconds
                    setTimeout(() => {
                        if (activeGames.has(gameId)) {
                            const currentGame = activeGames.get(gameId);
                            if (currentGame && currentGame.gameState === 'ready') {
                                currentGame.gameState = 'signal';
                                currentGame.signalTime = Date.now();
                                console.log(`🚨 SIGNAL! Game ${gameId} signal sent at ${currentGame.signalTime}`);
                            }
                        }
                    }, delay);
                }
                res.json({
                    success: true,
                    gameState: game.gameState,
                    participants: game.participants.map(p => ({
                        userName: p.userName,
                        isReady: p.isReady,
                        hasPlayed: p.hasPlayed
                    })),
                    allReady
                });
            }
            catch (error) {
                console.error('Error joining game:', error);
                res.status(500).json({ error: 'Failed to join game' });
            }
        };
        // Record a player's tap (reaction time)
        this.recordTap = async (req, res) => {
            var _a, _b;
            try {
                const { gameId } = req.params;
                const { tapTime } = req.body;
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                const game = activeGames.get(gameId);
                if (!game) {
                    res.status(404).json({ error: 'Game not found' });
                    return;
                }
                if (game.gameState !== 'signal') {
                    res.status(400).json({ error: 'Game is not in signal state' });
                    return;
                }
                // Find the participant
                const participant = game.participants.find(p => p.userId === userId.toString());
                if (!participant) {
                    res.status(403).json({ error: 'You are not a participant in this game' });
                    return;
                }
                if (participant.hasPlayed) {
                    res.status(400).json({ error: 'You have already played' });
                    return;
                }
                // Calculate reaction time
                const reactionTime = tapTime - (game.signalTime || 0);
                participant.reactionTime = reactionTime;
                participant.hasPlayed = true;
                console.log(`⚡ ${participant.userName} tapped in ${reactionTime}ms`);
                // Check if all players have played
                const allPlayed = game.participants.every(p => p.hasPlayed);
                if (allPlayed) {
                    // Game finished - determine winner and loser
                    const validTimes = game.participants.filter(p => p.reactionTime && p.reactionTime > 0);
                    if (validTimes.length > 0) {
                        // Sort by reaction time
                        validTimes.sort((a, b) => (a.reactionTime || 0) - (b.reactionTime || 0));
                        game.winner = validTimes[0].userName; // Fastest
                        game.loser = validTimes[validTimes.length - 1].userName; // Slowest
                        game.gameState = 'finished';
                        // Create the expense with the loser as the payer
                        const loserParticipant = validTimes[validTimes.length - 1];
                        await this.createExpenseForLoser(game, loserParticipant.userId);
                        console.log(`🏆 Game ${gameId} finished!`);
                        console.log(`🥇 Winner: ${game.winner} (${validTimes[0].reactionTime}ms)`);
                        console.log(`🐢 Loser: ${game.loser} (${validTimes[validTimes.length - 1].reactionTime}ms)`);
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
                            .sort((a, b) => (a.reactionTime || 0) - (b.reactionTime || 0))
                            .map(p => ({
                            userName: p.userName,
                            reactionTime: p.reactionTime
                        }))
                    } : null
                });
            }
            catch (error) {
                console.error('Error recording tap:', error);
                res.status(500).json({ error: 'Failed to record tap' });
            }
        };
        // Get game status
        this.getGameStatus = async (req, res) => {
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
                        reactionTime: p.reactionTime
                    })),
                    results: game.gameState === 'finished' ? {
                        winner: game.winner,
                        loser: game.loser
                    } : null
                });
            }
            catch (error) {
                console.error('Error getting game status:', error);
                res.status(500).json({ error: 'Failed to get game status' });
            }
        };
        // Create expense for the loser
        this.createExpenseForLoser = async (game, loserUserId) => {
            try {
                const expense = new expense_model_1.Expense({
                    groupId: game.groupId,
                    title: game.expenseData.title,
                    description: `Quick Draw result: ${game.loser} pays all! 🎯`,
                    amount: game.expenseData.amount,
                    currency: game.expenseData.currency || 'USD',
                    category: game.expenseData.category || 'other',
                    paidBy: loserUserId,
                    splitType: 'equal',
                    splits: game.participants.map(p => ({
                        userId: p.userId,
                        amount: 0, // Loser pays all, others pay nothing
                        paid: p.userId === loserUserId
                    })),
                    date: new Date()
                });
                await expense.save();
                console.log(`💰 Expense created: ${game.loser} pays $${game.expenseData.amount} for ${game.expenseData.title}`);
            }
            catch (error) {
                console.error('Error creating expense for loser:', error);
            }
        };
        // Clean up old games (call this periodically)
        this.cleanupOldGames = async (req, res) => {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            let cleaned = 0;
            for (const [gameId, game] of activeGames.entries()) {
                if (game.createdAt.getTime() < oneHourAgo) {
                    activeGames.delete(gameId);
                    cleaned++;
                }
            }
            res.json({ message: `Cleaned up ${cleaned} old games` });
        };
    }
}
exports.default = new QuickDrawController();
