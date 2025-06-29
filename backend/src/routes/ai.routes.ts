// src/routes/ai.routes.ts

import express from 'express';
import { auth } from '../middleware/auth';
import { User } from '../models/user.model';
// Change to a default import to get the instance we created above
import aiController from '../controllers/ai.controller';

console.log('Is aiController defined?', aiController);

const router = express.Router();

// Demo middleware to add fake user for testing
const demoAuth = async (req: any, res: any, next: any) => {
  try {
    // Try to find the first user in the database for demo purposes
    const firstUser = await User.findOne().limit(1);

    if (firstUser) {
      req.user = {
        id: firstUser._id.toString(),
        _id: firstUser._id,
        fullName: firstUser.fullName,
        email: firstUser.email,
      };
    } else {
      // If no users exist, create a demo user
      const demoUser = new User({
        fullName: 'Demo User',
        email: 'demo@example.com',
        password: 'demo123', // This won't be used
      });
      await demoUser.save();

      req.user = {
        id: demoUser._id.toString(),
        _id: demoUser._id,
        fullName: demoUser.fullName,
        email: demoUser.email,
      };
    }
    next();
  } catch (error) {
    console.error('Demo auth error:', error);
    // Fallback to a very basic user structure
    req.user = { id: null, fullName: 'Anonymous User' };
    next();
  }
};

// Use demo auth instead of real auth for testing
router.use(demoAuth);

// Because we used arrow functions in the controller, we no longer need .bind()
router.post('/process-voice', aiController.processVoiceCommand);
router.post('/generate-reminder', aiController.generateReminderMessage);
router.get('/balance-summary', aiController.getVoiceBalanceSummary);
router.post('/send-witty-nudge', aiController.sendWittyNudge);
router.post('/text-to-speech', aiController.textToSpeech);
router.post('/expense-suggestions', aiController.getExpenseSuggestions);
router.post('/chat', aiController.chatWithAI);

export default router;
