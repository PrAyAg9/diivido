"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const user_model_1 = require("../models/user.model");
// Initialize Gemini AI
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
// Eleven Labs API configuration
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_VOICE_ID = process.env.ELEVEN_LABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
class AIController {
    // Process voice commands using Gemini AI
    async processVoiceCommand(req, res) {
        var _a;
        try {
            const { transcript } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!transcript) {
                res.status(400).json({ error: 'Transcript is required' });
                return;
            }
            // Get user context for better AI responses
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // Create context for Gemini
            const context = `
        You are DividoAI, a helpful and witty AI assistant for the Divido expense-splitting app.
        User: ${user.fullName}
        
        Analyze this voice command: "${transcript}"
        
        Provide a helpful, conversational response. Keep it friendly and concise.
        If they want to send reminders, check balances, or split expenses, acknowledge that and offer help.
      `;
            const result = await model.generateContent(context);
            const aiResponse = result.response.text();
            // Generate speech for the response
            const audioUrl = await this.generateSpeech(aiResponse);
            res.json({
                text: aiResponse,
                audioUrl,
                action: {
                    type: 'general',
                    payload: {},
                }
            });
        }
        catch (error) {
            console.error('Error processing voice command:', error);
            res.status(500).json({
                error: 'Failed to process voice command',
                text: "Sorry, I couldn't understand that. Could you try again?"
            });
        }
    }
    // Generate humorous reminder messages using Gemini
    async generateReminderMessage(req, res) {
        var _a;
        try {
            const { targetUser, reason, amount } = req.body;
            const senderUser = await user_model_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            if (!senderUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const prompt = `
        Generate a short, witty, and friendly push notification message to remind ${targetUser} about money.
        Sender: ${senderUser.fullName}
        Reason: ${reason || 'shared expense'}
        ${amount ? `Amount: $${amount}` : ''}
        
        Requirements:
        - Humorous and light-hearted tone
        - Use emojis appropriately
        - Keep under 30 words
        - Make it friendly, not aggressive
        - Include the sender's name
        
        Just return the message text, nothing else.
      `;
            const result = await model.generateContent(prompt);
            const message = result.response.text();
            // Generate audio for the message
            const audioUrl = await this.generateSpeech(message);
            res.json({
                message,
                audioUrl
            });
        }
        catch (error) {
            console.error('Error generating reminder:', error);
            res.status(500).json({ error: 'Failed to generate reminder message' });
        }
    }
    // Get voice balance summary
    async getVoiceBalanceSummary(req, res) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // For now, provide a simple balance summary
            // In production, calculate actual balances from expenses
            const prompt = `
        Create a conversational, friendly balance summary for ${user.fullName}.
        
        Since this is a demo, create a realistic-sounding summary about their expenses and what they owe or are owed.
        Make it sound natural and conversational, like a friend giving an update.
        Keep it concise but informative. Add some personality!
      `;
            const result = await model.generateContent(prompt);
            const summaryText = result.response.text();
            const audioUrl = await this.generateSpeech(summaryText);
            res.json({
                text: summaryText,
                audioUrl,
                balanceData: {
                    totalOwed: 0,
                    totalOwedToUser: 0,
                    netBalance: 0
                }
            });
        }
        catch (error) {
            console.error('Error getting balance summary:', error);
            res.status(500).json({ error: 'Failed to get balance summary' });
        }
    }
    // Send nudge notification
    async sendNudgeNotification(req, res) {
        var _a;
        try {
            const { targetUserId, message } = req.body;
            const senderUser = await user_model_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            const targetUser = await user_model_1.User.findById(targetUserId);
            if (!senderUser || !targetUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // Here you would integrate with your push notification service
            console.log(`Sending nudge from ${senderUser.fullName} to ${targetUser.fullName}: ${message}`);
            res.json({ success: true, message: 'Nudge sent successfully!' });
        }
        catch (error) {
            console.error('Error sending nudge:', error);
            res.status(500).json({ error: 'Failed to send nudge notification' });
        }
    }
    // Convert text to speech using Eleven Labs
    async textToSpeech(req, res) {
        try {
            const { text } = req.body;
            if (!text) {
                res.status(400).json({ error: 'Text is required' });
                return;
            }
            const audioUrl = await this.generateSpeech(text);
            res.json({ audioUrl });
        }
        catch (error) {
            console.error('Error converting text to speech:', error);
            res.status(500).json({ error: 'Failed to convert text to speech' });
        }
    }
    // Get AI suggestions for expenses
    async getExpenseSuggestions(req, res) {
        try {
            const { description } = req.body;
            if (!description) {
                res.status(400).json({ error: 'Description is required' });
                return;
            }
            const prompt = `
        Analyze this expense description and provide smart suggestions: "${description}"
        
        Return a JSON object with:
        - category: best category (food, transport, entertainment, shopping, utilities, other)
        - estimatedAmount: estimated amount if you can infer it (or null)
        - suggestions: array of 3 helpful suggestions to improve the description
        - tips: array of 2 money-saving tips related to this expense type
      `;
            const result = await model.generateContent(prompt);
            let suggestions;
            try {
                suggestions = JSON.parse(result.response.text());
            }
            catch (e) {
                // Fallback if JSON parsing fails
                suggestions = {
                    category: 'other',
                    estimatedAmount: null,
                    suggestions: ['Add more details', 'Include the date', 'Specify the amount'],
                    tips: ['Compare prices before buying', 'Look for discounts and deals']
                };
            }
            res.json(suggestions);
        }
        catch (error) {
            console.error('Error getting expense suggestions:', error);
            res.status(500).json({ error: 'Failed to get expense suggestions' });
        }
    }
    // General AI chat
    async chatWithAI(req, res) {
        var _a;
        try {
            const { message } = req.body;
            const user = await user_model_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const prompt = `
        You are DividoAI, a friendly and witty AI assistant for the Divido expense-splitting app.
        User ${user.fullName} says: "${message}"
        
        Respond in a helpful, conversational way. Keep it short and engaging.
        If they ask about app features, be helpful. If it's casual chat, be fun and witty!
      `;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const audioUrl = await this.generateSpeech(responseText);
            res.json({
                text: responseText,
                audioUrl
            });
        }
        catch (error) {
            console.error('Error in AI chat:', error);
            res.status(500).json({ error: 'Failed to chat with AI' });
        }
    }
    // Helper method to generate speech using Eleven Labs
    async generateSpeech(text, voiceId = ELEVEN_LABS_VOICE_ID) {
        try {
            if (!ELEVEN_LABS_API_KEY) {
                console.warn('Eleven Labs API key not configured, returning placeholder audio URL');
                return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
            }
            const response = await axios_1.default.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.2,
                    use_speaker_boost: true
                }
            }, {
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVEN_LABS_API_KEY
                },
                responseType: 'arraybuffer'
            });
            // Convert to base64 for simple delivery
            const audioBuffer = Buffer.from(response.data);
            const audioBase64 = audioBuffer.toString('base64');
            return `data:audio/mpeg;base64,${audioBase64}`;
        }
        catch (error) {
            console.error('Error generating speech:', error);
            // Return a placeholder audio URL if TTS fails
            return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
        }
    }
}
exports.aiController = new AIController();
