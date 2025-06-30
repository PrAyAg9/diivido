// src/routes/budget.routes.ts

import express from 'express';
import { auth } from '../middleware/auth';
import budgetController from '../controllers/budget.controller';

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
        email: firstUser.email,
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

// Budget routes
router.post('/suggestions', budgetController.getBudgetSuggestions as any);
router.post('/groups/:groupId/budget', budgetController.setGroupBudget as any);
router.get(
  '/groups/:groupId/budget-status',
  budgetController.getGroupBudgetStatus as any
);
router.delete(
  '/groups/:groupId/budget',
  budgetController.removeGroupBudget as any
);

export default router;
