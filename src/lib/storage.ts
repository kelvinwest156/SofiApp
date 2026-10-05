/**
 * storage.ts
 * Persists user preferences, conversation context history, and bookmarked words.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SofiAnswer } from './gemini';

export function getEffectiveElevenLabsApiKey(): string | null {
  const envKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY?.trim();
  return envKey || null;
}

// ---------- Settings ----------

export type Settings = {
  model: string;
  speechRate: number;
  autoSpeak: boolean;
  voiceProvider: 'elevenlabs' | 'device';
  elevenLabsVoiceId: string;
};

export const DEFAULT_SETTINGS: Settings = {
  model: 'gemini-2.0-flash',
  speechRate: 1.0,
  autoSpeak: true,
  voiceProvider: 'elevenlabs',
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
};

const SETTINGS_KEY = 'sofi.settings';

const VALID_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const saved = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
    const model =
      saved.model && VALID_MODELS.includes(saved.model)
        ? saved.model
        : DEFAULT_SETTINGS.model;

    return {
      ...saved,
      model,
      voiceProvider: saved.voiceProvider || DEFAULT_SETTINGS.voiceProvider,
      elevenLabsVoiceId: saved.elevenLabsVoiceId || DEFAULT_SETTINGS.elevenLabsVoiceId,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---------- Conversation History (Context Memory) ----------

export type ConversationTurn = {
  id: string;
  timestamp: number;
  question: string;
  answer: SofiAnswer;
};

const HISTORY_KEY = 'sofi.conversationHistory';
const MAX_HISTORY_TURNS = 10;

export async function getConversationHistory(): Promise<ConversationTurn[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ConversationTurn[];
  } catch {
    return [];
  }
}

export async function addConversationTurn(question: string, answer: SofiAnswer): Promise<void> {
  const history = await getConversationHistory();
  const turn: ConversationTurn = {
    id: `${Date.now()}`,
    timestamp: Date.now(),
    question: question || answer.question || 'Word study question',
    answer,
  };
  const updated = [...history, turn].slice(-MAX_HISTORY_TURNS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearConversationHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// ---------- Saved words ----------

export type SavedWord = SofiAnswer & { id: string; savedAt: number };

const SAVED_KEY = 'sofi.savedWords';

function sameWord(a: SofiAnswer, b: SofiAnswer) {
  return a.originalWord === b.originalWord && a.reference === b.reference;
}

export async function getSavedWords(): Promise<SavedWord[]> {
  const raw = await AsyncStorage.getItem(SAVED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedWord[];
  } catch {
    return [];
  }
}

export async function isWordSaved(answer: SofiAnswer): Promise<boolean> {
  const words = await getSavedWords();
  return words.some((w) => sameWord(w, answer));
}

export async function saveWord(answer: SofiAnswer): Promise<void> {
  const words = await getSavedWords();
  if (words.some((w) => sameWord(w, answer))) return;
  const newWord: SavedWord = { ...answer, id: `${Date.now()}`, savedAt: Date.now() };
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify([newWord, ...words]));
}

export async function unsaveWord(answer: SofiAnswer): Promise<void> {
  const words = await getSavedWords();
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(words.filter((w) => !sameWord(w, answer))));
}
