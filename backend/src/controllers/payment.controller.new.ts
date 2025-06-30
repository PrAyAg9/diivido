import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express'; // Assuming you have a types file
import { Payment, IPayment } from '../models/payment.model'; // Import the IPayment interface
import { User } from '../models/user.model';

// --- Controller Functions --- //

export const createPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toUserId, amount, description, expenseId, groupId } = req.body;
    const fromUser = req.user?.id;

    if (!fromUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!toUserId || !amount) {
        return res.status(400).json({ error: 'Recipient and amount are required.' });
    }

    const payment = new Payment({
      fromUser: fromUser, // FIX: Use 'fromUser' to match the likely schema
      toUser: toUserId,   // FIX: Use 'toUser' to match the likely schema
      amount,
      description,
      expenseId,
      groupId,
      status: 'pending',
    });

    await payment.save();

    // Populate the payment with user details for the response
    const populatedPayment = await Payment.findById(payment._id)
      .populate('fromUser', 'fullName email avatarUrl') // FIX: Populate 'fromUser'
      .populate('toUser', 'fullName email avatarUrl');   // FIX: Populate 'toUser'

    res.status(201).json({
      message: 'Payment created successfully',
      payment: populatedPayment,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getUserPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const payments = await Payment.find({
      // FIX: Query using 'fromUser' and 'toUser' fields
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .populate('fromUser', 'fullName email avatarUrl') // FIX: Populate 'fromUser'
      .populate('toUser', 'fullName email avatarUrl')   // FIX: Populate 'toUser'
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ error: 'Failed to fetch user payments' });
  }
};

export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!status || !['completed', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only the recipient can update the payment status
    // FIX: Check against 'toUser' property
    if (payment.toUser.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this payment' });
    }

    payment.status = status;
    
    // FIX: Ensure your IPayment interface and Mongoose schema include 'completedAt'
    if (status === 'completed') {
      (payment as IPayment).completedAt = new Date();
    }

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('fromUser', 'fullName email')
      .populate('toUser', 'fullName email');

    res.json({
      message: 'Payment status updated successfully',
      payment: populatedPayment,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};


export const getGroupPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({ error: 'Group ID is required.' });
    }

    const payments = await Payment.find({ groupId })
      .populate('fromUser', 'fullName email avatarUrl')
      .populate('toUser', 'fullName email avatarUrl')
      .populate('expenseId', 'title amount')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching group payments:', error);
    res.status(500).json({ error: 'Failed to fetch group payments' });
  }
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { method, transactionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only the payer (fromUser) can confirm the payment details
    // FIX: Check against 'fromUser' property
    if (payment.fromUser.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to confirm this payment' });
    }

    payment.status = 'completed';

    // FIX: Ensure your IPayment interface and Mongoose schema include these fields
    (payment as IPayment).completedAt = new Date();
    (payment as IPayment).paymentMethod = method;
    (payment as IPayment).transactionId = transactionId;

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('fromUser', 'fullName email')
      .populate('toUser', 'fullName email');

    res.json({
      message: 'Payment confirmed successfully',
      payment: populatedPayment,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};
