"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.removeFriend = exports.rejectFriendRequest = exports.acceptFriendRequest = exports.sendFriendRequest = exports.getFriends = void 0;
const user_model_1 = require("../models/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
// Create FriendRequest model if it doesn't exist
const FriendRequestSchema = new mongoose_1.default.Schema({
    fromUserId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    toUserId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });
const FriendRequest = mongoose_1.default.models.FriendRequest ||
    mongoose_1.default.model('FriendRequest', FriendRequestSchema);
const getFriends = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get friend relationships where user is either sender or receiver and status is accepted
        const friendships = await FriendRequest.find({
            $or: [{ fromUserId: userId }, { toUserId: userId }],
            status: 'accepted',
        })
            .populate('fromUserId', 'fullName email avatarUrl')
            .populate('toUserId', 'fullName email avatarUrl');
        // Transform to friends format
        const friends = friendships.map((friendship) => {
            const friend = friendship.fromUserId._id.toString() === userId
                ? friendship.toUserId
                : friendship.fromUserId;
            return {
                id: friend._id,
                fullName: friend.fullName,
                email: friend.email,
                avatarUrl: friend.avatarUrl,
                status: 'accepted',
                createdAt: friendship.createdAt,
                updatedAt: friendship.updatedAt,
            };
        });
        // Also get pending requests
        const pendingRequests = await FriendRequest.find({
            $or: [{ fromUserId: userId }, { toUserId: userId }],
            status: 'pending',
        })
            .populate('fromUserId', 'fullName email avatarUrl')
            .populate('toUserId', 'fullName email avatarUrl');
        const pendingFriends = pendingRequests.map((request) => {
            const friend = request.fromUserId._id.toString() === userId
                ? request.toUserId
                : request.fromUserId;
            const status = request.fromUserId._id.toString() === userId
                ? 'pending_sent'
                : 'pending_received';
            return {
                id: friend._id,
                fullName: friend.fullName,
                email: friend.email,
                avatarUrl: friend.avatarUrl,
                status,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
            };
        });
        friends.push(...pendingFriends);
        return res.json({ data: friends });
    }
    catch (error) {
        console.error('Error in getFriends:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getFriends = getFriends;
const sendFriendRequest = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { email } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Find user by email
        const targetUser = await user_model_1.User.findOne({ email }).select('_id fullName email avatarUrl');
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (targetUser._id.toString() === userId) {
            return res
                .status(400)
                .json({ error: 'Cannot send friend request to yourself' });
        }
        // Check if friendship or request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { fromUserId: userId, toUserId: targetUser._id },
                { fromUserId: targetUser._id, toUserId: userId },
            ],
        });
        if (existingRequest) {
            return res
                .status(400)
                .json({
                error: 'Friend request already exists or you are already friends',
            });
        }
        // Create friend request
        const friendRequest = new FriendRequest({
            fromUserId: userId,
            toUserId: targetUser._id,
            status: 'pending',
        });
        await friendRequest.save();
        return res.json({
            data: {
                id: friendRequest._id,
                fromUserId: friendRequest.fromUserId,
                toUserId: friendRequest.toUserId,
                status: friendRequest.status,
                fromUser: req.user,
                toUser: {
                    id: targetUser._id,
                    fullName: targetUser.fullName,
                    email: targetUser.email,
                    avatarUrl: targetUser.avatarUrl,
                },
                createdAt: friendRequest.createdAt,
                updatedAt: friendRequest.updatedAt,
            },
        });
    }
    catch (error) {
        console.error('Error in sendFriendRequest:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.sendFriendRequest = sendFriendRequest;
const acceptFriendRequest = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { requestId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get the friend request
        const friendRequest = await FriendRequest.findOne({
            _id: requestId,
            toUserId: userId,
            status: 'pending',
        });
        if (!friendRequest) {
            return res.status(404).json({ error: 'Friend request not found' });
        }
        // Update status to accepted
        friendRequest.status = 'accepted';
        friendRequest.updatedAt = new Date();
        await friendRequest.save();
        // Get the friend user details
        const friendUser = await user_model_1.User.findById(friendRequest.fromUserId).select('_id fullName email avatarUrl');
        if (!friendUser) {
            return res.status(500).json({ error: 'Failed to get friend details' });
        }
        return res.json({
            data: {
                id: friendUser._id,
                fullName: friendUser.fullName,
                email: friendUser.email,
                avatarUrl: friendUser.avatarUrl,
                status: 'accepted',
            },
        });
    }
    catch (error) {
        console.error('Error in acceptFriendRequest:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.acceptFriendRequest = acceptFriendRequest;
const rejectFriendRequest = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { requestId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Delete the friend request
        const result = await FriendRequest.deleteOne({
            _id: requestId,
            toUserId: userId,
            status: 'pending',
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Error in rejectFriendRequest:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.rejectFriendRequest = rejectFriendRequest;
const removeFriend = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { friendId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Delete the friendship (friend request with accepted status)
        const result = await FriendRequest.deleteOne({
            $or: [
                { fromUserId: userId, toUserId: friendId },
                { fromUserId: friendId, toUserId: userId },
            ],
            status: 'accepted',
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Friendship not found' });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Error in removeFriend:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeFriend = removeFriend;
const searchUsers = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { email } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }
        // Search for users by email (partial match)
        const users = await user_model_1.User.find({
            email: { $regex: email, $options: 'i' },
            _id: { $ne: userId }, // Exclude current user
        })
            .select('_id fullName email avatarUrl')
            .limit(10);
        const userData = users.map((user) => ({
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            avatarUrl: user.avatarUrl,
        }));
        return res.json({ data: userData });
    }
    catch (error) {
        console.error('Error in searchUsers:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.searchUsers = searchUsers;
