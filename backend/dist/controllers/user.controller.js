"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivity = exports.getUserBalances = exports.updateUserProfile = exports.getAllUsers = exports.getUserProfile = void 0;
const user_model_1 = require("../models/user.model");
const group_model_1 = require("../models/group.model");
const expense_model_1 = require("../models/expense.model");
const payment_model_1 = require("../models/payment.model");
const mongoose_1 = __importDefault(require("mongoose"));
// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        // Debugging to check what's happening
        console.log('User profile request:', {
            requestedUserId: userId,
            tokenUserId: req.user.id || req.user.userId || req.user._id,
            user: req.user,
        });
        // Find the user profile
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
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserProfile = getUserProfile;
// Get all users
const getAllUsers = async (req, res) => {
    try {
        // Get all users excluding the current user and excluding passwords
        const userId = req.user.id || req.user.userId || req.user._id;
        const users = await user_model_1.User.find({ _id: { $ne: userId } })
            .select('-password')
            .sort({ fullName: 1 });
        // Map users to a consistent format
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
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
// Update user profile
const updateUserProfile = async (req, res) => {
    try {
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
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateUserProfile = updateUserProfile;
// Get user balances (how much they owe and are owed)
const getUserBalances = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.user._id;
        console.log('Getting balances for user:', userId);
        // First get all groups the user is a member of
        const userGroups = await group_model_1.Group.find({ 'members.userId': userId });
        const groupIds = userGroups.map((group) => group._id);
        // Find all expenses in these groups
        const expenses = await expense_model_1.Expense.find({ groupId: { $in: groupIds } })
            .populate('splits.userId', 'fullName avatarUrl')
            .populate('paidBy', 'fullName avatarUrl');
        // Find all payments involving the user
        const payments = await payment_model_1.Payment.find({
            $or: [{ fromUser: userId }, { toUser: userId }],
            status: 'completed',
        });
        // Calculate balances
        const balances = new Map();
        // Process expenses where user paid
        expenses.forEach((expense) => {
            if (expense.paidBy._id.toString() === userId) {
                // User paid, others owe them
                expense.splits.forEach((split) => {
                    if (split.userId._id.toString() !== userId) {
                        const currentBalance = balances.get(split.userId._id.toString()) || 0;
                        balances.set(split.userId._id.toString(), currentBalance + split.amount);
                    }
                });
            }
            else {
                // User didn't pay, they might owe
                const userSplit = expense.splits.find((split) => split.userId._id.toString() === userId);
                if (userSplit && !userSplit.paid) {
                    const payerId = expense.paidBy._id.toString();
                    const currentBalance = balances.get(payerId) || 0;
                    balances.set(payerId, currentBalance - userSplit.amount);
                }
            }
        });
        // Process payments
        payments.forEach((payment) => {
            if (payment.fromUser.toString() === userId) {
                // User paid someone
                const currentBalance = balances.get(payment.toUser.toString()) || 0;
                balances.set(payment.toUser.toString(), currentBalance + payment.amount);
            }
            else {
                // User received payment
                const currentBalance = balances.get(payment.fromUser.toString()) || 0;
                balances.set(payment.fromUser.toString(), currentBalance - payment.amount);
            }
        });
        // Create user objects for response
        const usersYouOwe = [];
        const usersWhoOweYou = [];
        let totalOwed = 0;
        let totalOwedToYou = 0;
        // Get user data for all involved users
        const userIds = [...balances.keys()];
        const users = await user_model_1.User.find({ _id: { $in: userIds } }).select('fullName avatarUrl');
        const userMap = new Map(users.map((user) => [user._id.toString(), user]));
        // Categorize balances
        for (const [userId, balance] of balances.entries()) {
            const user = userMap.get(userId);
            if (!user)
                continue;
            if (balance < -0.01) {
                // User owes them money
                const amount = Math.abs(balance);
                totalOwed += amount;
                usersYouOwe.push({
                    id: userId,
                    name: user.fullName,
                    avatarUrl: user.avatarUrl,
                    amount: amount,
                });
            }
            else if (balance > 0.01) {
                // They owe user money
                totalOwedToYou += balance;
                usersWhoOweYou.push({
                    id: userId,
                    name: user.fullName,
                    avatarUrl: user.avatarUrl,
                    amount: balance,
                });
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
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserBalances = getUserBalances;
// Get user activity
const getUserActivity = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.user._id;
        console.log('Getting activity for user:', userId);
        // Get all groups the user is a member of
        const userGroups = await group_model_1.Group.find({ 'members.userId': userId });
        const groupIds = userGroups.map((group) => group._id);
        // Get recent expenses from those groups
        const expenses = await expense_model_1.Expense.find({ groupId: { $in: groupIds } })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('paidBy', 'fullName avatarUrl')
            .populate('groupId', 'name');
        // Get expense splits for these expenses where user is involved
        const expenseIds = expenses.map((expense) => expense._id);
        const userSplits = await expense_model_1.Expense.find({
            _id: { $in: expenseIds },
            'splits.userId': new mongoose_1.default.Types.ObjectId(userId),
        });
        // Map splits to expense IDs for quick lookup
        const splitMap = new Map();
        userSplits.forEach((expense) => {
            const userSplit = expense.splits.find((split) => split.userId.toString() === userId);
            if (userSplit) {
                splitMap.set(expense._id.toString(), userSplit.amount);
            }
        });
        // Format the activity data
        const activity = expenses.map((expense) => {
            const split = splitMap.get(expense._id.toString()) || 0;
            return {
                id: expense._id,
                title: expense.title,
                group: expense.groupId.name,
                amount: expense.amount,
                youOwe: expense.paidBy._id.toString() === userId ? 0 : split,
                date: expense.createdAt.toLocaleDateString(),
                avatar: expense.paidBy.avatarUrl || 'https://via.placeholder.com/50',
                category: expense.category,
            };
        });
        res.json(activity);
    }
    catch (error) {
        console.error('Error getting user activity:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserActivity = getUserActivity;
