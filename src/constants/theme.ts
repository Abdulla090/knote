import { Platform } from 'react-native';

// ============================================
// COLOR PALETTE
// ============================================
const palette = {
  // Primary — Orange/Amber
  primary50: '#FFF7ED',
  primary100: '#FFEDD5',
  primary200: '#FED7AA',
  primary300: '#FDBA74',
  primary400: '#FB923C',
  primary500: '#F97316',
  primary600: '#EA580C',
  primary700: '#C2410C',
  primary800: '#9A3412',
  primary900: '#7C2D12',

  // Accent — Coral/Rose
  accent50: '#FFF1F2',
  accent100: '#FFE4E6',
  accent200: '#FECDD3',
  accent300: '#FDA4AF',
  accent400: '#FB7185',
  accent500: '#F43F5E',
  accent600: '#E11D48',

  // Success — Emerald
  success50: '#ECFDF5',
  success500: '#10B981',
  success600: '#059669',

  // Warning — Amber
  warning50: '#FFFBEB',
  warning500: '#F59E0B',
  warning600: '#D97706',

  // Error — Rose
  error50: '#FFF1F2',
  error500: '#EF4444',
  error600: '#DC2626',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// ============================================
// DARK THEME
// ============================================
export const darkTheme = {
  colors: {
    // Backgrounds
    background: '#0C0A08',
    backgroundSecondary: '#141210',
    backgroundTertiary: '#1C1916',
    surface: '#181512',
    surfaceElevated: '#211E1A',
    surfacePressed: '#2A2622',

    // Text
    textPrimary: '#F5F0EB',
    textSecondary: '#B0A898',
    textTertiary: '#786F62',
    textInverse: '#0C0A08',

    // Primary
    primary: palette.primary500,
    primaryLight: palette.primary400,
    primaryDark: palette.primary700,
    primarySurface: 'rgba(249, 115, 22, 0.12)',
    primaryBorder: 'rgba(249, 115, 22, 0.25)',

    // Accent
    accent: palette.accent400,
    accentSurface: 'rgba(251, 113, 133, 0.12)',

    // Status
    success: palette.success500,
    successSurface: 'rgba(16, 185, 129, 0.12)',
    warning: palette.warning500,
    warningSurface: 'rgba(245, 158, 11, 0.12)',
    error: palette.error500,
    errorSurface: 'rgba(239, 68, 68, 0.12)',

    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    borderFocused: palette.primary500,

    // Misc
    overlay: 'rgba(0, 0, 0, 0.6)',
    skeleton: 'rgba(255, 255, 255, 0.06)',
    shimmer: 'rgba(255, 255, 255, 0.1)',

    // Tab bar
    tabBar: '#0F0D0B',
    tabBarBorder: 'rgba(255, 255, 255, 0.06)',
    tabActive: palette.primary400,
    tabInactive: '#786F62',

    // Recording
    recording: '#EF4444',
    recordingGlow: 'rgba(239, 68, 68, 0.3)',

    // Folder colors
    folderBlue: '#60A5FA',
    folderPurple: '#A78BFA',
    folderGreen: '#34D399',
    folderOrange: '#FB923C',
    folderPink: '#F472B6',
    folderYellow: '#FBBF24',
    folderRed: '#F87171',
    folderCyan: '#22D3EE',
  },
  isDark: true as const,
};

// ============================================
// LIGHT THEME
// ============================================
export const lightTheme = {
  colors: {
    // Backgrounds
    background: '#FDF8F3',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#F5EDE5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF9F5',
    surfacePressed: '#F5EDE5',

    // Text
    textPrimary: '#1C1410',
    textSecondary: '#78716C',
    textTertiary: '#A8A29E',
    textInverse: '#FFFFFF',

    // Primary
    primary: palette.primary600,
    primaryLight: palette.primary500,
    primaryDark: palette.primary800,
    primarySurface: 'rgba(249, 115, 22, 0.08)',
    primaryBorder: 'rgba(249, 115, 22, 0.2)',

    // Accent
    accent: palette.accent500,
    accentSurface: 'rgba(244, 63, 94, 0.08)',

    // Status
    success: palette.success600,
    successSurface: 'rgba(16, 185, 129, 0.08)',
    warning: palette.warning600,
    warningSurface: 'rgba(245, 158, 11, 0.08)',
    error: palette.error600,
    errorSurface: 'rgba(239, 68, 68, 0.08)',

    // Borders
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.04)',
    borderFocused: palette.primary600,

    // Misc
    overlay: 'rgba(0, 0, 0, 0.4)',
    skeleton: 'rgba(0, 0, 0, 0.06)',
    shimmer: 'rgba(0, 0, 0, 0.08)',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',
    tabActive: palette.primary600,
    tabInactive: '#A8A29E',

    // Recording
    recording: '#EF4444',
    recordingGlow: 'rgba(239, 68, 68, 0.2)',

    // Folder colors
    folderBlue: '#3B82F6',
    folderPurple: '#8B5CF6',
    folderGreen: '#10B981',
    folderOrange: '#F97316',
    folderPink: '#EC4899',
    folderYellow: '#EAB308',
    folderRed: '#EF4444',
    folderCyan: '#06B6D4',
  },
  isDark: false as const,
};

export type AppTheme = typeof darkTheme | typeof lightTheme;
export type ThemeColors = typeof darkTheme.colors;

// ============================================
// TYPOGRAPHY
// ============================================
export const fontFamily = {
  regular: Platform.select({
    ios: 'Rabar_039',
    android: 'Rabar_039',
    default: 'Rabar_039, system-ui, -apple-system, sans-serif',
  })!,
  medium: Platform.select({
    ios: 'Rabar_039',
    android: 'Rabar_039',
    default: 'Rabar_039, system-ui, -apple-system, sans-serif',
  })!,
  semiBold: Platform.select({
    ios: 'Rabar_039',
    android: 'Rabar_039',
    default: 'Rabar_039, system-ui, -apple-system, sans-serif',
  })!,
  bold: Platform.select({
    ios: 'Rabar_039',
    android: 'Rabar_039',
    default: 'Rabar_039, system-ui, -apple-system, sans-serif',
  })!,
  kurdish: Platform.select({
    ios: 'Rabar_039',
    android: 'Rabar_039',
    default: 'Rabar_039, system-ui, sans-serif',
  })!,
  kurdishBold: Platform.select({
    ios: 'Rabar_039',
    android: 'Rabar_039',
    default: 'Rabar_039, system-ui, sans-serif',
  })!,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 26,
  xl: 28,
  '2xl': 32,
  '3xl': 38,
  '4xl': 44,
  '5xl': 56,
};

// ============================================
// SPACING
// ============================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ============================================
// BORDER RADIUS
// ============================================
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  })!,
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  })!,
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  })!,
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    android: { elevation: 10 },
    default: {},
  })!,
  glow: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    })!,
};

// ============================================
// ANIMATION DURATIONS
// ============================================
export const durations = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150 },
};

// ============================================
// LAYOUT
// ============================================
export const layout = {
  screenPaddingHorizontal: spacing.lg,
  tabBarHeight: Platform.select({ ios: 88, android: 68, default: 68 })!,
  headerHeight: Platform.select({ ios: 96, android: 64, default: 64 })!,
  fabSize: 60,
  cardMinHeight: 80,
};
