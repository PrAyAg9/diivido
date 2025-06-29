"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPayment = exports.getGroupPayments = exports.getUserPayments = exports.updatePaymentStatus = exports.getPayments = exports.createPayment = void 0;
const payment_model_1 = require("../models/payment.model");
const group_model_1 = require("../models/group.model");
const createPayment = async (req, res) => {
    try {
        const { toUser, groupId, amount, currency, paymentMethod, notes } = req.body;
        const fromUser = req.user._id;
        // If groupId is provided, verify both users are members of the group
        if (groupId) {
            const group = await group_model_1.Group.findOne({
                _id: groupId,
                'members.userId': { $all: [fromUser, toUser] },
            });
            if (!group) {
                return res
                    .status(404)
                    .json({ error: 'Group not found or users not members' });
            }
        }
        const payment = new payment_model_1.Payment({
            fromUser,
            toUser,
            groupId,
            amount,
            currency,
            paymentMethod,
            notes,
            status: 'pending',
        });
        await payment.save();
        res.status(201).json(payment);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createPayment = createPayment;
const getPayments = async (req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.query;
        const query = {
            $or: [{ fromUser: userId }, { toUser: userId }],
        };
        if (groupId) {
            query.groupId = groupId;
        }
        const payments = await payment_model_1.Payment.find(query)
            .populate('fromUser', 'fullName email avatarUrl')
            .populate('toUser', 'fullName email avatarUrl')
            .sort({ createdAt: -1 });
        res.json(payments);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getPayments = getPayments;
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;
        const payment = await payment_model_1.Payment.findOne({
            _id: id,
            $or: [{ fromUser: userId }, { toUser: userId }],
        });
        if (!payment) {
            return res
                .status(404)
                .json({ error: 'Payment not found or not authorized' });
        }
        // Only the recipient can mark a payment as completed
        if (status === 'completed' &&
            payment.toUser.toString() !== userId.toString()) {
            return res
                .status(403)
                .json({ error: 'Only the recipient can mark a payment as completed' });
        }
        // Only the sender can mark a payment as failed
        if (status === 'failed' &&
            payment.fromUser.toString() !== userId.toString()) {
            return res
                .status(403)
                .json({ error: 'Only the sender can mark a payment as failed' });
        }
        payment.status = status;
        await payment.save();
        res.json(payment);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const getUserPayments = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId || req.user._id;
        console.log('Getting payments for user:', userId);
        const payments = await payment_model_1.Payment.find({
            $or: [{ fromUser: userId }, { toUser: userId }],
        })
            .populate('fromUser', 'fullName avatarUrl')
            .populate('toUser', 'fullName avatarUrl')
            .populate('groupId', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(payments);
    }
    catch (error) {
        console.error('Error getting user payments:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUserPayments = getUserPayments;
const getGroupPayments = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id || req.user.userId || req.user._id;
        // Verify user is a member of the group
        const group = await group_model_1.Group.findOne({
            _id: groupId,
            'members.userId': userId,
        });
        if (!group) {
            return res.status(404).json({ error: 'Group not found or not a member' });
        }
        const payments = await payment_model_1.Payment.find({ groupId })
            .populate('fromUser', 'fullName avatarUrl')
            .populate('toUser', 'fullName avatarUrl')
            .sort({ createdAt: -1 });
        res.json(payments);
    }
    catch (error) {
        console.error('Error getting group payments:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getGroupPayments = getGroupPayments;
const confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId || req.user._id;
        const payment = await payment_model_1.Payment.findOne({
            _id: id,
            toUser: userId, // Only recipient can confirm
        });
        if (!payment) {
            return res
                .status(404)
                .json({ error: 'Payment not found or not authorized' });
        }
        payment.status = 'completed';
        await payment.save();
        res.json(payment);
    }
    catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.confirmPayment = confirmPayment;
