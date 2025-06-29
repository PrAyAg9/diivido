"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const invitation_controller_1 = require("../controllers/invitation.controller");
const router = express_1.default.Router();
// Send invitation
router.post('/invite', auth_1.authMiddleware, invitation_controller_1.sendInvitation);
// Resend invitation
router.post('/resend', auth_1.authMiddleware, invitation_controller_1.resendInvitation);
// Check if email exists
router.get('/check-email', auth_1.authMiddleware, invitation_controller_1.checkEmailExists);
// Get pending invitations for current user
router.get('/invitations', auth_1.authMiddleware, invitation_controller_1.getPendingInvitations);
// Get invitations sent by current user
router.get('/user', auth_1.authMiddleware, invitation_controller_1.getUserSentInvitations);
// Respond to invitation
router.post('/invitations/:invitationId/respond', auth_1.authMiddleware, invitation_controller_1.respondToInvitation);
exports.default = router;
