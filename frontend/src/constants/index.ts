import { Platform } from 'react-native';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

// ── Production API URL ─────────────────────────────────────────────────────
// TODO: Replace with your actual deployed backend URL before Play Store release
// Example: 'https://api.zikriyadarbar.com/api'
const PRODUCTION_API_URL = 'https://YOUR_BACKEND_URL_HERE/api';

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : debuggerHost
      ? `http://${localhost}:5000/api`
      : 'http://10.0.2.2:5000/api'
  : PRODUCTION_API_URL;

// ── Premium Color Palette ──────────────────────────────────────────────────
export const COLORS = {
  // Deep navy-blue primary — rich, trustworthy, professional
  primary: '#1C3FAA',
  primaryDark: '#142D80',
  primaryDeep: '#0D1F5C',
  primaryLight: '#E8EEFB',

  // Gold / amber accent — premium feel
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  accentDark: '#B45309',

  // Status colors
  success: '#059669',
  successLight: '#D1FAE5',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',

  // Neutral palette
  white: '#FFFFFF',
  background: '#F0F4FF',   // Soft blue-tinted white — not grey, not plain white
  card: '#FFFFFF',
  surface: '#F8FAFF',

  border: '#E2E8F0',
  borderLight: '#EEF2FF',

  text: '#0D1B2A',   // Very deep navy-black
  textSecondary: '#4B5E7A',
  textMuted: '#94A3B8',

  debit: '#DC2626',
  credit: '#059669',

  // Gradient stop arrays (used with LinearGradient)
  gradientPrimary: ['#1C3FAA', '#142D80', '#0D1F5C'] as string[],
  gradientAccent: ['#F59E0B', '#D97706'] as string[],
  gradientSuccess: ['#059669', '#047857'] as string[],
  gradientCard: ['#FFFFFF', '#F0F4FF'] as string[],
};

// ── Typography ─────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  heavy: 'Poppins-ExtraBold',
};

// ── Spacing ────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Border Radius ──────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  round: 9999,
};

// ── Shadows ────────────────────────────────────────────────────────────────
export const SHADOWS = {
  xs: {
    shadowColor: '#1C3FAA',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1C3FAA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C3FAA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1C3FAA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  primary: {
    shadowColor: '#1C3FAA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  accent: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
};
