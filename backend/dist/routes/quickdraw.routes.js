"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quickdraw_controller_1 = __importDefault(require("../controllers/quickdraw.controller"));
const router = express_1.default.Router();
// Demo middleware (same as AI routes for consistency)
const demoAuth = async (req, res, next) => {
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
        }
        else {
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
    }
    catch (error) {
        console.error('Demo auth error:', error);
        req.user = { id: null, fullName: 'Anonymous Player' };
        next();
    }
};
// Use demo auth for testing
router.use(demoAuth);
// Quick Draw game routes
router.post('/start', quickdraw_controller_1.default.startQuickDrawGame);
router.post('/join/:gameId', quickdraw_controller_1.default.joinGame);
router.post('/tap/:gameId', quickdraw_controller_1.default.recordTap);
router.get('/status/:gameId', quickdraw_controller_1.default.getGameStatus);
router.post('/cleanup', quickdraw_controller_1.default.cleanupOldGames);
exports.default = router;
