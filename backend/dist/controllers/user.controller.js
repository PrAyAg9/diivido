"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivity = exports.getUserBalances = exports.updateUserProfile = exports.getAllUsers = exports.getUserProfile = void 0;
const user_model_1 = require("../models/user.model");
const group_model_1 = require("../models/group.model");
const expense_model_1 = require("../models/expense.model");
const payment_model_1 = require("../models/payment.model");
// --- Controller Functions --- //
/**
 * Get a specific user's public profile.
 */
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_model_1.User.findById(userId).select('-password');
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
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ error: 'Server error while fetching profile.' });
    }
};
exports.getUserProfile = getUserProfile;
/**
 * Get all users in the system, excluding the currently authenticated user.
 */
const getAllUsers = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const currentUserId = req.user.id;
        const users = await user_model_1.User.find({ _id: { $ne: currentUserId } })
            .select('-password')
            .sort({ fullName: 1 });
        const formattedUsers = users.map((user) => ({
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl || '',
        }));
        res.json(formattedUsers);
    }
    catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ error: 'Server error while fetching users.' });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Update the profile of the currently authenticated user.
 */
const updateUserProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;
        const { fullName, phone, avatarUrl } = req.body;
        const updateData = {};
        if (fullName)
            updateData.fullName = fullName;
        if (phone)
            updateData.phone = phone;
        if (avatarUrl)
            updateData.avatarUrl = avatarUrl;
        const user = await user_model_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');
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
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Server error while updating profile.' });
    }
};
exports.updateUserProfile = updateUserProfile;
/**
 * Get the current user's detailed financial balances with other users.
 */
const getUserBalances = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;
        // Fetch all data in parallel
        const [userGroups, payments] = await Promise.all([
            group_model_1.Group.find({ 'members.userId': userId }),
            payment_model_1.Payment.find({
                $or: [{ fromUser: userId }, { toUser: userId }],
                status: 'completed',
            }).populate('fromUser toUser')
        ]);
        const groupIds = userGroups.map(group => group._id);
        const expenses = await expense_model_1.Expense.find({ groupId: { $in: groupIds } })
            .populate('paidBy splits.userId');
        const balances = new Map();
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
            }
            else {
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
            }
            else {
                // Someone paid me, this reduces what I owe them
                balances.set(fromId, (balances.get(fromId) || 0) + payment.amount);
            }
        });
        // Categorize and format the final balances
        let totalOwed = 0;
        let totalOwedToYou = 0;
        const usersYouOwe = [];
        const usersWhoOweYou = [];
        // Fetch user details for all involved parties at once
        const involvedUserIds = Array.from(balances.keys());
        const involvedUsers = await user_model_1.User.find({ _id: { $in: involvedUserIds } }).select('fullName avatarUrl');
        const userMap = new Map(involvedUsers.map(u => [u._id.toString(), u]));
        for (const [otherUserId, balance] of balances.entries()) {
            const otherUser = userMap.get(otherUserId);
            if (!otherUser || Math.abs(balance) < 0.01)
                continue; // Ignore tiny balances
            if (balance < 0) { // I owe them
                const amount = Math.abs(balance);
                totalOwed += amount;
                usersYouOwe.push({ id: otherUserId, name: otherUser.fullName, avatarUrl: otherUser.avatarUrl, amount });
            }
            else { // They owe me
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
    }
    catch (error) {
        console.error('Error getting user balances:', error);
        res.status(500).json({ error: 'Server error while calculating balances.' });
    }
};
exports.getUserBalances = getUserBalances;
/**
 * Get the current user's recent activity feed, including expenses and payments.
 */
const getUserActivity = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.user.id;
        const userGroups = await group_model_1.Group.find({ 'members.userId': userId });
        const groupIds = userGroups.map(group => group._id);
        const expenses = await expense_model_1.Expense.find({ groupId: { $in: groupIds } })
            .populate('paidBy groupId');
        const payments = await payment_model_1.Payment.find({ $or: [{ fromUser: userId }, { toUser: userId }] })
            .populate('fromUser toUser');
        const expenseActivity = expenses.map(expense => {
            var _a, _b, _c;
            const userSplit = expense.splits.find(split => split.userId.toString() === userId);
            const youOwe = expense.paidBy._id.toString() !== userId ? ((userSplit === null || userSplit === void 0 ? void 0 : userSplit.amount) || 0) : 0;
            return {
                id: expense._id,
                type: 'expense',
                title: expense.title,
                group: ((_a = expense.groupId) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Group',
                amount: expense.amount,
                paidBy: ((_b = expense.paidBy) === null || _b === void 0 ? void 0 : _b.fullName) || 'Unknown User',
                youOwe,
                date: expense.date,
                avatar: ((_c = expense.paidBy) === null || _c === void 0 ? void 0 : _c.avatarUrl) || 'https://via.placeholder.com/50',
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
                date: payment.createdAt, // Payments have createdAt/updatedAt
                avatar: otherParty.avatarUrl || 'https://via.placeholder.com/50',
            };
        });
        const combinedActivity = [...expenseActivity, ...paymentActivity]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50); // Limit to most recent 50 activities
        res.json(combinedActivity);
    }
    catch (error) {
        console.error('Error getting user activity:', error);
        res.status(500).json({ error: 'Server error while fetching activity.' });
    }
};
exports.getUserActivity = getUserActivity;
