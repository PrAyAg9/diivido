"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const ai_controller_1 = require("../controllers/ai.controller");
const router = express_1.default.Router();
// All AI routes require authentication
router.use(auth_1.auth);
// Process voice commands
router.post('/process-voice', ai_controller_1.aiController.processVoiceCommand.bind(ai_controller_1.aiController));
// Generate humorous reminder messages
router.post('/generate-reminder', ai_controller_1.aiController.generateReminderMessage.bind(ai_controller_1.aiController));
// Get voice balance summary
router.get('/balance-summary', ai_controller_1.aiController.getVoiceBalanceSummary.bind(ai_controller_1.aiController));
// Send nudge notifications
router.post('/send-nudge', ai_controller_1.aiController.sendNudgeNotification.bind(ai_controller_1.aiController));
// Text to speech conversion
router.post('/text-to-speech', ai_controller_1.aiController.textToSpeech.bind(ai_controller_1.aiController));
// Get AI suggestions for expenses
router.post('/expense-suggestions', ai_controller_1.aiController.getExpenseSuggestions.bind(ai_controller_1.aiController));
// General AI chat
router.post('/chat', ai_controller_1.aiController.chatWithAI.bind(ai_controller_1.aiController));
exports.default = router;
