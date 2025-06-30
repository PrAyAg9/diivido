import { Platform } from 'react-native';

// Configuration for TTS services
const ELEVEN_LABS_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_ELEVEN_LABS_API_KEY || '',
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - natural female voice
  model: 'eleven_multilingual_v2',
};

// Enhanced speech synthesis with Eleven Labs integration
export class WebSpeech {
  private static async speakWithElevenLabs(text: string): Promise<boolean> {
    try {
      if (!ELEVEN_LABS_CONFIG.apiKey) {
        console.log('Eleven Labs API key not configured, falling back to native TTS');
        return false;
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_CONFIG.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_CONFIG.apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: ELEVEN_LABS_CONFIG.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        console.log('Eleven Labs API error:', response.status);
        return false;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };
        audio.play();
      });
    } catch (error) {
      console.log('Eleven Labs error:', error);
      return false;
    }
  }

  static async speak(text: string, options?: any): Promise<boolean> {
    try {
      // Try Eleven Labs first on web if configured
      if (Platform.OS === 'web' && ELEVEN_LABS_CONFIG.apiKey) {
        const elevenLabsSuccess = await this.speakWithElevenLabs(text);
        if (elevenLabsSuccess) {
          console.log('🎵 Divi speaking with Eleven Labs');
          return true;
        }
      }

      if (Platform.OS === 'web') {
        // Fallback to Web Speech API for web
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice options for better female voice
            utterance.rate = options?.rate || 1.0; // Slightly faster
            utterance.pitch = options?.pitch || 1.1;
            utterance.volume = 1;
            
            // Try to use the best available female voice
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
              voice.name.toLowerCase().includes('samantha') ||
              voice.name.toLowerCase().includes('karen') ||
              voice.name.toLowerCase().includes('allison') ||
              voice.name.toLowerCase().includes('female') ||
              voice.name.toLowerCase().includes('woman') ||
              (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us'))
            );
            
            if (femaleVoice) {
              utterance.voice = femaleVoice;
              console.log('🎵 Using voice:', femaleVoice.name);
            }
            
            utterance.onend = () => resolve(true);
            utterance.onerror = () => {
              console.log('Web speech synthesis error');
              resolve(false);
            };
            
            speechSynthesis.speak(utterance);
          });
        } else {
          console.log('Speech synthesis not supported on web');
          return false;
        }
      } else {
        // For mobile platforms, use expo-speech
        try {
          const Speech = await import('expo-speech');
          Speech.speak(text, {
            voice: options?.voice || undefined,
            language: options?.language || 'en-US',
            pitch: options?.pitch || 1.1,
            rate: options?.rate || 1.0, // Slightly faster for mobile too
          });
          console.log('🎵 Divi speaking with expo-speech');
          return true;
        } catch (error) {
          console.log('Expo Speech not available on mobile:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('Speech error:', error);
      return false;
    }
  }

  static stop() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }
}
