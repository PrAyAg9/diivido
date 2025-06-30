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
// Send a new invitation
const sendInvitation = async (req, res) => {
    var _a;
    try {
        const { email, groupId, groupName } = req.body;
        const inviterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!inviterId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const lowercasedEmail = email.toLowerCase();
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({ email: lowercasedEmail });
        if (existingUser) {
            return res.status(400).json({
                error: 'A user with this email already exists.',
                userExists: true,
            });
        }
        // Check for an existing, non-expired invitation
        const existingInvitation = await invitation_model_1.Invitation.findOne({
            email: lowercasedEmail,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });
        if (existingInvitation) {
            return res.status(400).json({
                error: 'An active invitation has already been sent to this email.',
            });
        }
        // Generate a secure invitation token
        const invitationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Create and save the new invitation
        const invitation = new invitation_model_1.Invitation({
            email: lowercasedEmail,
            invitedBy: inviterId,
            groupId: groupId || null,
            groupName: groupName || null,
            invitationToken,
            status: 'pending',
        });
        await invitation.save();
        // Get inviter's name for the email
        const inviter = await user_model_1.User.findById(inviterId).select('fullName');
        const inviterName = (inviter === null || inviter === void 0 ? void 0 : inviter.fullName) || 'Someone';
        // Send the invitation email asynchronously
        (0, email_service_1.sendInvitationEmail)({
            email: lowercasedEmail,
            inviterName,
            groupName,
            invitationToken,
        }).catch(emailError => {
            // Log the error but don't fail the API request
            console.error('Failed to send invitation email:', emailError);
        });
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
        res.status(500).json({ error: 'An unexpected error occurred while sending the invitation.' });
    }
};
exports.sendInvitation = sendInvitation;
// Check if an email is already registered
const checkEmailExists = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email query parameter is required.' });
        }
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() }).select('fullName email avatarUrl');
        res.json({
            exists: !!user,
            user: user ? {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
            } : null,
        });
    }
    catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Failed to check email.' });
    }
};
exports.checkEmailExists = checkEmailExists;
// Get all pending invitations for the currently logged-in user
const getPendingInvitations = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Authenticated user not found.' });
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
        res.status(500).json({ error: 'Failed to retrieve pending invitations.' });
    }
};
exports.getPendingInvitations = getPendingInvitations;
// Respond to an invitation (accept or decline)
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
            return res.status(400).json({ error: 'Invalid action. Must be "accept" or "decline".' });
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Authenticated user not found.' });
        }
        const invitation = await invitation_model_1.Invitation.findOne({
            _id: invitationId,
            email: user.email.toLowerCase(),
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found, is invalid, or has expired.' });
        }
        // Update invitation status
        invitation.status = action === 'accept' ? 'accepted' : 'declined';
        await invitation.save();
        // If accepted and there's a group, add the user to that group
        if (action === 'accept' && invitation.groupId) {
            const group = await group_model_1.Group.findById(invitation.groupId);
            // FIX: Check if user is already a member before adding
            const isAlreadyMember = group === null || group === void 0 ? void 0 : group.members.some(member => member.userId.equals(user._id));
            if (group && !isAlreadyMember) {
                // FIX: Push a correctly structured member object, not just a string ID
                group.members.push({
                    userId: user._id,
                    role: 'member',
                    joinedAt: new Date(),
                });
                await group.save();
            }
        }
        res.json({
            message: `Invitation ${action}ed successfully.`,
            invitation: {
                id: invitation._id,
                status: invitation.status,
            },
        });
    }
    catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ error: 'Failed to respond to invitation.' });
    }
};
exports.respondToInvitation = respondToInvitation;
// Get all invitations sent by the current user
const getUserSentInvitations = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const invitations = await invitation_model_1.Invitation.find({ invitedBy: userId }).sort({ createdAt: -1 });
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
        res.status(500).json({ error: 'Failed to retrieve sent invitations.' });
    }
};
exports.getUserSentInvitations = getUserSentInvitations;
// Resend an invitation
const resendInvitation = async (req, res) => {
    var _a;
    try {
        const { invitationId } = req.params;
        const inviterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!inviterId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const existingInvitation = await invitation_model_1.Invitation.findById(invitationId);
        if (!existingInvitation) {
            return res.status(404).json({ error: 'Invitation not found.' });
        }
        // Check if the person resending is the original inviter
        if (existingInvitation.invitedBy.toString() !== inviterId) {
            return res.status(403).json({ error: 'You are not authorized to resend this invitation.' });
        }
        // Refresh the invitation
        existingInvitation.status = 'pending';
        existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        existingInvitation.invitationToken = crypto_1.default.randomBytes(32).toString('hex');
        await existingInvitation.save();
        const inviter = await user_model_1.User.findById(inviterId).select('fullName');
        const inviterName = (inviter === null || inviter === void 0 ? void 0 : inviter.fullName) || 'Someone';
        // Asynchronously send the new email
        (0, email_service_1.sendInvitationEmail)({
            email: existingInvitation.email,
            inviterName,
            groupName: existingInvitation.groupName,
            invitationToken: existingInvitation.invitationToken,
        }).catch(emailError => {
            console.error('Failed to resend invitation email:', emailError);
        });
        res.status(200).json({
            message: 'Invitation resent successfully',
            invitation: {
                id: existingInvitation._id,
                status: existingInvitation.status,
                expiresAt: existingInvitation.expiresAt,
            },
        });
    }
    catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ error: 'Failed to resend invitation.' });
    }
};
exports.resendInvitation = resendInvitation;
