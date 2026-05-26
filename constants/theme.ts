export const Colors = {
  // Backgrounds — soft blue-white base, cards float above it
  background: '#EEF2FF',   // indigo-50: warm blue tint like the reference
  card: '#FFFFFF',
  cardAlt: '#F5F7FF',
  surface: '#E0E7FF',      // indigo-100

  // Borders — barely-there; depth comes from shadow, not outlines
  border: '#E8EEFF',
  borderStrong: '#C7D2FE', // indigo-200

  // Accent — vivid royal blue (deeper and bolder than sky)
  accent: '#2563EB',                       // blue-600
  accentDim: 'rgba(37, 99, 235, 0.08)',
  accentBright: '#1D4ED8',                 // blue-700

  // Text — rich near-black for strong contrast on white cards
  text: '#0A1931',
  textSecondary: '#4B5563', // gray-600
  textTertiary: '#9CA3AF',  // gray-400

  // Status colours
  normal: '#22C55E',    // green-500
  elevated: '#F59E0B',  // amber-500
  high: '#EF4444',      // red-500
  low: '#6366F1',       // indigo-500 — harmonises with new accent

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

export const Shadow = {
  sm: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;
