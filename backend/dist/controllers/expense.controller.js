"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserExpenses = exports.markSplitAsPaid = exports.updateExpense = exports.getGroupExpenses = exports.createExpense = void 0;
const expense_model_1 = require("../models/expense.model");
const group_model_1 = require("../models/group.model");
const createExpense = async (req, res) => {
    try {
        const { groupId, title, description, amount, currency, category, splitType, splits, receiptUrl, date, } = req.body;
        const userId = req.user.id || req.user.userId || req.user._id;
        console.log('Creating expense:', { userId, groupId, title, amount });
        // Verify group membership
        const group = await group_model_1.Group.findOne({
            _id: groupId,
            'members.userId': userId,
        });
        if (!group) {
            return res.status(404).json({ error: 'Group not found or not a member' });
        }
        const expense = new expense_model_1.Expense({
            groupId,
            title,
            description,
            amount,
            currency,
            category,
            paidBy: userId,
            splitType,
            splits,
            receiptUrl,
            date: date || new Date(),
        });
        await expense.save();
        res.status(201).json(expense);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createExpense = createExpense;
const getGroupExpenses = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id || req.user.userId || req.user._id;
        console.log('Getting expenses for group:', groupId, 'User:', userId);
        // Check for invalid groupId
        if (!groupId || groupId === 'undefined' || groupId === 'null') {
            return res.status(400).json({ error: 'Invalid group ID provided' });
        }
        // Verify group membership
        const group = await group_model_1.Group.findOne({
            _id: groupId,
            'members.userId': userId,
        });
        if (!group) {
            return res.status(404).json({ error: 'Group not found or not a member' });
        }
        const expenses = await expense_model_1.Expense.find({ groupId })
            .populate('paidBy', 'fullName email avatarUrl')
            .populate('splits.userId', 'fullName email avatarUrl');
        // Transform expenses to match frontend expected format
        const transformedExpenses = expenses.map((expense) => {
            var _a;
            const expenseObj = expense.toObject();
            const paidBy = expenseObj.paidBy; // Use any to avoid TypeScript errors with populated fields
            return {
                id: expenseObj._id.toString(),
                title: expenseObj.title,
                description: expenseObj.description || null,
                amount: expenseObj.amount,
                currency: expenseObj.currency || 'USD',
                category: expenseObj.category,
                created_at: expenseObj.date || expenseObj.createdAt,
                paid_by: paidBy._id ? paidBy._id.toString() : paidBy.toString(),
                payer_name: paidBy.fullName || 'Unknown',
                payer_avatar: paidBy.avatarUrl || null,
                participants: expenseObj.splits.length,
                your_share: ((_a = expenseObj.splits.find((split) => {
                    const splitUserId = split.userId._id
                        ? split.userId._id.toString()
                        : split.userId.toString();
                    return splitUserId === userId.toString();
                })) === null || _a === void 0 ? void 0 : _a.amount) || 0,
            };
        });
        res.json(transformedExpenses);
    }
    catch (error) {
        console.error(`Error fetching expenses for group ${req.params.groupId}:`, error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getGroupExpenses = getGroupExpenses;
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const updates = req.body;
        const expense = await expense_model_1.Expense.findOne({ _id: id, paidBy: userId });
        if (!expense) {
            return res
                .status(404)
                .json({ error: 'Expense not found or not authorized' });
        }
        Object.assign(expense, updates);
        await expense.save();
        res.json(expense);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateExpense = updateExpense;
const markSplitAsPaid = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const userId = req.user._id;
        const expense = await expense_model_1.Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        const split = expense.splits.find((s) => s.userId.toString() === userId.toString());
        if (!split) {
            return res.status(404).json({ error: 'Split not found' });
        }
        split.paid = true;
        await expense.save();
        res.json(expense);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.markSplitAsPaid = markSplitAsPaid;
const getUserExpenses = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.user._id;
        console.log('Getting expenses for user:', userId);
        // Find all expenses where the user is either the payer or in the splits
        const expenses = await expense_model_1.Expense.find({
            $or: [{ paidBy: userId }, { 'splits.userId': userId }],
        })
            .populate('paidBy', 'fullName avatarUrl')
            .populate('groupId', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
        // Transform the data to include user-specific information
        const transformedExpenses = expenses.map((expense) => {
            const userSplit = expense.splits.find((split) => split.userId.toString() === userId.toString());
            return {
                id: expense._id,
                title: expense.title,
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                createdAt: expense.createdAt,
                paidBy: expense.paidBy,
                group: expense.groupId,
                yourShare: userSplit ? userSplit.amount : 0,
                participants: expense.splits.length,
                splitType: expense.splitType,
                paid: userSplit ? userSplit.paid : false,
            };
        });
        res.json(transformedExpenses);
    }
    catch (error) {
        console.error('Error getting user expenses:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserExpenses = getUserExpenses;
