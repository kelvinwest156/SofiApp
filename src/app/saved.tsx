/**
 * Saved tab
 * Clean list of bookmarked Greek and Hebrew words.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerCard } from '@/components/answer-card';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { speakText, stopSpeaking } from '@/lib/speech';
import { getSavedWords, unsaveWord, type SavedWord } from '@/lib/storage';

export default function SavedScreen() {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSavedWords().then(setWords);
      return () => {
        stopSpeaking();
        setSpeakingId(null);
      };
    }, []),
  );

  function toggleSpeak(word: SavedWord) {
    if (speakingId === word.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(word.id);
    speakText(word.spokenAnswer, {
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }

  async function remove(word: SavedWord) {
    stopSpeaking();
    await unsaveWord(word);
    setWords((current) => current.filter((w) => w.id !== word.id));
    if (openId === word.id) setOpenId(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
      </View>

      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        contentContainerStyle={words.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No saved words yet</Text>
          </View>
        }
        renderItem={({ item }) =>
          openId === item.id ? (
            <View style={styles.expandedCard}>
              <Pressable
                onPress={() => setOpenId(null)}
                style={({ pressed }) => [styles.collapse, pressed && { opacity: 0.6 }]}>
                <Ionicons name="chevron-up" size={16} color={Colors.textSecondary} />
                <Text style={styles.collapseText}>Close</Text>
              </Pressable>
              <AnswerCard
                answer={item}
                hideQuestion
                isSaved
                isSpeaking={speakingId === item.id}
                onToggleSpeak={() => toggleSpeak(item)}
                onToggleSave={() => remove(item)}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setOpenId(item.id)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surfaceSubtle }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowWordLine}>
                  <Text style={styles.rowWord}>{item.originalWord}</Text>
                  <Text style={styles.rowTranslit}>· {item.transliteration}</Text>
                </View>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  “{item.englishWord}” · {item.reference}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </Pressable>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowWordLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  rowWord: {
    fontFamily: Fonts.serifMedium,
    fontSize: 21,
    color: Colors.textPrimary,
  },
  rowTranslit: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowMeta: {
    marginTop: 2,
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textTertiary,
  },
  expandedCard: {
    gap: Spacing.xs,
  },
  collapse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
  },
  collapseText: {
    fontFamily: Fonts.sansMedium,
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
