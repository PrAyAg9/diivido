# 🤖 AI Assistant Setup Guide

This guide will help you set up the AI-powered voice assistant with Eleven Labs and Gemini API integration.

## 🚀 Features

### Voice Assistant

- **Voice Commands**: Ask Divvy to remind friends, check balances, or split expenses
- **Natural Language Processing**: Powered by Google's Gemini AI
- **Text-to-Speech**: Realistic voice responses using Eleven Labs
- **Smart Expense Suggestions**: AI analyzes descriptions and suggests categories/amounts
- **Humorous Reminders**: Generate witty payment reminders for friends

### Example Voice Commands

- "Remind John about the dinner money"
- "What's my balance?"
- "Help me split the restaurant bill"
- "Send a funny reminder to Sarah about the movie tickets"

## 🔧 Setup Instructions

### 1. Get API Keys

#### Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new project or select existing one
4. Generate an API key
5. Copy the key for later use

#### Eleven Labs API Key

1. Sign up at [Eleven Labs](https://elevenlabs.io/)
2. Go to your profile settings
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the key and voice ID

### 2. Configure Environment Variables

Update your `backend/.env` file:

```bash
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
ELEVEN_LABS_API_KEY=your_eleven_labs_api_key_here
ELEVEN_LABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# Base URL for audio file serving
BASE_URL=http://localhost:5000
```

### 3. Install Dependencies

#### Backend

```bash
cd backend
npm install @google/generative-ai axios
```

#### Frontend

```bash
cd ../
npx expo install expo-av expo-speech expo-blur
```

### 4. Test the AI Assistant

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. Start the React Native app:

```bash
cd ../
npx expo start
```

3. Look for the floating AI assistant button (🤖) in the bottom right corner
4. Tap to open the assistant and try voice commands!

## 🎯 Usage Examples

### Smart Expense Creation

1. Go to "Add Expense"
2. Type a description like "Uber ride to the airport"
3. Watch AI suggest "Transport" category and estimate the amount
4. Get money-saving tips automatically

### Voice Reminders

1. Open the AI assistant
2. Say: "Remind Alex about the pizza money"
3. AI generates a humorous notification
4. Send it to your friend with one tap

### Balance Inquiries

1. Ask: "What's my balance?"
2. Get a conversational summary of what you owe and what's owed to you
3. Hear it spoken aloud with natural voice

## 🔊 Voice Features

### Available Voices

- **Friendly** (Default): Warm and approachable
- **Humorous**: Perfect for funny reminders
- **Professional**: Clear and formal

### Audio Features

- **Real-time TTS**: Convert any text to speech
- **Auto-play**: Responses play automatically
- **Base64 Audio**: Efficient audio delivery
- **Fallback Support**: Works even without API keys (with placeholders)

## 🎨 Customization

### Adding New Voice Commands

Edit `backend/src/controllers/ai.controller.ts` and add new patterns:

```typescript
const parseVoiceCommand = (transcript: string) => {
  const text = transcript.toLowerCase();

  // Add your custom patterns
  if (text.includes('your_command')) {
    return {
      type: 'custom',
      action: 'your_action',
    };
  }
};
```

### Customizing AI Responses

Modify the prompts in the AI controller to change personality:

```typescript
const prompt = `
  You are DividoAI, a [YOUR_PERSONALITY] AI assistant...
  [YOUR_CUSTOM_INSTRUCTIONS]
`;
```

## 🛟 Troubleshooting

### Common Issues

#### "Failed to process voice command"

- Check if Gemini API key is valid
- Ensure backend server is running
- Verify network connectivity

#### "No audio playback"

- Check Eleven Labs API key
- Ensure device audio is enabled
- Try with headphones connected

#### "AI suggestions not working"

- Type longer descriptions (3+ characters)
- Wait for the 1-second debounce
- Check backend logs for errors

### Debug Mode

Enable debug logging in `ai.controller.ts`:

```typescript
console.log('AI Debug:', { transcript, response, audioUrl });
```

## 🚀 Advanced Features

### Push Notifications (Coming Soon)

The AI can generate personalized nudge notifications:

```typescript
// Will integrate with Firebase Cloud Messaging
const notification = {
  title: `💰 Friendly Reminder from ${senderName}`,
  body: aiGeneratedMessage,
  deepLink: 'divido://balance',
};
```

### Voice Conversation Memory

Future versions will remember conversation context for more natural interactions.

### Multi-language Support

Easy to extend with different languages by modifying the Gemini prompts.

## 📱 User Experience

### Floating Assistant

- Always accessible via floating button
- Smooth animations and transitions
- Voice recording with visual feedback
- Quick action buttons for common tasks

### Smart Integration

- Auto-applies AI suggestions
- Contextual recommendations
- Seamless expense creation
- Natural conversation flow

---

🎉 **Enjoy your new AI-powered expense assistant!**

For support or feature requests, please check the main README or create an issue.
