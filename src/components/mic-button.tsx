/**
 * MicButton
 * Large, tactile, living voice orb.
 *  - idle: Soft pulsating ambient glow that feels alive
 *  - listening: 3-stage expanding concentric ripple waves
 *  - thinking: Gentle breath spinner
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radii } from '@/constants/theme';

export type MicState = 'idle' | 'listening' | 'thinking';

type Props = {
  state: MicState;
  size?: number;
  onPress: () => void;
};

export function MicButton({ state, size = 192, onPress }: Props) {
  const [wave1] = useState(() => new Animated.Value(0));
  const [wave2] = useState(() => new Animated.Value(0));
  const [wave3] = useState(() => new Animated.Value(0));
  const [idlePulse] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));

  // Idle gentle breathing glow
  useEffect(() => {
    if (state !== 'idle') {
      idlePulse.stopAnimation();
      idlePulse.setValue(0);
      return;
    }

    const idleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(idlePulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(idlePulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    idleAnim.start();
    return () => idleAnim.stop();
  }, [state, idlePulse]);

  // Listening: 3-stage staggered ripple waves
  useEffect(() => {
    if (state !== 'listening') {
      wave1.stopAnimation();
      wave2.stopAnimation();
      wave3.stopAnimation();
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      return;
    }

    const anim1 = Animated.loop(
      Animated.timing(wave1, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
    );

    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(wave2, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),
    );

    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(wave3, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [state, wave1, wave2, wave3]);

  function handlePressIn() {
    Animated.spring(pressScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 26,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }

  const idleScale = idlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 1.14],
  });

  const idleOpacity = idlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  const wave1Style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: wave1.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.3, 0.15, 0] }),
    transform: [{ scale: wave1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.95] }) }],
  };

  const wave2Style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: wave2.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.25, 0.12, 0] }),
    transform: [{ scale: wave2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] }) }],
  };

  const wave3Style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity: wave3.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.2, 0.08, 0] }),
    transform: [{ scale: wave3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
  };

  const label =
    state === 'listening' ? 'Stop listening' : state === 'thinking' ? 'Sofi is studying' : 'Tap to speak';

  return (
    <View style={[styles.wrapper, { width: size * 2, height: size * 2 }]}>
      {/* Listening ripples */}
      {state === 'listening' && (
        <>
          <Animated.View style={[styles.wave, wave1Style]} />
          <Animated.View style={[styles.wave, wave2Style]} />
          <Animated.View style={[styles.wave, wave3Style]} />
        </>
      )}

      {/* Idle breathing ambient halo */}
      {state === 'idle' && (
        <Animated.View
          style={[
            styles.idleHalo,
            {
              width: size + 36,
              height: size + 36,
              borderRadius: (size + 36) / 2,
              opacity: idleOpacity,
              transform: [{ scale: idleScale }],
            },
          ]}
        />
      )}

      {/* Core Orb Button */}
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={state === 'thinking'}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.button,
            { width: size, height: size, borderRadius: size / 2 },
            state === 'listening' && styles.buttonListening,
          ]}>
          {state === 'thinking' ? (
            <ActivityIndicator color={Colors.white} size="large" />
          ) : state === 'listening' ? (
            <View style={[styles.stopIcon, { width: size * 0.26, height: size * 0.26 }]} />
          ) : (
            <Ionicons name="mic" size={size * 0.42} color={Colors.white} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    backgroundColor: Colors.accent,
  },
  idleHalo: {
    position: 'absolute',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  button: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  buttonListening: {
    backgroundColor: Colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
  },
  stopIcon: {
    backgroundColor: Colors.white,
    borderRadius: Radii.sm + 2,
  },
});
