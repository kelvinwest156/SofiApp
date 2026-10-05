/**
 * Settings tab
 * Clean preferences: ElevenLabs voice personality selection, speech rate, auto-speak, and AI model dropdown.
 * (All API keys are read strictly from .env)
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { ELEVEN_VOICES, speakText, stopSpeaking } from '@/lib/speech';
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type Settings,
} from '@/lib/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPEEDS = [
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
];

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Recommended',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Fast',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    badge: 'Ultra Fast',
  },
  {
    id: 'gemini-flash-lite-latest',
    name: 'Gemini Flash-Lite Latest',
    badge: 'Stable Lite',
  },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const refreshSettings = useCallback(() => {
    getSettings().then((s) => {
      setSettings(s);
    });
  }, []);

  useFocusEffect(refreshSettings);

  function update(changes: Partial<Settings>) {
    const next = { ...settings, ...changes };
    setSettings(next);
    saveSettings(next);
  }

  function toggleModelDropdown() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsModelDropdownOpen((prev) => !prev);
    setIsVoiceDropdownOpen(false);
  }

  function toggleVoiceDropdown() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsVoiceDropdownOpen((prev) => !prev);
    setIsModelDropdownOpen(false);
  }

  function selectModel(modelId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    update({ model: modelId });
    setIsModelDropdownOpen(false);
  }

  function selectVoice(voiceId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    update({ elevenLabsVoiceId: voiceId });
    setIsVoiceDropdownOpen(false);
  }

  function testVoice() {
    if (isPreviewing) {
      stopSpeaking();
      setIsPreviewing(false);
      return;
    }

    setIsPreviewing(true);
    speakText('Hello, I am Sofi. Ah-GAH-pay is the ancient Greek word for unconditional love.', {
      onDone: () => setIsPreviewing(false),
      onError: () => setIsPreviewing(false),
    });
  }

  const selectedModelInfo =
    AVAILABLE_MODELS.find((m) => m.id === settings.model) || AVAILABLE_MODELS[0];
  const currentModelDisplayName = selectedModelInfo.name;

  const currentVoiceInfo =
    ELEVEN_VOICES.find((v) => v.id === settings.elevenLabsVoiceId) || ELEVEN_VOICES[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Voice Preferences */}
        <Text style={styles.sectionTitle}>VOICE & PLAYBACK</Text>
        <View style={styles.card}>
          {/* ElevenLabs Voice Personality Selector */}
          <Text style={styles.fieldLabel}>Voice</Text>
          <Pressable
            accessibilityRole="button"
            onPress={toggleVoiceDropdown}
            style={({ pressed }) => [
              styles.dropdownHeader,
              isVoiceDropdownOpen && styles.dropdownHeaderOpen,
              pressed && { opacity: 0.8 },
            ]}>
            <View style={styles.dropdownHeaderLeft}>
              <Text style={styles.dropdownSelectedName}>{currentVoiceInfo.name}</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{currentVoiceInfo.trait}</Text>
              </View>
            </View>
            <Ionicons
              name={isVoiceDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>

          {isVoiceDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {ELEVEN_VOICES.map((v) => {
                const isSelected = settings.elevenLabsVoiceId === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => selectVoice(v.id)}
                    style={({ pressed }) => [
                      styles.modelOption,
                      isSelected && styles.modelOptionSelected,
                      pressed && { opacity: 0.7 },
                    ]}>
                    <View style={styles.dropdownHeaderLeft}>
                      <Text
                        style={[
                          styles.modelOptionName,
                          isSelected && styles.modelOptionNameSelected,
                        ]}>
                        {v.name}
                      </Text>
                      <View
                        style={[
                          styles.badgePill,
                          isSelected && styles.badgePillSelected,
                        ]}>
                        <Text
                          style={[
                            styles.badgeText,
                            isSelected && styles.badgeTextSelected,
                          ]}>
                          {v.trait}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isSelected ? Colors.accent : Colors.border}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.divider} />

          {/* Speed */}
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Speed</Text>
            <View style={styles.speedRow}>
              {SPEEDS.map((s) => {
                const selected = settings.speechRate === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => update({ speechRate: s.value })}
                    style={[styles.speedPill, selected && styles.speedPillSelected]}>
                    <Text style={[styles.speedText, selected && styles.speedTextSelected]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Auto speak */}
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Read answers aloud</Text>
            <Switch
              value={settings.autoSpeak}
              onValueChange={(v) => update({ autoSpeak: v })}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.divider} />

          {/* Preview button */}
          <Pressable
            style={({ pressed }) => [styles.testVoiceBtn, pressed && { opacity: 0.6 }]}
            onPress={testVoice}>
            <Ionicons
              name={isPreviewing ? 'stop-circle-outline' : 'volume-medium-outline'}
              size={18}
              color={Colors.textPrimary}
            />
            <Text style={styles.testVoiceText}>
              {isPreviewing ? 'Stop Preview' : "Preview Voice"}
            </Text>
          </Pressable>
        </View>

        {/* Gemini AI Model */}
        <Text style={styles.sectionTitle}>AI MODEL</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Model"
            onPress={toggleModelDropdown}
            style={({ pressed }) => [
              styles.dropdownHeader,
              isModelDropdownOpen && styles.dropdownHeaderOpen,
              pressed && { opacity: 0.8 },
            ]}>
            <View style={styles.dropdownHeaderLeft}>
              <Text style={styles.dropdownSelectedName}>{currentModelDisplayName}</Text>
              {selectedModelInfo?.badge && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{selectedModelInfo.badge}</Text>
                </View>
              )}
            </View>
            <Ionicons
              name={isModelDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>

          {isModelDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = settings.model === model.id;
                return (
                  <Pressable
                    key={model.id}
                    onPress={() => selectModel(model.id)}
                    style={({ pressed }) => [
                      styles.modelOption,
                      isSelected && styles.modelOptionSelected,
                      pressed && { opacity: 0.7 },
                    ]}>
                    <View style={styles.dropdownHeaderLeft}>
                      <Text
                        style={[
                          styles.modelOptionName,
                          isSelected && styles.modelOptionNameSelected,
                        ]}>
                        {model.name}
                      </Text>
                      <View
                        style={[
                          styles.badgePill,
                          isSelected && styles.badgePillSelected,
                        ]}>
                        <Text
                          style={[
                            styles.badgeText,
                            isSelected && styles.badgeTextSelected,
                          ]}>
                          {model.badge}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isSelected ? Colors.accent : Colors.border}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  fieldLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  speedRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  speedPill: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  speedPillSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  speedText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.textPrimary,
  },
  speedTextSelected: {
    color: Colors.white,
  },
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  testVoiceText: {
    fontFamily: Fonts.sansMedium,
    color: Colors.textPrimary,
    fontSize: 13.5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  dropdownHeaderOpen: {
    backgroundColor: Colors.surfaceHover,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dropdownSelectedName: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  badgePill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgePillSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  badgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  badgeTextSelected: {
    color: Colors.white,
  },
  dropdownMenu: {
    gap: 4,
    paddingTop: 4,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  modelOptionSelected: {
    backgroundColor: Colors.surfaceHover,
  },
  modelOptionName: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.textPrimary,
  },
  modelOptionNameSelected: {
    fontFamily: Fonts.sansSemiBold,
  },
});
