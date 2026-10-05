/**
 * AnswerCard
 * An editorial study card with soft typography and soothing layouts.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { SofiAnswer } from '@/lib/gemini';

type Props = {
  answer: SofiAnswer;
  isSaved?: boolean;
  isSpeaking?: boolean;
  onToggleSave?: () => void;
  onToggleSpeak?: () => void;
  hideQuestion?: boolean;
};

export function AnswerCard({
  answer,
  isSaved,
  isSpeaking,
  onToggleSave,
  onToggleSpeak,
  hideQuestion,
}: Props) {
  return (
    <View style={styles.card}>
      {!hideQuestion && !!answer.question && (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>“{answer.question}”</Text>
        </View>
      )}

      {answer.isWordStudy ? (
        <>
          {/* Header Row: Greek/Hebrew script + action buttons */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.originalWord}>{answer.originalWord}</Text>
              <View style={styles.translitRow}>
                <Text style={styles.transliteration}>{answer.transliteration}</Text>
                {!!answer.pronunciation && (
                  <Text style={styles.pronunciation}>·  {answer.pronunciation}</Text>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              {onToggleSpeak && (
                <IconButton
                  icon={isSpeaking ? 'stop' : 'volume-high-outline'}
                  label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  active={isSpeaking}
                  onPress={onToggleSpeak}
                />
              )}
              {onToggleSave && (
                <IconButton
                  icon={isSaved ? 'bookmark' : 'bookmark-outline'}
                  label={isSaved ? 'Remove from saved' : 'Save word'}
                  active={isSaved}
                  onPress={onToggleSave}
                />
              )}
            </View>
          </View>

          {/* Pill tags */}
          <View style={styles.tagWrap}>
            {[
              answer.language,
              answer.strongsNumber,
              answer.partOfSpeech,
              answer.englishWord && `“${answer.englishWord}”`,
            ]
              .filter(Boolean)
              .map((tag) => (
                <View key={String(tag)} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
          </View>

          {/* Meaning */}
          <Section title="Meaning" body={answer.meaning} />

          {/* Scripture Verse Quote */}
          {!!answer.verseText && (
            <View style={styles.verseBox}>
              <View style={styles.verseBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verseText}>{answer.verseText}</Text>
                {!!answer.reference && (
                  <Text style={styles.verseRef}>— {answer.reference} (KJV)</Text>
                )}
              </View>
            </View>
          )}

          {/* Context Insight */}
          <Section title="Biblical Context & Insight" body={answer.context} />
        </>
      ) : (
        <View style={styles.simpleRow}>
          <Text style={styles.simpleText}>{answer.spokenAnswer}</Text>
          {onToggleSpeak && (
            <IconButton
              icon={isSpeaking ? 'stop' : 'volume-high-outline'}
              label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              active={isSpeaking}
              onPress={onToggleSpeak}
            />
          )}
        </View>
      )}
    </View>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function IconButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        active && styles.iconButtonActive,
        pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
      ]}>
      <Ionicons
        name={icon}
        size={20}
        color={active ? Colors.textPrimary : Colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  questionContainer: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  questionText: {
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  originalWord: {
    fontFamily: Fonts.serifMedium,
    fontSize: 42,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  translitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  transliteration: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  pronunciation: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: Colors.surfaceHover,
    borderColor: Colors.border,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 15.5,
    lineHeight: 25,
    color: Colors.textPrimary,
  },
  verseBox: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  verseBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },
  verseText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  verseRef: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.textSecondary,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  simpleText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
});
