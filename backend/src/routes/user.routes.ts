import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getUserProfile,
  updateUserProfile,
  getUserBalances,
  getUserActivity,
  getAllUsers,
} from '../controllers/user.controller';

const router = express.Router();

// Get user profile
router.get('/:userId/profile', authMiddleware, getUserProfile);

// Get all users
router.get('/all', authMiddleware, getAllUsers);

// Update user profile
router.put('/profile', authMiddleware, updateUserProfile);

// Get user balances (how much they owe and are owed)
router.get('/balances', authMiddleware, getUserBalances);

// Get user activity
router.get('/activity', authMiddleware, getUserActivity);

// Get summary statistics for user dashboard
router.get('/summary', authMiddleware, (req, res) => {
  // Placeholder route, will be implemented in controller
  res.json({
    totalExpenses: 0,
    pendingPayments: 0,
    recentActivity: 0,
    activeGroups: 0,
  });
});

// Upload avatar
router.post('/avatar', authMiddleware, (req, res) => {
  // Placeholder route for file upload
  res.json({ avatarUrl: 'https://via.placeholder.com/150' });
});

export default router;
