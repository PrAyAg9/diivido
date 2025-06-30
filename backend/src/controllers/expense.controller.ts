import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { Expense } from '../models/expense.model';
import { Group } from '../models/group.model';

export const createExpense = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      groupId,
      title,
      description,
      amount,
      currency,
      category,
      splitType,
      splits,
      receiptUrl,
      date,
    } = req.body;

    const userId = req.user.id;
    console.log('Creating expense:', { userId, groupId, title, amount });

    // Verify group membership
    const group = await Group.findOne({
      _id: groupId,
      'members.userId': userId,
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or not a member' });
    }

    const expense = new Expense({
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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getGroupExpenses = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log('Getting expenses for group:', groupId, 'User:', userId);

    // Check for invalid groupId
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      return res.status(400).json({ error: 'Invalid group ID provided' });
    }

    // Verify group membership
    const group = await Group.findOne({
      _id: groupId,
      'members.userId': userId,
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or not a member' });
    }

    const expenses = await Expense.find({ groupId })
      .populate('paidBy', 'fullName email avatarUrl')
      .populate('splits.userId', 'fullName email avatarUrl');

    // Transform expenses to match frontend expected format
    const transformedExpenses = expenses.map((expense) => {
      const expenseObj = expense.toObject();
      const paidBy = expenseObj.paidBy as any; // Use any to avoid TypeScript errors with populated fields

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
        your_share:
          expenseObj.splits.find((split: any) => {
            const splitUserId = split.userId._id
              ? split.userId._id.toString()
              : split.userId.toString();
            return splitUserId === userId.toString();
          })?.amount || 0,
      };
    });

    res.json(transformedExpenses);
  } catch (error) {
    console.error(
      `Error fetching expenses for group ${req.params.groupId}:`,
      error
    );
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateExpense = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const expense = await Expense.findOne({ _id: id, paidBy: userId });

    if (!expense) {
      return res
        .status(404)
        .json({ error: 'Expense not found or not authorized' });
    }

    Object.assign(expense, updates);
    await expense.save();

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const markSplitAsPaid = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const split = expense.splits.find(
      (s: any) => s.userId.toString() === userId.toString()
    );

    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    split.paid = true;
    await expense.save();

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserExpenses = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.id;
    console.log('Getting expenses for user:', userId);

    // Find all expenses where the user is either the payer or in the splits
    const expenses = await Expense.find({
      $or: [{ paidBy: userId }, { 'splits.userId': userId }],
    })
      .populate('paidBy', 'fullName avatarUrl')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    // Transform the data to include user-specific information
    const transformedExpenses = expenses.map((expense) => {
      const userSplit = expense.splits.find(
        (split: any) => split.userId.toString() === userId.toString()
      );

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
  } catch (error) {
    console.error('Error getting user expenses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
