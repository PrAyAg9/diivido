"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
// Get user profile
router.get('/:userId/profile', auth_1.authMiddleware, user_controller_1.getUserProfile);
// Get all users
router.get('/all', auth_1.authMiddleware, user_controller_1.getAllUsers);
// Update user profile
router.put('/profile', auth_1.authMiddleware, user_controller_1.updateUserProfile);
// Get user balances (how much they owe and are owed)
router.get('/balances', auth_1.authMiddleware, user_controller_1.getUserBalances);
// Get user activity
router.get('/activity', auth_1.authMiddleware, user_controller_1.getUserActivity);
// Get summary statistics for user dashboard
router.get('/summary', auth_1.authMiddleware, (req, res) => {
    // Placeholder route, will be implemented in controller
    res.json({
        totalExpenses: 0,
        pendingPayments: 0,
        recentActivity: 0,
        activeGroups: 0,
    });
});
// Upload avatar
router.post('/avatar', auth_1.authMiddleware, (req, res) => {
    // Placeholder route for file upload
    res.json({ avatarUrl: 'https://via.placeholder.com/150' });
});
exports.default = router;
