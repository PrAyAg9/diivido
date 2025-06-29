"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendInvitation = exports.getUserSentInvitations = exports.respondToInvitation = exports.getPendingInvitations = exports.checkEmailExists = exports.sendInvitation = void 0;
const invitation_model_1 = require("../models/invitation.model");
const user_model_1 = require("../models/user.model");
const group_model_1 = require("../models/group.model");
const email_service_1 = require("../services/email.service");
const crypto_1 = __importDefault(require("crypto"));
//
const sendInvitation = async (req, res) => {
    var _a;
    try {
        const { email, groupId, groupName } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists in the system',
                userExists: true,
            });
        }
        // Check if invitation already exists and is pending
        const existingInvitation = await invitation_model_1.Invitation.findOne({
            email: email.toLowerCase(),
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });
        if (existingInvitation) {
            return res.status(400).json({
                error: 'Invitation already sent to this email',
            });
        }
        // Generate invitation token
        const invitationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Create invitation
        const invitation = new invitation_model_1.Invitation({
            email: email.toLowerCase(),
            invitedBy: userId,
            groupId: groupId || null,
            groupName: groupName || null,
            invitationToken,
            status: 'pending',
        });
        await invitation.save();
        // Get inviter details
        const inviter = await user_model_1.User.findById(userId).select('fullName');
        const inviterName = (inviter === null || inviter === void 0 ? void 0 : inviter.fullName) || 'Someone';
        // Send invitation email
        try {
            await (0, email_service_1.sendInvitationEmail)({
                email: email.toLowerCase(),
                inviterName,
                groupName,
                invitationToken,
            });
            console.log(`Invitation email sent to ${email}`);
        }
        catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Don't fail the request if email fails, but log it
        }
        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation: {
                id: invitation._id,
                email: invitation.email,
                groupName: invitation.groupName,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
            },
        });
    }
    catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
};
exports.sendInvitation = sendInvitation;
// Check if email exists
const checkEmailExists = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        res.json({
            exists: !!user,
            user: user
                ? {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                }
                : null,
        });
    }
    catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Failed to check email' });
    }
};
exports.checkEmailExists = checkEmailExists;
// Get pending invitations for current user
const getPendingInvitations = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const invitations = await invitation_model_1.Invitation.find({
            email: user.email.toLowerCase(),
            status: 'pending',
            expiresAt: { $gt: new Date() },
        }).populate('invitedBy', 'fullName email avatarUrl');
        res.json({
            invitations: invitations.map((inv) => ({
                id: inv._id,
                groupName: inv.groupName,
                invitedBy: inv.invitedBy,
                createdAt: inv.createdAt,
                expiresAt: inv.expiresAt,
            })),
        });
    }
    catch (error) {
        console.error('Error getting pending invitations:', error);
        res.status(500).json({ error: 'Failed to get pending invitations' });
    }
};
exports.getPendingInvitations = getPendingInvitations;
// Respond to invitation
const respondToInvitation = async (req, res) => {
    var _a;
    try {
        const { invitationId } = req.params;
        const { action } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const invitation = await invitation_model_1.Invitation.findOne({
            _id: invitationId,
            email: user.email.toLowerCase(),
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found or expired' });
        }
        // Update invitation status
        invitation.status = action === 'accept' ? 'accepted' : 'declined';
        await invitation.save();
        // If accepted and there's a group, add user to the group
        if (action === 'accept' && invitation.groupId) {
            const group = await group_model_1.Group.findById(invitation.groupId);
            if (group && !group.members.includes(userId)) {
                group.members.push(userId);
                await group.save();
            }
        }
        res.json({
            message: `Invitation ${action}ed successfully`,
            invitation: {
                id: invitation._id,
                status: invitation.status,
            },
        });
    }
    catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ error: 'Failed to respond to invitation' });
    }
};
exports.respondToInvitation = respondToInvitation;
// Get invitations sent by current user
const getUserSentInvitations = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const invitations = await invitation_model_1.Invitation.find({
            invitedBy: userId,
        }).sort({ createdAt: -1 });
        res.json(invitations.map((inv) => ({
            id: inv._id,
            email: inv.email,
            groupName: inv.groupName,
            status: inv.status,
            createdAt: inv.createdAt,
            expiresAt: inv.expiresAt,
        })));
    }
    catch (error) {
        console.error('Error getting sent invitations:', error);
        res.status(500).json({ error: 'Failed to get sent invitations' });
    }
};
exports.getUserSentInvitations = getUserSentInvitations;
// Resend invitation
const resendInvitation = async (req, res) => {
    var _a;
    try {
        const { email, groupId, groupName } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists in the system',
                userExists: true,
            });
        }
        // Find existing invitation
        const existingInvitation = await invitation_model_1.Invitation.findOne({
            email: email.toLowerCase(),
            invitedBy: userId,
        });
        if (existingInvitation) {
            // Update the existing invitation
            existingInvitation.status = 'pending';
            existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            existingInvitation.invitationToken = crypto_1.default
                .randomBytes(32)
                .toString('hex');
            existingInvitation.groupId = groupId || null;
            existingInvitation.groupName = groupName || null;
            await existingInvitation.save();
            // Get inviter details
            const inviter = await user_model_1.User.findById(userId).select('fullName');
            const inviterName = (inviter === null || inviter === void 0 ? void 0 : inviter.fullName) || 'Someone';
            // Send invitation email
            try {
                await (0, email_service_1.sendInvitationEmail)({
                    email: email.toLowerCase(),
                    inviterName,
                    groupName,
                    invitationToken: existingInvitation.invitationToken,
                });
                console.log(`Invitation email resent to ${email}`);
            }
            catch (emailError) {
                console.error('Failed to resend invitation email:', emailError);
            }
            res.status(200).json({
                message: 'Invitation resent successfully',
                invitation: {
                    id: existingInvitation._id,
                    email: existingInvitation.email,
                    groupName: existingInvitation.groupName,
                    status: existingInvitation.status,
                    expiresAt: existingInvitation.expiresAt,
                },
            });
        }
        else {
            // No existing invitation found, create new one
            return (0, exports.sendInvitation)(req, res);
        }
    }
    catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ error: 'Failed to resend invitation' });
    }
};
exports.resendInvitation = resendInvitation;
