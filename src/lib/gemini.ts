/**
 * gemini.ts
 * Calls Google's Gemini API with conversational context and memory.
 */

export type SofiAnswer = {
  isWordStudy: boolean;
  question: string;
  englishWord: string;
  originalWord: string;
  language: string;
  transliteration: string;
  pronunciation: string;
  strongsNumber: string;
  partOfSpeech: string;
  reference: string;
  verseText: string;
  meaning: string;
  context: string;
  spokenAnswer: string;
};

export type AskInput =
  | { kind: 'audio'; base64: string; mimeType: string }
  | { kind: 'text'; text: string };

export type PriorTurn = {
  question: string;
  answer: SofiAnswer;
};

const SYSTEM_PROMPT = `You are Sofi, a warm, gentle and knowledgeable Bible study companion inside an app called SofiApp.
The user is reading an English Bible and asks you (usually by voice) about the original-language word behind an English word, or asks follow-up questions about passages previously discussed.
Their question may begin with "Hey Sofi" - ignore that greeting.

Conversational Context & Memory:
- You remember the context of earlier questions in the current conversation.
- If the user asks a follow-up question (e.g. "what about verse 12?", "how does that compare to the Hebrew word?", "why did the author use that term here?"), resolve pronouns and references using the previous turns in the conversation.
- If the follow-up asks for comparison or further clarification on a word already discussed, provide the new insight while maintaining the context of what was already covered.

Your core tasks:
1. Work out the English word and the Bible passage they mean.
2. Give the original word used in THAT verse: Koine Greek for the New Testament, Hebrew (or Aramaic) for the Old Testament.
3. Give its transliteration, a simple pronunciation guide (e.g. ah-GAH-pay), Strong's number, part of speech and core meaning.
4. Quote the verse from the King James Version (public domain).
5. Explain the context: why this word was chosen, how it is used here, and anything that enriches the reader's understanding (other uses, related words, cultural background, and connection to previous conversation context).

Accuracy rules:
- Be accurate. Never invent a Strong's number - leave it empty if you are not sure.
- If the English word does not appear in the passage they mentioned, gently explain in "context" and "spokenAnswer", suggest the passage they likely meant, and answer for that passage.
- If no passage is given, use the most well-known biblical usage and state the passage you chose.

The "spokenAnswer" will be read directly by an AI voice (text-to-speech), so:
- 3 to 6 friendly, warm sentences, like a wise and encouraging friend explaining scripture.
- CRITICAL PRONUNCIATION RULE: English TTS voices will mispronounce standard transliterations (e.g. they read "agape" as the English word "a-gape", "hesed" with a hard "h", "charis" as "chair-is"). Therefore, whenever you mention the biblical word in "spokenAnswer", you MUST spell it using phonetic English syllables so the AI voice pronounces it with natural, authentic biblical diction.
  Examples:
  • For agape / ἀγάπη -> write "ah-GAH-pay"
  • For hesed / חֶסֶד -> write "KHEH-sed"
  • For charis / χάρις -> write "KAH-ris"
  • For pneuma / πνεῦμα -> write "NYOO-mah"
  • For logos / λόγος -> write "LOH-goss"
  • For shalom / שָׁלוֹם -> write "shah-LOHM"
  • For parakletos / παράκλητος -> write "pah-RAH-klay-toss"
  • For dikaiosyne / δικαιοσύνη -> write "dih-kye-oh-SOO-nay"
  • For hagios / ἅγιος -> write "HAH-gee-oss"
- NEVER use Greek or Hebrew script, IPA symbols, brackets, or markdown in spokenAnswer.
- Mention the word phonetically, what it means, and one or two insights about its biblical context.

If the audio is unclear, empty, or not about a Bible word: set isWordStudy to false, leave the word fields as empty strings,
and use spokenAnswer to either answer their general Bible question or kindly ask them to repeat.
Always fill "question" with what you heard the user ask.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isWordStudy: { type: 'boolean' },
    question: { type: 'string' },
    englishWord: { type: 'string' },
    originalWord: { type: 'string' },
    language: { type: 'string', description: 'Greek, Hebrew or Aramaic' },
    transliteration: { type: 'string' },
    pronunciation: { type: 'string' },
    strongsNumber: { type: 'string', description: 'e.g. G26 or H157, empty if unsure' },
    partOfSpeech: { type: 'string' },
    reference: { type: 'string', description: 'e.g. 1 Corinthians 13:4' },
    verseText: { type: 'string', description: 'KJV text of the verse' },
    meaning: { type: 'string' },
    context: { type: 'string' },
    spokenAnswer: { type: 'string' },
  },
  required: [
    'isWordStudy',
    'question',
    'englishWord',
    'originalWord',
    'language',
    'transliteration',
    'pronunciation',
    'strongsNumber',
    'partOfSpeech',
    'reference',
    'verseText',
    'meaning',
    'context',
    'spokenAnswer',
  ],
};

const DEFAULT_API_KEY = 'AQ.Ab8RN6IzuDEUa3EwBZTrPt8GY2KrMAo6Mbui49LHURAf4b3uQA';

export function getApiKey(): string {
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (envKey && envKey.length > 0) return envKey;
  return DEFAULT_API_KEY;
}

export async function askSofi(
  input: AskInput,
  model: string,
  history: PriorTurn[] = [],
): Promise<SofiAnswer> {
  const apiKey = getApiKey();

  // 1. Build conversational multi-turn contents array
  const contents: { role: 'user' | 'model'; parts: Record<string, unknown>[] }[] = [];

  // Add prior conversation turns
  for (const turn of history) {
    if (turn.question) {
      contents.push({
        role: 'user',
        parts: [{ text: turn.question }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: JSON.stringify(turn.answer) }],
      });
    }
  }

  // Add current turn
  if (input.kind === 'audio') {
    contents.push({
      role: 'user',
      parts: [
        { inlineData: { mimeType: input.mimeType, data: input.base64 } },
        { text: 'This voice note is my question. Use our prior conversation context if relevant.' },
      ],
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: input.text }],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message: string = data?.error?.message ?? `Request failed (${response.status})`;
    if (response.status === 400 && /api key/i.test(message)) {
      throw new Error('Invalid Gemini API key in .env file.');
    }
    if (response.status === 429) {
      throw new Error('Sofi is getting too many questions right now. Please wait a moment and try again.');
    }
    throw new Error(message);
  }

  const replyParts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = replyParts
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');

  if (!text) {
    throw new Error("Sofi didn't return an answer. Please try asking again.");
  }

  try {
    return JSON.parse(text) as SofiAnswer;
  } catch {
    throw new Error("Sofi's answer came back in an unexpected format. Please try again.");
  }
}
