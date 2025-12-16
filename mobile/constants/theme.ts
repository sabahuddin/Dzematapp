/**
 * DžematApp Mobile Theme - "Spiritual Tech Indigo"
 * Matches the PWA design system
 */

import { Platform } from 'react-native';

// Primary colors matching PWA
export const AppColors = {
  // Primary - Indigo
  primary: '#3949AB',
  primaryLight: '#5C6BC0',
  primaryDark: '#283593',
  
  // Secondary - Tech Blue
  secondary: '#1E88E5',
  secondaryLight: '#42A5F5',
  secondaryDark: '#1565C0',
  
  // Accent - Teal
  accent: '#26A69A',
  accentLight: '#4DB6AC',
  accentDark: '#00897B',
  
  // Backgrounds
  background: '#ECEFF1',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#0D1B2A',
  textSecondary: '#546E7A',
  
  // Navigation
  navActive: '#3949AB',
  navInactive: '#B0BEC5',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Semantic
  border: '#E0E0E0',
  divider: '#EEEEEE',
  cardShadow: 'rgba(0,0,0,0.05)',
};

export const Colors = {
  light: {
    text: AppColors.textPrimary,
    textSecondary: AppColors.textSecondary,
    background: AppColors.background,
    surface: AppColors.surface,
    tint: AppColors.primary,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.navInactive,
    tabIconSelected: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    accent: AppColors.accent,
    border: AppColors.border,
    success: AppColors.success,
    warning: AppColors.warning,
    error: AppColors.error,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0D1B2A',
    surface: '#1A2332',
    tint: AppColors.secondaryLight,
    icon: '#9BA1A6',
    tabIconDefault: '#687076',
    tabIconSelected: AppColors.secondaryLight,
    primary: AppColors.primaryLight,
    secondary: AppColors.secondaryLight,
    accent: AppColors.accentLight,
    border: '#2A3A4A',
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};
