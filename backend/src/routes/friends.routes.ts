import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from '../controllers/friends.controller';

const router = Router();

// All routes require authentication
router.use(auth);

// Get user's friends and friend requests
router.get('/', getFriends);

// Send friend request
router.post('/request', sendFriendRequest);

// Accept friend request
router.post('/request/:requestId/accept', acceptFriendRequest);

// Reject friend request
router.post('/request/:requestId/reject', rejectFriendRequest);

// Remove friend
router.delete('/:friendId', removeFriend);

// Search users for friend requests
router.get('/search', searchUsers);

export default router;
