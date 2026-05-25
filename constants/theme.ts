export const Colors = {
  // Backgrounds — ultra-clean, pure white with faint cool tint
  background: '#F8FAFC',   // slate-50: clinical-clean without feeling cold
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',      // slate-100
  surface: '#E2E8F0',      // slate-200

  // Borders — crisp, neutral
  border: '#E2E8F0',       // slate-200
  borderStrong: '#CBD5E1', // slate-300

  // Accent — sky blue: fresh, trustworthy, health-forward
  accent: '#0EA5E9',                       // sky-500
  accentDim: 'rgba(14, 165, 233, 0.09)',
  accentBright: '#0284C7',                 // sky-600

  // Text — cool slate (crisp, not warm brown)
  text: '#0F172A',         // slate-900
  textSecondary: '#475569', // slate-600
  textTertiary: '#94A3B8',  // slate-400

  // Status colours — vivid but balanced
  normal: '#22C55E',    // green-500 — health-positive, energetic
  elevated: '#F59E0B',  // amber-500
  high: '#EF4444',      // red-500 — clear, readable danger signal
  low: '#3B82F6',       // blue-500 — harmonises with sky accent

  // Tab bar — clean white, accent-coloured active state
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',   // slate-200 hairline separator
  tabActive: '#0EA5E9',      // sky-500 — matches global accent
  tabInactive: '#94A3B8',    // slate-400
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
