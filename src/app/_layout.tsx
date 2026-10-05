/**
 * Root layout: loads Google Fonts, theme, and smooth soft tab bar.
 */
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';

import { AnimatedSplash } from '@/components/animated-splash';
import { Colors, Fonts } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SofiTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.textPrimary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

export default function RootLayout() {
  const [showSplashAnimation, setShowSplashAnimation] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={SofiTheme}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.textPrimary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            backgroundColor: Colors.background,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
            height: Platform.select({ ios: 86, android: 68, default: 64 }),
            paddingTop: 8,
            paddingBottom: Platform.select({ ios: 28, android: 12, default: 10 }),
          },
          tabBarLabelStyle: {
            fontFamily: Fonts.sansSemiBold,
            fontSize: 11,
            letterSpacing: 0.2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Sofi',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'mic' : 'mic-outline'} size={size + 1} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      {showSplashAnimation && (
        <AnimatedSplash onFinish={() => setShowSplashAnimation(false)} />
      )}
      </View>
    </ThemeProvider>
  );
}
