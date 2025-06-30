"use strict";
// src/routes/ai.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_model_1 = require("../models/user.model");
// Change to a default import to get the instance we created above
const ai_controller_1 = __importDefault(require("../controllers/ai.controller"));
console.log('Is aiController defined?', ai_controller_1.default);
const router = express_1.default.Router();
// Demo middleware to add fake user for testing
const demoAuth = async (req, res, next) => {
    try {
        // Try to find the first user in the database for demo purposes
        const firstUser = await user_model_1.User.findOne().limit(1);
        if (firstUser) {
            req.user = {
                id: firstUser._id.toString(),
                _id: firstUser._id,
                fullName: firstUser.fullName,
                email: firstUser.email,
            };
        }
        else {
            // If no users exist, create a demo user
            const demoUser = new user_model_1.User({
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
    }
    catch (error) {
        console.error('Demo auth error:', error);
        // Fallback to a very basic user structure
        req.user = { id: null, fullName: 'Anonymous User' };
        next();
    }
};
// Use demo auth instead of real auth for testing
router.use(demoAuth);
// Because we used arrow functions in the controller, we no longer need .bind()
router.post('/process-voice', ai_controller_1.default.processVoiceCommand);
router.post('/generate-reminder', ai_controller_1.default.generateReminderMessage);
router.get('/balance-summary', ai_controller_1.default.getVoiceBalanceSummary);
router.post('/send-witty-nudge', ai_controller_1.default.sendWittyNudge);
router.post('/text-to-speech', ai_controller_1.default.textToSpeech);
router.post('/expense-suggestions', ai_controller_1.default.getExpenseSuggestions);
router.post('/chat', ai_controller_1.default.chatWithAI);
exports.default = router;
