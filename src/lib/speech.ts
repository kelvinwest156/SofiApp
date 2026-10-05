/**
 * speech.ts
 * Unified Speech Engine for Sofi:
 *  - Primary: ElevenLabs Neural AI Voice (hyper-realistic, warm, natural tone)
 *  - Fallback: Device Native Speech (expo-speech) if no ElevenLabs key is configured
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import {
  getEffectiveElevenLabsApiKey,
  getSettings,
} from './storage';

export const ELEVEN_VOICES = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    trait: 'Warm & Calming · Recommended',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    trait: 'Gentle & Soft',
  },
  {
    id: 'LcfcDJNUP1GQjkzn1xUU',
    name: 'Emily',
    trait: 'Serene & Clear',
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    trait: 'Meditative & Peaceful',
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    trait: 'Elegant & Articulate',
  },
];

let activeNativePlayer: AudioPlayer | null = null;
let activeWebAudio: HTMLAudioElement | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

export function stopSpeaking(): void {
  // 1. Stop device speech
  Speech.stop();

  // 2. Stop native audio player
  if (activeNativePlayer) {
    try {
      activeNativePlayer.pause();
      activeNativePlayer.remove();
    } catch {}
    activeNativePlayer = null;
  }

  // 3. Stop web audio
  if (activeWebAudio) {
    try {
      activeWebAudio.pause();
      activeWebAudio.currentTime = 0;
    } catch {}
    activeWebAudio = null;
  }
}

export async function speakText(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onError?: (err: string) => void;
  },
): Promise<void> {
  stopSpeaking();
  if (!text || !text.trim()) return;

  const settings = await getSettings();
  const elevenKey = await getEffectiveElevenLabsApiKey();

  // Use ElevenLabs if key exists and provider is set to elevenlabs
  if (elevenKey && settings.voiceProvider === 'elevenlabs') {
    callbacks?.onStart?.();
    try {
      const voiceId = settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
      const speed = Math.max(0.7, Math.min(1.2, settings.speechRate));

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.85,
            use_speaker_boost: true,
            speed,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg =
          errorData?.detail?.message ||
          (response.status === 401 ? 'Invalid ElevenLabs API key' : 'ElevenLabs request failed');
        throw new Error(errorMsg);
      }

      if (Platform.OS === 'web') {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const webAudio = new Audio(audioUrl);
        activeWebAudio = webAudio;

        webAudio.onended = () => {
          activeWebAudio = null;
          callbacks?.onDone?.();
        };
        webAudio.onerror = () => {
          activeWebAudio = null;
          callbacks?.onError?.('Audio playback failed');
        };

        await webAudio.play();
        return;
      }

      // Mobile (iOS / Android)
      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = arrayBufferToBase64(arrayBuffer);
      const audioUri = `data:audio/mp3;base64,${base64Audio}`;

      const player = createAudioPlayer(audioUri);
      activeNativePlayer = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          activeNativePlayer = null;
          callbacks?.onDone?.();
        }
      });

      player.play();
      return;
    } catch (e) {
      console.warn('ElevenLabs TTS error, falling back to device speech:', e);
      // Fallback to device speech if ElevenLabs failed
    }
  }

  // Fallback to built-in device TTS (expo-speech)
  Speech.speak(text, {
    language: 'en-US',
    rate: settings.speechRate,
    onStart: () => callbacks?.onStart?.(),
    onDone: () => callbacks?.onDone?.(),
    onStopped: () => callbacks?.onDone?.(),
    onError: () => callbacks?.onError?.('Speech playback error'),
  });
}
