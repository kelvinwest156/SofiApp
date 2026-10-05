/**
 * AnimatedSplash
 * Elegant, soothing app launch intro.
 * Smoothly blooms the pitch-black iconic 'S' orb into view with a subtle radiant halo,
 * followed by graceful editorial typography and a peaceful fade-out into the app.
 */
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

type Props = {
  onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: Props) {
  const [isDone, setIsDone] = useState(false);

  const [containerOpacity] = useState(() => new Animated.Value(1));
  const [iconScale] = useState(() => new Animated.Value(0.78));
  const [iconOpacity] = useState(() => new Animated.Value(0));
  const [glowScale] = useState(() => new Animated.Value(0.85));
  const [glowOpacity] = useState(() => new Animated.Value(0));
  const [textOpacity] = useState(() => new Animated.Value(0));
  const [textTranslateY] = useState(() => new Animated.Value(12));

  useEffect(() => {
    // Stage 1: Fluid blooming of the icon + subtle radiant glow
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 7,
        tension: 38,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.35,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.15,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowScale, {
        toValue: 1.35,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Reveal the refined brand name & subtitle
    const textTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 450);

    // Stage 3: Graceful transition into main app
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1.06,
          duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsDone(true);
        onFinish();
      });
    }, 1750);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
    };
  }, [
    containerOpacity,
    iconOpacity,
    iconScale,
    glowOpacity,
    glowScale,
    textOpacity,
    textTranslateY,
    onFinish,
  ]);

  if (isDone) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: containerOpacity,
        },
      ]}
      pointerEvents="none">
      {/* Radiant ambient glow ring */}
      <Animated.View
        style={[
          styles.glowHalo,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Center Iconic App Logo */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}>
        <Image
          source={require('@/../assets/images/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand Title & Subtitle */}
      <Animated.View
        style={[
          styles.textBlock,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}>
        <Text style={styles.appName}>Sofi</Text>
        <Text style={styles.tagline}>Scripture Word Companion</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowHalo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.textPrimary,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 22,
  },
  appName: {
    fontFamily: Fonts.serifBold,
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
    marginTop: 4,
  },
});
