import { Request, Response } from 'express';
import { Invitation } from '../models/invitation.model';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { sendInvitationEmail } from '../services/email.service';
import crypto from 'crypto';

//
export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { email, groupId, groupName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists in the system',
        userExists: true 
      });
    }

    // Check if invitation already exists and is pending
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({ 
        error: 'Invitation already sent to this email' 
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const invitation = new Invitation({
      email: email.toLowerCase(),
      invitedBy: userId,
      groupId: groupId || null,
      groupName: groupName || null,
      invitationToken,
      status: 'pending'
    });

    await invitation.save();

    // Get inviter details
    const inviter = await User.findById(userId).select('fullName');
    const inviterName = inviter?.fullName || 'Someone';

    // Send invitation email
    try {
      await sendInvitationEmail({
        email: email.toLowerCase(),
        inviterName,
        groupName,
        invitationToken
      });
      console.log(`Invitation email sent to ${email}`);
    } catch (emailError) {
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
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

// Check if email exists
export const checkEmailExists = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      exists: !!user,
      user: user ? {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl
      } : null
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Failed to check email' });
  }
};

// Get pending invitations for current user
export const getPendingInvitations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invitations = await Invitation.find({
      email: user.email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('invitedBy', 'fullName email avatarUrl');

    res.json({
      invitations: invitations.map(inv => ({
        id: inv._id,
        groupName: inv.groupName,
        invitedBy: inv.invitedBy,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt
      }))
    });
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    res.status(500).json({ error: 'Failed to get pending invitations' });
  }
};

// Respond to invitation
export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invitation = await Invitation.findOne({
      _id: invitationId,
      email: user.email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    // Update invitation status
    invitation.status = action === 'accept' ? 'accepted' : 'declined';
    await invitation.save();

    // If accepted and there's a group, add user to the group
    if (action === 'accept' && invitation.groupId) {
      const group = await Group.findById(invitation.groupId);
      if (group && !group.members.includes(userId)) {
        group.members.push(userId);
        await group.save();
      }
    }

    res.json({
      message: `Invitation ${action}ed successfully`,
      invitation: {
        id: invitation._id,
        status: invitation.status
      }
    });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
};

// Get invitations sent by current user
export const getUserSentInvitations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const invitations = await Invitation.find({
      invitedBy: userId
    }).sort({ createdAt: -1 });

    res.json(invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      groupName: inv.groupName,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt
    })));
  } catch (error) {
    console.error('Error getting sent invitations:', error);
    res.status(500).json({ error: 'Failed to get sent invitations' });
  }
};

// Resend invitation
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { email, groupId, groupName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists in the system',
        userExists: true 
      });
    }

    // Find existing invitation
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      invitedBy: userId
    });

    if (existingInvitation) {
      // Update the existing invitation
      existingInvitation.status = 'pending';
      existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      existingInvitation.invitationToken = crypto.randomBytes(32).toString('hex');
      existingInvitation.groupId = groupId || null;
      existingInvitation.groupName = groupName || null;
      await existingInvitation.save();

      // Get inviter details
      const inviter = await User.findById(userId).select('fullName');
      const inviterName = inviter?.fullName || 'Someone';

      // Send invitation email
      try {
        await sendInvitationEmail({
          email: email.toLowerCase(),
          inviterName,
          groupName,
          invitationToken: existingInvitation.invitationToken
        });
        console.log(`Invitation email resent to ${email}`);
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError);
      }

      res.status(200).json({
        message: 'Invitation resent successfully',
        invitation: {
          id: existingInvitation._id,
          email: existingInvitation.email,
          groupName: existingInvitation.groupName,
          status: existingInvitation.status,
          expiresAt: existingInvitation.expiresAt
        }
      });
    } else {
      // No existing invitation found, create new one
      return sendInvitation(req, res);
    }
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
};
