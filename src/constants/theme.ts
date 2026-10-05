/**
 * SofiApp Theme
 * Designed for a warm, soft, calming and fluid reading experience.
 * Soft warm alabaster background, charcoal ink typography, and graceful editorial serif.
 */

export const Colors = {
  // Backgrounds
  background: '#FAF9F6',       // Warm alabaster / porcelain
  surface: '#FFFFFF',          // Pure clean card surface
  surfaceSubtle: '#F2F1EC',    // Soft pill badges & tag backgrounds
  surfaceHover: '#EAE8E1',     // Soft press feedback
  
  // Ink & Typography
  textPrimary: '#1E1D1B',      // Deep warm charcoal (gentler than harsh #000)
  textSecondary: '#6B6862',    // Warm slate
  textTertiary: '#A09D96',     // Faint caption / placeholder
  
  // Borders & Accents
  border: '#E8E6DF',           // Whisper-soft border
  borderSubtle: '#F0EFEA',     // Ultra-light inner divider
  accent: '#1E1D1B',           // Deep charcoal primary actions
  accentMuted: '#3D3B38',
  
  // Functional
  white: '#FFFFFF',
  black: '#1E1D1B',
  danger: '#C84C40',
  success: '#3F7A59',
  
  // Glows & Shadows
  shadow: 'rgba(30, 29, 27, 0.05)',
  shadowElevated: 'rgba(30, 29, 27, 0.08)',
  micGlow: 'rgba(30, 29, 27, 0.08)',
};

export const Fonts = {
  // Editorial Serif for Scripture & Greek/Hebrew typography
  serif: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  serifMedium: 'Lora_500Medium',
  serifSemiBold: 'Lora_600SemiBold',
  serifBold: 'Lora_700Bold',

  // Modern Grotesque Sans for UI & readability
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
};

export const Spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 9999,
};
