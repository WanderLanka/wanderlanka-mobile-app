/**
 * Colors used throughout the app
 */
export const Colors = {
  // Primary (Green)
  primary: '#059669',
  primary100: '#dcfce7',
  primary300: '#86efac',
  primary500: '#22c55e',
  primary600: '#059669',
  primary700: '#047857',
  primary800: '#065f46',

  // Secondary (Gray)
  secondary50: '#f8fafc',
  secondary200: '#e2e8f0',
  secondary400: '#94a3b8',
  secondary500: '#64748b',
  secondary600: '#475569',
  secondary700: '#334155',

  // Light colors
  light100: '#f1f5f9',
  light200: '#e2e8f0',
  light300: '#cbd5e1',
  light400: '#94a3b8',
  light500: '#64748b',

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Common colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
