import { Request, Response } from 'express';
import { Payment } from '../models/payment.model';
import { Group } from '../models/group.model';

export const createPayment = async (req: Request, res: Response) => {
  try {
    const {
      toUser,
      groupId,
      amount,
      currency,
      paymentMethod,
      notes
    } = req.body;

    const fromUser = req.user._id;

    // If groupId is provided, verify both users are members of the group
    if (groupId) {
      const group = await Group.findOne({
        _id: groupId,
        'members.userId': { $all: [fromUser, toUser] }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found or users not members' });
      }
    }

    const payment = new Payment({
      fromUser,
      toUser,
      groupId,
      amount,
      currency,
      paymentMethod,
      notes,
      status: 'pending'
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.query;

    const query: any = {
      $or: [{ fromUser: userId }, { toUser: userId }]
    };

    if (groupId) {
      query.groupId = groupId;
    }

    const payments = await Payment.find(query)
      .populate('fromUser', 'fullName email avatarUrl')
      .populate('toUser', 'fullName email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const payment = await Payment.findOne({
      _id: id,
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or not authorized' });
    }

    // Only the recipient can mark a payment as completed
    if (status === 'completed' && payment.toUser.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the recipient can mark a payment as completed' });
    }

    // Only the sender can mark a payment as failed
    if (status === 'failed' && payment.fromUser.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the sender can mark a payment as failed' });
    }

    payment.status = status as 'pending' | 'completed' | 'failed';
    await payment.save();

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    console.log('Getting payments for user:', userId);

    const payments = await Payment.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    })
    .populate('fromUser', 'fullName avatarUrl')
    .populate('toUser', 'fullName avatarUrl')
    .populate('groupId', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(payments);
  } catch (error) {
    console.error('Error getting user payments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getGroupPayments = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id || req.user.userId || req.user._id;

    // Verify user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.userId': userId
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or not a member' });
    }

    const payments = await Payment.find({ groupId })
      .populate('fromUser', 'fullName avatarUrl')
      .populate('toUser', 'fullName avatarUrl')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error getting group payments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId || req.user._id;

    const payment = await Payment.findOne({
      _id: id,
      toUser: userId // Only recipient can confirm
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or not authorized' });
    }

    payment.status = 'completed';
    await payment.save();

    res.json(payment);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
