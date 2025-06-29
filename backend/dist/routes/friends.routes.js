"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const friends_controller_1 = require("../controllers/friends.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.auth);
// Get user's friends and friend requests
router.get('/', friends_controller_1.getFriends);
// Send friend request
router.post('/request', friends_controller_1.sendFriendRequest);
// Accept friend request
router.post('/request/:requestId/accept', friends_controller_1.acceptFriendRequest);
// Reject friend request
router.post('/request/:requestId/reject', friends_controller_1.rejectFriendRequest);
// Remove friend
router.delete('/:friendId', friends_controller_1.removeFriend);
// Search users for friend requests
router.get('/search', friends_controller_1.searchUsers);
exports.default = router;
