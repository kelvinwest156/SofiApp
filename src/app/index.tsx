/**
 * Home tab (Sofi)
 * Minimal, peaceful voice interface.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerCard } from '@/components/answer-card';
import { MicButton, type MicState } from '@/components/mic-button';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { readRecording } from '@/lib/audio';
import { askSofi, type AskInput, type SofiAnswer } from '@/lib/gemini';
import { speakText, stopSpeaking } from '@/lib/speech';
import {
  addConversationTurn,
  getConversationHistory,
  getSettings,
  isWordSaved,
  saveWord,
  unsaveWord,
} from '@/lib/storage';
const MAX_RECORDING_MS = 30_000;

export default function HomeScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [micState, setMicState] = useState<MicState>('idle');
  const [answer, setAnswer] = useState<SofiAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [typedQuestion, setTypedQuestion] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (answer) isWordSaved(answer).then(setIsSaved);

      return () => {
        stopSpeaking();
        setIsSpeaking(false);
      };
    }, [answer]),
  );

  function speak(text: string) {
    setIsSpeaking(true);
    speakText(text, {
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  function toggleSpeak() {
    if (!answer) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speak(answer.spokenAnswer);
    }
  }

  async function ask(input: AskInput) {
    setMicState('thinking');
    setError(null);
    try {
      const [latestSettings, history] = await Promise.all([
        getSettings(),
        getConversationHistory(),
      ]);
      const result = await askSofi(input, latestSettings.model, history);
      setAnswer(result);
      await addConversationTurn(result.question, result);
      setIsSaved(await isWordSaved(result));
      if (latestSettings.autoSpeak && result.spokenAnswer) {
        speak(result.spokenAnswer);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setMicState('idle');
    }
  }

  async function startListening() {
    stopSpeaking();
    setIsSpeaking(false);
    setError(null);

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone access is required.');
      return;
    }

    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setMicState('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      autoStopTimer.current = setTimeout(() => stopAndAsk(), MAX_RECORDING_MS);
    } catch {
      setError("Couldn't start microphone.");
      setMicState('idle');
    }
  }

  async function stopAndAsk() {
    if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
    autoStopTimer.current = null;
    setMicState('thinking');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await recorder.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (!recorder.uri) throw new Error('No recording detected.');
      const audio = await readRecording(recorder.uri);
      await ask({ kind: 'audio', ...audio });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to read audio. Try again.');
      setMicState('idle');
    }
  }

  function onMicPress() {
    if (micState === 'idle') startListening();
    else if (micState === 'listening') stopAndAsk();
  }

  function onSubmitTyped() {
    const text = typedQuestion.trim();
    if (!text || micState !== 'idle') return;
    setTypedQuestion('');
    setShowTyping(false);
    ask({ kind: 'text', text });
  }

  async function toggleSave() {
    if (!answer) return;
    if (isSaved) await unsaveWord(answer);
    else await saveWord(answer);
    setIsSaved(!isSaved);
    Haptics.selectionAsync().catch(() => {});
  }

  function clearAnswer() {
    stopSpeaking();
    setAnswer(null);
    setError(null);
  }

  const hint =
    micState === 'listening'
      ? 'Listening… tap to finish'
      : micState === 'thinking'
        ? 'Studying…'
        : answer
          ? 'Tap to ask another'
          : 'Tap to speak';

  const hasAnswer = !!answer;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>Sofi</Text>
          {hasAnswer && micState === 'idle' && (
            <Pressable
              accessibilityLabel="Clear answer"
              hitSlop={12}
              onPress={clearAnswer}
              style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {hasAnswer ? (
          <ScrollView
            contentContainerStyle={styles.answerScroll}
            showsVerticalScrollIndicator={false}>
            <AnswerCard
              answer={answer}
              isSaved={isSaved}
              isSpeaking={isSpeaking}
              onToggleSave={answer.isWordStudy ? toggleSave : undefined}
              onToggleSpeak={toggleSpeak}
            />
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Microphone area */}
        <View style={[styles.micArea, !hasAnswer && styles.micAreaCentered]}>
          <MicButton state={micState} size={hasAnswer ? 74 : 160} onPress={onMicPress} />
          <Text style={styles.hintText}>{hint}</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Minimal typing option */}
          {micState === 'idle' &&
            (showTyping ? (
              <View style={styles.typeRow}>
                <TextInput
                  style={styles.typeInput}
                  placeholder="Ask a question…"
                  placeholderTextColor={Colors.textTertiary}
                  value={typedQuestion}
                  onChangeText={setTypedQuestion}
                  onSubmitEditing={onSubmitTyped}
                  returnKeyType="send"
                  autoFocus
                />
                <Pressable
                  accessibilityLabel="Send question"
                  style={({ pressed }) => [styles.sendButton, pressed && { opacity: 0.7 }]}
                  onPress={onSubmitTyped}>
                  <Ionicons name="arrow-up" size={18} color={Colors.white} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                hitSlop={12}
                onPress={() => setShowTyping(true)}
                style={styles.typeToggle}>
                <Text style={styles.typeLink}>or type instead</Text>
              </Pressable>
            ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  brandTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  micArea: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  micAreaCentered: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  hintText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorBox: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Fonts.sans,
    color: Colors.danger,
    textAlign: 'center',
    fontSize: 13,
  },
  typeToggle: {
    marginTop: Spacing.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  typeLink: {
    fontFamily: Fonts.sans,
    color: Colors.textTertiary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  typeRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  typeInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
