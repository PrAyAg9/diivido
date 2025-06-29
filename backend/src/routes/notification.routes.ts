// src/routes/notification.routes.ts

import express from 'express';
import notificationController from '../controllers/notification.controller';

const router = express.Router();

// Demo middleware (same as in ai.routes.ts)
const demoAuth = async (req: any, res: any, next: any) => {
  try {
    const { User } = await import('../models/user.model');
    const firstUser = await User.findOne().limit(1);
    
    if (firstUser) {
      req.user = { 
        id: firstUser._id.toString(), 
        _id: firstUser._id,
        fullName: firstUser.fullName,
        email: firstUser.email
      };
    } else {
      req.user = { id: null, fullName: 'Anonymous User' };
    }
    next();
  } catch (error) {
    console.error('Demo auth error:', error);
    req.user = { id: null, fullName: 'Anonymous User' };
    next();
  }
};

router.use(demoAuth);

// Notification routes
router.post('/register', notificationController.registerDevice);
router.post('/quickdraw', notificationController.sendQuickDrawNotification);
router.post('/nudge', notificationController.sendNudgeNotification);
router.post('/game-result', notificationController.sendGameResultNotification);

export default router;
