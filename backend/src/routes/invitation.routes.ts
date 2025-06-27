import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  sendInvitation,
  checkEmailExists,
  getPendingInvitations,
  respondToInvitation,
  getUserSentInvitations,
  resendInvitation
} from '../controllers/invitation.controller';

const router = express.Router();

// Send invitation
router.post('/invite', authMiddleware, sendInvitation);

// Resend invitation
router.post('/resend', authMiddleware, resendInvitation);

// Check if email exists
router.get('/check-email', authMiddleware, checkEmailExists);

// Get pending invitations for current user
router.get('/invitations', authMiddleware, getPendingInvitations);

// Get invitations sent by current user  
router.get('/user', authMiddleware, getUserSentInvitations);

// Respond to invitation
router.post('/invitations/:invitationId/respond', authMiddleware, respondToInvitation);

export default router;
