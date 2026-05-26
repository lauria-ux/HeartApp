export const Colors = {
  // Background — neutral off-white, exactly like the reference (no colour tint)
  background: '#F5F6FA',
  card: '#FFFFFF',
  cardAlt: '#F0F1F5',
  surface: '#E8E9F0',

  // Borders — almost invisible; shadow carries the depth
  border: '#EEEEEE',
  borderStrong: '#DDDDEA',

  // Accent — vivid electric blue matching the reference exactly
  accent: '#2563EB',
  accentDim: 'rgba(37, 99, 235, 0.08)',
  accentBright: '#1D4ED8',

  // Text — rich near-black for maximum contrast on white cards
  text: '#111111',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Status colours
  normal: '#22C55E',
  elevated: '#F59E0B',
  high: '#EF4444',
  low: '#6366F1',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: 'transparent',
  tabActive: '#2563EB',
  tabInactive: '#9CA3AF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 56,
} as const;

// Inter font family — loaded in app/_layout.tsx
export const FontFamily = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semiBold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;
