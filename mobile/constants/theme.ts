export const AppColors = {
  primary: '#3949AB',
  primaryLight: '#5C6BC0',
  primaryDark: '#283593',
  secondary: '#1E88E5',
  secondaryLight: '#42A5F5',
  secondaryDark: '#1565C0',
  accent: '#26A69A',
  accentLight: '#4DB6AC',
  accentDark: '#00897B',
  
  background: '#ECEFF1',
  backgroundDark: '#CFD8DC',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  
  textPrimary: '#0D1B2A',
  textSecondary: '#546E7A',
  textDisabled: '#90A4AE',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  navInactive: '#B0BEC5',
  navBorder: '#ECEFF1',
  divider: '#E0E0E0',
  
  error: '#EF5350',
  errorLight: '#EF9A9A',
  errorDark: '#D32F2F',
  warning: '#FFA726',
  warningLight: '#FFCC80',
  warningDark: '#F57C00',
  success: '#26A69A',
  successLight: '#80CBC4',
  successDark: '#00796B',
  info: '#29B6F6',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  cardBorder: 'rgba(0, 0, 0, 0.05)',
  inputBackground: '#ECEFF1',
  inputFocusBackground: '#FFFFFF',
  
  badgeRed: '#EF5350',
  badgeGreen: '#26A69A',
  badgeOrange: '#FFA726',
  badgePurple: '#7E57C2',
  badgePink: '#EC407A',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomNav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
};

export const ComponentStyles = {
  topBar: {
    height: 64,
    backgroundColor: AppColors.primary,
  },
  bottomNav: {
    height: 88,
    backgroundColor: AppColors.white,
    paddingBottom: 24,
    paddingTop: 8,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  input: {
    backgroundColor: AppColors.inputBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
  },
  button: {
    primary: {
      backgroundColor: AppColors.secondary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: AppColors.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
  },
};

export const Layout = {
  screenPadding: Spacing.md,
  cardGap: Spacing.md,
  sectionGap: Spacing.lg,
};
