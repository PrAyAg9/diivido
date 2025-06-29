import express from 'express';
import { auth } from '../middleware/auth';
import quickDrawController from '../controllers/quickdraw.controller';

const router = express.Router();

// Demo middleware (same as AI routes for consistency)
const demoAuth = async (req: any, res: any, next: any) => {
  try {
    const { User } = require('../models/user.model');
    const firstUser = await User.findOne().limit(1);
    
    if (firstUser) {
      req.user = { 
        id: firstUser._id.toString(), 
        _id: firstUser._id,
        fullName: firstUser.fullName,
        email: firstUser.email
      };
    } else {
      const demoUser = new User({
        fullName: 'Demo Player',
        email: 'demoplayer@example.com',
        password: 'demo123'
      });
      await demoUser.save();
      
      req.user = { 
        id: demoUser._id.toString(), 
        _id: demoUser._id,
        fullName: demoUser.fullName,
        email: demoUser.email
      };
    }
    next();
  } catch (error) {
    console.error('Demo auth error:', error);
    req.user = { id: null, fullName: 'Anonymous Player' };
    next();
  }
};

// Use demo auth for testing
router.use(demoAuth);

// Quick Draw game routes
router.post('/start', quickDrawController.startQuickDrawGame);
router.post('/join/:gameId', quickDrawController.joinGame);
router.post('/tap/:gameId', quickDrawController.recordTap);
router.get('/status/:gameId', quickDrawController.getGameStatus);
router.post('/cleanup', quickDrawController.cleanupOldGames);

export default router;
